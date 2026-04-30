#!/usr/bin/env node
import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, renameSync, readdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";

const DEFAULT_INTERVAL_MS = 10 * 60 * 1000;
const DEFAULT_REPO = "/workspace/pi-mono";
const DEFAULT_WAKE_ROOT = join(homedir(), ".pi", "agent", "wake");
const DEFAULT_SESSION_STATE = join(homedir(), ".pi", "agent", "state", "git-provenance-current-session.json");
const DEFAULT_WATCH_STATE = join(homedir(), ".pi", "agent", "state", "pi-fork-upstream-watch.json");
const SOURCE = "pi-fork-upstream-watch";
const TYPE = "upstream_update";

function usage() {
	console.error(`usage: fork-upstream-watch.mjs [options]

Options:
  --repo <path>             pi-mono repo path (default: ${DEFAULT_REPO})
  --wake-root <path>        wake root (default: ${DEFAULT_WAKE_ROOT})
  --session-state <path>    active pi session state file (default: ${DEFAULT_SESSION_STATE})
  --state <path>            watcher state file (default: ${DEFAULT_WATCH_STATE})
  --interval-ms <n>         poll interval (default: ${DEFAULT_INTERVAL_MS})
  --once                    run one poll and exit
  --dry-run                 do not write wake events or update notification state
`);
	process.exit(2);
}

function parseArgs(argv) {
	const options = {
		repo: DEFAULT_REPO,
		wakeRoot: DEFAULT_WAKE_ROOT,
		sessionState: DEFAULT_SESSION_STATE,
		state: DEFAULT_WATCH_STATE,
		intervalMs: DEFAULT_INTERVAL_MS,
		once: false,
		dryRun: false,
	};
	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		const next = () => {
			if (i + 1 >= argv.length) usage();
			return argv[++i];
		};
		if (arg === "--repo") options.repo = next();
		else if (arg === "--wake-root") options.wakeRoot = next();
		else if (arg === "--session-state") options.sessionState = next();
		else if (arg === "--state") options.state = next();
		else if (arg === "--interval-ms") options.intervalMs = Number.parseInt(next(), 10);
		else if (arg === "--once") options.once = true;
		else if (arg === "--dry-run") options.dryRun = true;
		else usage();
	}
	if (!Number.isFinite(options.intervalMs) || options.intervalMs <= 0) usage();
	return options;
}

function readJson(file, fallback) {
	try {
		return JSON.parse(readFileSync(file, "utf8"));
	} catch {
		return fallback;
	}
}

function writeJsonAtomic(file, value) {
	mkdirSync(dirname(file), { recursive: true });
	const tmp = `${file}.tmp-${process.pid}-${randomUUID()}`;
	writeFileSync(tmp, `${JSON.stringify(value, null, 2)}\n`);
	renameSync(tmp, file);
}

function git(repo, args) {
	return execFileSync("git", ["-C", repo, ...args], {
		encoding: "utf8",
		stdio: ["ignore", "pipe", "pipe"],
	}).trim();
}

function isProcessAlive(pid) {
	if (!Number.isInteger(pid) || pid <= 0) return false;
	try {
		process.kill(pid, 0);
		return true;
	} catch {
		return false;
	}
}

function loadActiveSession(sessionStateFile) {
	const state = readJson(sessionStateFile, undefined);
	if (!state || typeof state !== "object") return undefined;
	if (typeof state.sessionId !== "string" || !state.sessionId) return undefined;
	if (!isProcessAlive(state.pid)) return undefined;
	return {
		sessionId: state.sessionId,
		sessionFile: typeof state.sessionFile === "string" ? state.sessionFile : undefined,
		cwd: typeof state.cwd === "string" ? state.cwd : undefined,
		pid: state.pid,
	};
}

function listEventFiles(root) {
	const files = [];
	for (const dirName of ["inbox", "inflight"]) {
		const dir = join(root, dirName);
		if (!existsSync(dir)) continue;
		for (const file of readdirSync(dir)) {
			if (file.endsWith(".json")) files.push(join(dir, file));
		}
	}
	return files;
}

function hasExistingEvent(root, sessionId, upstreamSha) {
	for (const file of listEventFiles(root)) {
		const event = readJson(file, undefined);
		if (!event || typeof event !== "object") continue;
		if (event.source !== SOURCE || event.type !== TYPE) continue;
		if (event.sessionId !== sessionId) continue;
		if (event.payload?.upstreamSha === upstreamSha) return true;
	}
	return false;
}

function safeId(input) {
	return input.replace(/[^A-Za-z0-9._:-]/g, "-").slice(0, 180);
}

