#!/usr/bin/env node
// Republish minimum pi-mono fork packages under the @gswangg/* scope.
// See decisions.md "Pi Fork Publishing under @gswangg" and GSWANGG-CHANGELOG.md.
//
// Defaults to dry-stage: builds + stages each package to /tmp/pi-mono-publish/<pkg>/
// with @mariozechner/* rewritten to @gswangg/*. No network.
//
//   --publish      actually run `npm publish --access public --ignore-scripts`
//                  from each staged dir
//   --dry-run      with --publish, runs `npm publish --dry-run` instead (npm
//                  prints what it would upload but no registry write)
//   --skip-build   skip the leading `npm run build` (assumes each package's
//                  dist/ is already fresh)

import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const STAGE_ROOT = "/tmp/pi-mono-publish";

// Minimum republish set (matches decisions.md). The directory name and the
// published package suffix differ for `agent` (published as pi-agent-core).
const PACKAGES = [
	{ dir: "tui", suffix: "pi-tui" },
	{ dir: "ai", suffix: "pi-ai" },
	{ dir: "agent", suffix: "pi-agent-core" },
	{ dir: "coding-agent", suffix: "pi-coding-agent" },
];

const REWRITE_EXTS = new Set([".js", ".cjs", ".mjs", ".json", ".map", ".md", ".ts"]);
const REWRITE_DTS = ".d.ts";

const args = process.argv.slice(2);
const flags = {
	publish: args.includes("--publish"),
	dryRun: args.includes("--dry-run"),
	skipBuild: args.includes("--skip-build"),
};

// Substring rewrite is unsafe across future package names that might overlap
// (e.g. a hypothetical @mariozechner/pi-ai-extra). Use a negative-lookahead
// regex per target so only exact full-name boundaries match.
const rewriters = PACKAGES.map(({ suffix }) => ({
	re: new RegExp(`@mariozechner/${suffix}(?![A-Za-z0-9_-])`, "g"),
	replacement: `@gswangg/${suffix}`,
}));

function rewriteString(s) {
	for (const { re, replacement } of rewriters) s = s.replace(re, replacement);
	return s;
}

function rewriteFileInPlace(path) {
	const content = readFileSync(path, "utf8");
	const rewritten = rewriteString(content);
	if (rewritten !== content) writeFileSync(path, rewritten);
}

function shouldRewrite(name) {
	if (name.endsWith(REWRITE_DTS)) return true;
	const dot = name.lastIndexOf(".");
	if (dot < 0) return false;
	return REWRITE_EXTS.has(name.slice(dot));
}

function walkRewrite(dir) {
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry);
		const st = statSync(full);
		if (st.isDirectory()) walkRewrite(full);
		else if (st.isFile() && shouldRewrite(entry)) rewriteFileInPlace(full);
	}
}

function stagePackage({ dir, suffix }) {
	const src = join(REPO_ROOT, "packages", dir);
	const dst = join(STAGE_ROOT, dir);
	rmSync(dst, { recursive: true, force: true });
	mkdirSync(dst, { recursive: true });

	// Use `npm pack` to get the exact publishing surface (respects each
	// package's `files` field). --ignore-scripts skips prepack/prepublishOnly
	// because we already built above.
	const tarball = execSync(`npm pack --silent --ignore-scripts --pack-destination ${JSON.stringify(dst)}`, {
		cwd: src,
		encoding: "utf8",
	}).trim();
	const tarballPath = join(dst, tarball);

	execSync(`tar -xzf ${JSON.stringify(tarballPath)} -C ${JSON.stringify(dst)} --strip-components=1`);
	rmSync(tarballPath);

	walkRewrite(dst);

	const stagedPkg = JSON.parse(readFileSync(join(dst, "package.json"), "utf8"));
	const expectedName = `@gswangg/${suffix}`;
	if (stagedPkg.name !== expectedName) {
		throw new Error(
			`Stage of ${dir} produced package name ${stagedPkg.name}, expected ${expectedName}. Rewrite logic is wrong.`,
		);
	}
	return { dir, dst, name: stagedPkg.name, version: stagedPkg.version };
}

if (!flags.skipBuild) {
	console.log("[publish-gswangg] building (npm run build)…");
	execSync("npm run build", { cwd: REPO_ROOT, stdio: "inherit" });
}

console.log(`[publish-gswangg] staging to ${STAGE_ROOT}/`);
rmSync(STAGE_ROOT, { recursive: true, force: true });
mkdirSync(STAGE_ROOT, { recursive: true });

const staged = [];
for (const pkg of PACKAGES) {
	const r = stagePackage(pkg);
	staged.push(r);
	console.log(`  ${pkg.dir.padEnd(14)} ${r.name}@${r.version}  →  ${r.dst}`);
}

if (!flags.publish) {
	console.log("\n[publish-gswangg] dry stage complete. Inspect, then re-run with --publish.");
	console.log("Per-package preview:  (cd /tmp/pi-mono-publish/<pkg> && npm pack --dry-run)");
	process.exit(0);
}

const publishCmd = `npm publish --access public --ignore-scripts${flags.dryRun ? " --dry-run" : ""}`;
console.log(`\n[publish-gswangg] ${publishCmd}`);
for (const { dst, name, version } of staged) {
	console.log(`\n--- ${name}@${version}  (${dst})`);
	execSync(publishCmd, { cwd: dst, stdio: "inherit" });
}
console.log("\n[publish-gswangg] done.");
