# gswangg Fork Changelog

All notable changes to the `gswangg/pi-mono` fork, on top of upstream `badlogic/pi-mono`.

## [Unreleased]

No unreleased fork-only changes.

## [0.72.0+gswangg.1] - 2026-05-02

Based on upstream [0.72.0].

### Merged from upstream

- Synced upstream release `v0.72.0`, including Xiaomi MiMo provider support, model thinking-level metadata, the coding-agent post-turn stop callback, registered model base URL fixes, OpenRouter DeepSeek V4 reasoning handling, and self-update detection repair.

### Changed

- Bumped the active fork package version from `0.71.1+gswangg.1` to `0.72.0+gswangg.1`.

## [0.71.1+gswangg.1] - 2026-05-01

Based on upstream [0.71.1].

### Merged from upstream

- Synced upstream release `v0.71.1`, including the cached OpenAI Codex WebSocket transport for ChatGPT subscription auth and updated subscription-provider notes.

### Changed

- Bumped the active fork package version from `0.71.0+gswangg.1` to `0.71.1+gswangg.1`.

## [0.71.0+gswangg.1] - 2026-04-30

Based on upstream [0.71.0].

### Merged from upstream

- Synced upstream release `v0.71.0`, including Cloudflare AI Gateway provider support, Google Gemini CLI / Antigravity provider removal, WSL clipboard paste fixes, session usage tooling, and upstream removal of the `mom` and `pods` packages.

### Changed

- Bumped the active fork package version from `0.70.6+gswangg.3` to `0.71.0+gswangg.1`.
- Kept the fork wake monitor release-only: it alerts on new stable upstream release tags newer than the fork's coding-agent base version, not on every upstream `main` commit.

## [0.70.6+gswangg.3] - 2026-04-30

Based on upstream [0.70.6] plus upstream main `e91a303c`.

### Merged from upstream

- Synced upstream main from `156a9052` through `e91a303c`, including the attested `@mariozechner/clipboard` dependency update for package-manager trust policies.

### Changed

- Bumped the active fork package version from `0.70.6+gswangg.2` to `0.70.6+gswangg.3`.

## [0.70.6+gswangg.2] - 2026-04-30

Based on upstream [0.70.6] plus upstream main `156a9052`.

### Changed

- Bumped the active fork package version from `0.70.6+gswangg.1` to `0.70.6+gswangg.2`.
- Removed the fork's hardcoded Anthropic subscription-warning no-op and now relies on upstream's `warnings.anthropicExtraUsage: false` setting for Greg's stock config.

### Removed

- Dropped a fork-only z.ai test assertion cleanup that upstream no longer needs.

## [0.70.6+gswangg.1] - 2026-04-30

Based on upstream [0.70.6] plus upstream main `156a9052`.

### Merged from upstream

- Synced upstream main from the prior fork base through `156a9052`, including upstream releases v0.70.3-v0.70.6.

### Changed

- Bumped the active fork package version from `0.70.2+gswangg.1` to `0.70.6+gswangg.1`.
- Preserved the gswangg fork behavior that suppresses the Anthropic subscription auth warning.

### Added