function writeWakeEvent(root, event) {
	const inbox = join(root, "inbox");
	mkdirSync(inbox, { recursive: true });
	const target = join(inbox, `${event.id}.json`);
	const tmp = `${target}.tmp-${process.pid}-${randomUUID()}`;
	writeFileSync(tmp, `${JSON.stringify(event, null, 2)}\n`);
	renameSync(tmp, target);
	return target;
}

function makePrompt({ behindCount, upstreamSha, originSha, commits }) {
	const commitList = commits.length > 0 ? commits.map((line) => `- ${line}`).join("\n") : "- (no commit summary available)";
	return `Upstream badlogic/pi-mono has ${behindCount} commit(s) not present in gswangg/pi-mono.

Upstream main: ${upstreamSha}
Fork origin/main: ${originSha}

Recent upstream-only commits:
${commitList}

This is a fork-maintenance wake event. Use auto-continue until the update is truly complete:
1. Call ac status. If auto-continue is disabled, call ac on and keep a concrete task queue for the fork update.
2. Sync /workspace/pi-mono with upstream, resolve conflicts, preserve gswangg fork changes, and bump the fork version.
3. Run local validation without broad local test sweeps: npm run check plus targeted tests as needed.
4. Commit and push with Pi-Session trailers.
5. Run and monitor remote GitHub Actions heavy tests; fix actionable failures.
6. Rebuild/install the local fork and run real stock-config smoke queries against anthropic/claude-opus-4-7 and openai-codex/gpt-5.5 with all extensions loaded.
7. Update memory/docs/changelog as needed.

Only after those are complete should this wake event be acknowledged with wake_done.`;
}

async function poll(options) {
	const repo = resolve(options.repo);
	const wakeRoot = resolve(options.wakeRoot);
	const session = loadActiveSession(resolve(options.sessionState));
	if (!session) {
		console.log(`${new Date().toISOString()} no live pi session state; skipping`);
		return;
	}

	git(repo, ["fetch", "upstream", "main", "--prune"]);
	git(repo, ["fetch", "origin", "main", "--prune"]);

	const upstreamSha = git(repo, ["rev-parse", "upstream/main"]);
	const originSha = git(repo, ["rev-parse", "origin/main"]);
	const behindCount = Number.parseInt(git(repo, ["rev-list", "--count", "origin/main..upstream/main"]), 10);
	const state = readJson(resolve(options.state), { notifications: {} });
	const notificationKey = `${session.sessionId}:${upstreamSha}`;

	if (behindCount <= 0) {
		state.lastClean = { upstreamSha, originSha, checkedAt: new Date().toISOString() };
		if (!options.dryRun) writeJsonAtomic(resolve(options.state), state);
		console.log(`${new Date().toISOString()} clean: origin/main contains upstream/main ${upstreamSha.slice(0, 8)}`);
		return;
	}

	if (state.notifications?.[notificationKey] || hasExistingEvent(wakeRoot, session.sessionId, upstreamSha)) {
		console.log(`${new Date().toISOString()} update already notified for ${upstreamSha.slice(0, 8)} -> ${session.sessionId}`);
		return;
	}

	const commits = git(repo, ["log", "--oneline", "--max-count=20", "origin/main..upstream/main"])
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean);
	const ts = new Date().toISOString();
	const id = safeId(`pi-fork-update-${ts.replace(/[-:.]/g, "")}-${upstreamSha.slice(0, 12)}`);
	const event = {
		id,
		sessionId: session.sessionId,
		ts,
		source: SOURCE,
		type: TYPE,
		priority: 80,
		prompt: makePrompt({ behindCount, upstreamSha, originSha, commits }),
		payload: {
			repo,
			upstreamRemote: "upstream",
			forkRemote: "origin",
			upstreamSha,
			originSha,
			behindCount,
			commits,
			sessionFile: session.sessionFile,
		},
	};

	if (options.dryRun) {
		console.log(JSON.stringify(event, null, 2));
		return;
	}

	const eventFile = writeWakeEvent(wakeRoot, event);
	state.notifications = state.notifications ?? {};
	state.notifications[notificationKey] = { eventId: id, eventFile, upstreamSha, originSha, sentAt: ts };
	writeJsonAtomic(resolve(options.state), state);
	console.log(`${ts} wrote wake event ${basename(eventFile)} for ${behindCount} upstream commit(s)`);
}

const options = parseArgs(process.argv.slice(2));

while (true) {
	try {
		await poll(options);
	} catch (error) {
		const message = error instanceof Error ? error.stack || error.message : String(error);
		console.error(`${new Date().toISOString()} poll failed: ${message}`);
	}
	if (options.once) break;
	await new Promise((resolveTimer) => setTimeout(resolveTimer, options.intervalMs));
}
