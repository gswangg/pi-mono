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
const VERSION_PACKAGE_JSON = "packages/coding-agent/package.json";
const SOURCE = "pi-fork-upstream-watch";
const TYPE = "upstream_release";

function usage() {
	console.error(`usage: fork-upstream-watch.mjs [options]

Wakes the active pi session only when upstream publishes a stable release tag newer
than the fork's coding-agent base version. It intentionally ignores ordinary
upstream/main commits between releases.

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

function parseSemver(input) {
	if (typeof input !== "string") return undefined;
	const withoutPrefix = input.trim().replace(/^v/, "");
	const withoutBuild = withoutPrefix.split("+")[0];
	const prereleaseIndex = withoutBuild.indexOf("-");
	const core = prereleaseIndex === -1 ? withoutBuild : withoutBuild.slice(0, prereleaseIndex);
	const prerelease = prereleaseIndex === -1 ? [] : withoutBuild.slice(prereleaseIndex + 1).split(".");
	const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(core);
	if (!match) return undefined;
	return {
		raw: `${core}${prerelease.length > 0 ? `-${prerelease.join(".")}` : ""}`,
		major: Number.parseInt(match[1], 10),
		minor: Number.parseInt(match[2], 10),
		patch: Number.parseInt(match[3], 10),
		prerelease,
	};
}

function comparePrereleaseIdentifier(a, b) {
	const aNumber = /^\d+$/.test(a) ? Number.parseInt(a, 10) : undefined;
	const bNumber = /^\d+$/.test(b) ? Number.parseInt(b, 10) : undefined;
	if (aNumber !== undefined && bNumber !== undefined) return aNumber - bNumber;
	if (aNumber !== undefined) return -1;
	if (bNumber !== undefined) return 1;
	return a.localeCompare(b);
}

function compareSemver(a, b) {
	for (const key of ["major", "minor", "patch"]) {
		if (a[key] !== b[key]) return a[key] - b[key];
	}
	if (a.prerelease.length === 0 && b.prerelease.length === 0) return 0;
	if (a.prerelease.length === 0) return 1;
	if (b.prerelease.length === 0) return -1;
	const length = Math.max(a.prerelease.length, b.prerelease.length);
	for (let i = 0; i < length; i++) {
		if (a.prerelease[i] === undefined) return -1;
		if (b.prerelease[i] === undefined) return 1;
		const comparison = comparePrereleaseIdentifier(a.prerelease[i], b.prerelease[i]);
		if (comparison !== 0) return comparison;
	}
	return 0;
}

function getPackageVersion(repo, ref) {
	const packageJson = JSON.parse(git(repo, ["show", `${ref}:${VERSION_PACKAGE_JSON}`]));
	if (typeof packageJson.version !== "string" || packageJson.version.length === 0) {
		throw new Error(`${ref}:${VERSION_PACKAGE_JSON} has no string version`);
	}
	return packageJson.version;
}

function listUpstreamReleaseTags(repo) {
	const output = git(repo, ["ls-remote", "--tags", "upstream", "v[0-9]*"]);
	const tags = new Map();
	for (const line of output.split("\n")) {
		if (!line.trim()) continue;
		const [sha, ref] = line.trim().split(/\s+/);
		if (!sha || !ref?.startsWith("refs/tags/")) continue;

		let tagName = ref.slice("refs/tags/".length);
		const peeled = tagName.endsWith("^{}");
		if (peeled) tagName = tagName.slice(0, -3);

		const version = parseSemver(tagName);
		if (!version || version.prerelease.length > 0) continue;

		const entry = tags.get(tagName) ?? { name: tagName, version, sha };
		if (peeled) entry.peeledSha = sha;
		else entry.sha = sha;
		tags.set(tagName, entry);
	}

	return [...tags.values()]
		.map((tag) => ({ ...tag, commitSha: tag.peeledSha ?? tag.sha }))
		.sort((a, b) => compareSemver(b.version, a.version));
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

function hasExistingEvent(root, sessionId, releaseTag) {
	for (const file of listEventFiles(root)) {
		const event = readJson(file, undefined);
		if (!event || typeof event !== "object") continue;
		if (event.source !== SOURCE || event.type !== TYPE) continue;
		if (event.sessionId !== sessionId) continue;
		if (event.payload?.releaseTag === releaseTag) return true;
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

function makePrompt({ commitCount, commits, forkVersion, originSha, releaseSha, releaseTag, upstreamVersion }) {
	const commitList = commits.length > 0 ? commits.map((line) => `- ${line}`).join("\n") : "- (no commit summary available)";
	return `Upstream badlogic/pi-mono has released ${upstreamVersion}, newer than gswangg/pi-mono's current base ${forkVersion}.

Release tag: ${releaseTag}
Release commit: ${releaseSha}
Fork origin/main: ${originSha}
Release commits not present in fork: ${commitCount}

Recent release commits not present in fork:
${commitList}

This is a fork-maintenance wake event. Use auto-continue until the update is truly complete:
1. Call ac status. If auto-continue is disabled, call ac on and keep a concrete task queue for the fork update.
2. Sync /workspace/pi-mono to upstream release tag ${releaseTag} (not arbitrary upstream/main), resolve conflicts, preserve gswangg fork changes, and bump the fork version.
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
	git(repo, ["fetch", "upstream", "--tags", "--prune"]);
	git(repo, ["fetch", "origin", "main", "--prune"]);

	const releaseTags = listUpstreamReleaseTags(repo);
	const latestRelease = releaseTags[0];
	if (!latestRelease) throw new Error("no upstream release tags found");

	const releaseSha = git(repo, ["rev-parse", `${latestRelease.name}^{commit}`]);
	const originSha = git(repo, ["rev-parse", "origin/main"]);
	const forkVersion = getPackageVersion(repo, "origin/main");
	const forkSemver = parseSemver(forkVersion);
	if (!forkSemver) throw new Error(`origin/main ${VERSION_PACKAGE_JSON} version is not semver: ${forkVersion}`);

	const state = readJson(resolve(options.state), { notifications: {} });
	const notificationKey = `${session.sessionId}:${latestRelease.name}`;
	const checkedAt = new Date().toISOString();

	if (compareSemver(latestRelease.version, forkSemver) <= 0) {
		state.lastClean = {
			upstreamVersion: latestRelease.version.raw,
			releaseTag: latestRelease.name,
			releaseSha,
			originVersion: forkVersion,
			originSha,
			checkedAt,
		};
		if (!options.dryRun) writeJsonAtomic(resolve(options.state), state);
		console.log(
			`${checkedAt} clean: latest upstream release ${latestRelease.name} (${latestRelease.version.raw}) is not newer than fork ${forkVersion}`,
		);
		return;
	}

	if (state.notifications?.[notificationKey] || hasExistingEvent(wakeRoot, session.sessionId, latestRelease.name)) {
		console.log(`${checkedAt} release already notified for ${latestRelease.name} -> ${session.sessionId}`);
		return;
	}

	const commitCount = Number.parseInt(git(repo, ["rev-list", "--count", `origin/main..${latestRelease.name}`]), 10);
	const commits = git(repo, ["log", "--oneline", "--max-count=20", `origin/main..${latestRelease.name}`])
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean);
	const id = safeId(`pi-fork-release-${checkedAt.replace(/[-:.]/g, "")}-${latestRelease.name}`);
	const event = {
		id,
		sessionId: session.sessionId,
		ts: checkedAt,
		source: SOURCE,
		type: TYPE,
		priority: 80,
		prompt: makePrompt({
			commitCount,
			commits,
			forkVersion,
			originSha,
			releaseSha,
			releaseTag: latestRelease.name,
			upstreamVersion: latestRelease.version.raw,
		}),
		payload: {
			repo,
			upstreamRemote: "upstream",
			forkRemote: "origin",
			releaseTag: latestRelease.name,
			upstreamVersion: latestRelease.version.raw,
			releaseSha,
			originVersion: forkVersion,
			originSha,
			commitCount,
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
	state.notifications[notificationKey] = {
		eventId: id,
		eventFile,
		releaseTag: latestRelease.name,
		upstreamVersion: latestRelease.version.raw,
		releaseSha,
		originVersion: forkVersion,
		originSha,
		sentAt: checkedAt,
	};
	writeJsonAtomic(resolve(options.state), state);
	console.log(`${checkedAt} wrote wake event ${basename(eventFile)} for upstream release ${latestRelease.name}`);
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