- **Remote heavy-test workflow.** `.github/workflows/fork-heavy-tests.yml` runs repo build/check and package test matrices on GitHub-hosted runners by default, building workspace packages before per-package tests, with a configurable `runner` input / `PI_HEAVY_TEST_RUNNER` repo variable for Blacksmith runner labels once available. Keeps broad test/build sweeps off the EC2 dev box.
- **Pi upstream wake monitor.** `scripts/fork-upstream-watch.mjs` polls `badlogic/pi-mono` upstream vs `gswangg/pi-mono` origin and writes `wake-pi` events to the active pi session when upstream has unmerged commits. Wake prompts explicitly require `ac` until sync, validation, remote tests, local install, and real model acceptance are complete.
- **Pi session commit trailers.** `.husky/commit-msg` chains to `~/.pi/agent/git-template/hooks/commit-msg`, so fork commits made from pi-spawned git commands record `Pi-Session-Id` / `Pi-Session-File` trailers in git log.
- **Message provenance for extension-injected user messages.** Extensions can attach opaque origin metadata via `pi.sendUserMessage(text, { provenance })` and `pi.submitSkill("/skill:...", { provenance })`. Provenance round-trips through queue (steer/followUp), `message_start`/`message_end` events, and session JSONL persistence. Never transported to the LLM. Lets remote-bridge extensions identify their own injections without content-correlation sidecars. ([spec](packages/coding-agent/docs/message-provenance-api.md))
- `MessageProvenance` type is exported from `@mariozechner/pi-coding-agent`.
- **Stale zai test fixture IDs refreshed.** Test files referenced `glm-5`, `glm-4.5-flash`, `glm-4.7-flash`, `glm-4.6v` — none of which exist in the current `models.generated.ts` zai entry. Updated to existing IDs (`glm-5-turbo`, `glm-4.5-air`, `glm-5.1`). Unblocks `npm run check`.
- **`scripts/publish-gswangg.mjs` for republishing fork artifacts under `@gswangg/*`.** Build-then-stage script that copies each package's published surface (package.json + dist + readme/changelog/docs/examples) to `/tmp/pi-mono-publish/<pkg>/`, rewrites `@mariozechner/<our-pkg>` → `@gswangg/<our-pkg>` (targeted to our 4 packages only — `@mariozechner/jiti` and other third-party scoped deps are preserved), then `npm publish --access public --ignore-scripts` from each staged dir. Source tree stays untouched — fork's internal `@mariozechner/*` references are preserved so upstream merges don't conflict on names. See `decisions.md` → "Pi Fork Publishing under @gswangg" for rationale.
- **First @gswangg publish (2026-04-26):** `@gswangg/pi-coding-agent`, `@gswangg/pi-ai`, `@gswangg/pi-tui`, `@gswangg/pi-agent-core` all published at version `0.70.2`. Note: pi-coding-agent's source carries `0.70.2+gswangg.1`, but npm normalizes `+build` metadata away on publish — registry stored as `0.70.2`. Subsequent fork iterations must use prerelease tags instead (scheme: `<next-upstream-patch>-gswangg.<n>`, e.g. `0.70.3-gswangg.1`). See `decisions.md` → "Pi Fork Publishing under @gswangg".

### Scope

- Implementation stays inside `packages/coding-agent/`. The `UserMessage` extension uses TypeScript declaration merging into `@mariozechner/pi-ai`, so `packages/ai/` and `packages/agent/` are not modified.
- Republished packages (minimum set, what `gswangg/pi-remote-control` currently consumes externally + their transitive workspace deps): `@gswangg/pi-coding-agent`, `@gswangg/pi-ai`, `@gswangg/pi-tui`, `@gswangg/pi-agent-core`. Other fork packages (`mom`, `web-ui`, `pods`) are not republished until something consumes them externally.

## [0.67.2+gswangg.1] - 2026-04-14

Based on upstream [0.67.2].

### Fixed

- **JSON streaming errors are now retryable.** Transient SSE parse failures (e.g. "Bad control character in string literal in JSON") no longer halt the agent — pi auto-retries with exponential backoff instead of stopping mid-turn.
- **Upgrade banner no longer fires on fork builds.** The version check now strips semver build metadata (`+gswangg.1`) before comparing against the npm registry, so the "new version available" banner only appears for real upstream releases.

### Removed

- **Suppressed Anthropic subscription auth warning.** The "Third-party usage now draws from extra usage" banner is disabled — unnecessary noise for API key auth workflows.

### Merged from upstream

- Synced with upstream v0.67.2 (from v0.67.1).

## [0.67.1+gswangg.1] - 2026-04-14

Based on upstream [0.67.1].

### Added

- **Extension command execution API.** Extensions can now execute slash commands programmatically via `pi.executeCommand()` in interactive mode, with queue-aware scheduling that respects streaming state. ([spec](packages/coding-agent/docs/command-execution-api.md))
- **Extension skill submission API.** Extensions can submit skills to the agent via `pi.submitSkill()`, with followUp/steer queue integration for non-blocking submission during streaming.
- **Builtin slash commands advertised to extensions.** `pi.getCommands()` now returns both extension-registered and builtin slash commands, giving extensions full visibility into available commands.
- **Unified slash command discovery.** Slash command listing is consistent across interactive mode and RPC surfaces, extracted into a shared `slash-commands.ts` module.

### Changed

- **Fork version metadata.** Package version uses `+gswangg.N` build metadata suffix to distinguish fork builds from upstream releases.
- **System prompt tuning.** Adjusted pi docs prompt wording for Anthropic OAuth flows.

## Stats

| Package | Lines of Code |
|---------|------------:|
| coding-agent | 42,438 |
| ai | 27,039 |
| web-ui | 14,629 |
| tui | 10,820 |
| mom | 4,046 |
| agent | 1,859 |
| pods | 1,773 |
| **Total** | **~168k** |

Fork delta: 9 commits, ~1,043 lines added.
