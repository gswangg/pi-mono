# gswangg Fork Changelog

All notable changes to the `gswangg/pi-mono` fork, on top of upstream `badlogic/pi-mono`.

## [Unreleased]

No unreleased fork-only changes.

## [0.79.0+gswangg.1] - 2026-06-08

Based on upstream [0.79.0].

### Merged from upstream

- Synced upstream release `v0.79.0`, including extension project trust decisions (`/trust`), security advisories in the prompt widget, neutralized compaction summarization prompts, response-driven keyboard protocol fallback, persistent implicit project trust on reload, exported RPC extension UI types, OpenAI Responses developer-role compat, autocomplete picker re-query on cursor movement, prompt history cursor positioning, package asset path helpers export, removed stale hooks export, and documentation updates (security model, tmux requirement).

### Changed

- Bumped the active fork package version from `0.78.1+gswangg.1` to `0.79.0+gswangg.1`.
- Extended the fork's `tryHandleInteractiveCommand` dispatcher and editor submit handler to route the new upstream `/trust` slash command through the unified `executeCommand` path, so fork integrations (extensions, RPC, tests) see `/trust` like every other built-in command.
- Kept the Anthropic OAuth Claude Code compatibility user-agent at `claude-cli/2.1.143`.
- Kept the fork-only Linux x64/arm64 optional native dependency pins in the root package manifest so clean Linux CI installs can build Tailwind/web-ui and Rollup-dependent packages.

## [0.78.1+gswangg.1] - 2026-06-04

Based on upstream [0.78.1].

### Merged from upstream

- Synced upstream release `v0.78.1`, including the new `ExtensionBindings.mode` plumbing (`tui`/`rpc`/`print`), Ant Ling/MiniMax-M3/ZAI Coding Plan China providers, HTML export URL sanitization, hardened OAuth browser launch handling, hardened git package install paths, scoped auth-file mode on creation, moved temporary extension cache, removed stale Codex models, Gondolin example/containerization guide additions, SECURITY.md, and a refreshed generated model/image-model list.

### Changed

- Bumped the active fork package version from `0.78.0+gswangg.1` to `0.78.1+gswangg.1`.
- Reconciled interactive-mode `bindExtensions` call so both upstream's new `mode: "tui"` and the fork's `executeCommand` / `submitSkill` handlers coexist on the same binding.
- Kept the Anthropic OAuth Claude Code compatibility user-agent at `claude-cli/2.1.143`.
- Kept the fork-only Linux x64/arm64 optional native dependency pins in the root package manifest so clean Linux CI installs can build Tailwind/web-ui and Rollup-dependent packages.

## [0.78.0+gswangg.1] - 2026-05-29

Based on upstream [0.78.0].

### Merged from upstream

- Synced upstream release `v0.78.0`, including hyperlinked file paths in tool titles, early-input buffering before the prompt loop, exported CLI argument parser, explicit-provider-API-key requirement, OpenCode Kimi reasoning parameter handling, Codex SSE body read abort, GitLab Duo thinking metadata fix, OpenRouter Kimi K2.6 developer role fix, ANSI wrapping stack overflow fix, tmux OSC 8 hyperlink forwarding, clipboard binary archive dependency sync, resume-session hint cleanup, hardware cursor doc clarification, and release npm age-gate override documentation.

### Changed

- Bumped the active fork package version from `0.77.0+gswangg.1` to `0.78.0+gswangg.1`.
- Kept the Anthropic OAuth Claude Code compatibility user-agent at `claude-cli/2.1.143`.
- Kept the fork-only Linux x64/arm64 optional native dependency pins in the root package manifest so clean Linux CI installs can build Tailwind/web-ui and Rollup-dependent packages.

## [0.77.0+gswangg.1] - 2026-05-28

Based on upstream [0.77.0].

### Merged from upstream

- Synced upstream release `v0.77.0`, including the exclude-tools option, scoped custom session dir lookups, extension cleanup/terminal restore on signal exits, synthetic Responses message id fixes, Codex replay message id dedup, Kimi/Xiaomi/Opus/GPT thinking metadata updates, CI-published packages, clipboard native addon update, harness tool registry semantics, Anthropic empty thinking signature replay fix, explicit config env references, session work abort during dispose, OpenRouter DeepSeek V4 xhigh reasoning fix, and startup timing attribution fix.

### Changed

- Bumped the active fork package version from `0.76.0+gswangg.1` to `0.77.0+gswangg.1`.
- Kept the Anthropic OAuth Claude Code compatibility user-agent at `claude-cli/2.1.143`.
- Kept the fork-only Linux x64/arm64 optional native dependency pins in the root package manifest so clean Linux CI installs can build Tailwind/web-ui and Rollup-dependent packages.

## [0.76.0+gswangg.1] - 2026-05-27

Based on upstream [0.76.0].

### Merged from upstream

- Synced upstream release `v0.76.0`, including explicit session id naming, Codex SSE header stall timeout, Codex WebSocket timeouts, RPC bash `excludeFromContext` flag, JetBrains terminal capabilities, hyphenated Codex session header, ASCII punctuation/Intl.Segmenter word boundary fixes, hidden provider 429 retry disablement, user image token counting in context estimates, Poolside context overflow detection, Codex Spark context window correction, self-update age gate bypass, user ordered-list marker preservation, workspace dist resolution for internal packages, and various provider/test stability fixes.

### Changed

- Bumped the active fork package version from `0.75.5+gswangg.1` to `0.76.0+gswangg.1`.
- Kept the Anthropic OAuth Claude Code compatibility user-agent at `claude-cli/2.1.143`.
- Reconciled fork's auto-retry classifier with upstream's new `_isNonRetryableProviderLimitError` gate: keep the fork's `bad control character|json.*position` JSON-parse retry patterns while honoring the new non-retryable provider-limit short-circuit.
- Kept the fork-only Linux x64/arm64 optional native dependency pins in the root package manifest so clean Linux CI installs can build Tailwind/web-ui and Rollup-dependent packages.

## [0.75.5+gswangg.1] - 2026-05-23

Based on upstream [0.75.5].

### Merged from upstream

- Synced upstream release `v0.75.5`, including async tool control flow cleanup, read tool collapsed-by-default rendering, pinned git update reconciliation, Bedrock Smithy HTTP handler dependency declaration, Anthropic-compatible adaptive thinking aliases, OAuth device-code callback cleanup, Bun binary clipboard sidecar shipping, OpenCode session headers, footer home abbreviation safety, HTML export attribute escaping, and generated model/image-model refreshes.

### Changed

- Bumped the active fork package version from `0.75.4+gswangg.2` to `0.75.5+gswangg.1`.
- Kept the Anthropic OAuth Claude Code compatibility user-agent at `claude-cli/2.1.143`.
- Kept the fork-only Linux x64/arm64 optional native dependency pins in the root package manifest so clean Linux CI installs can build Tailwind/web-ui and Rollup-dependent packages.

## [0.75.4+gswangg.2] - 2026-05-20

Based on upstream [0.75.4].

### Changed

- Updated the Anthropic OAuth Claude Code compatibility user-agent from `claude-cli/2.1.75` to `claude-cli/2.1.143`.
- Bumped the active fork package version from `0.75.4+gswangg.1` to `0.75.4+gswangg.2`.

## [0.75.4+gswangg.1] - 2026-05-20

Based on upstream [0.75.4].

### Merged from upstream

- Synced upstream release `v0.75.4`, including npm install/release supply-chain hardening, generated CLI shrinkwrap support, TypeScript relative import normalization, update notes, abort restoration fixes, HTTP idle timeout fixes, theme detection improvements, and provider/cache compatibility fixes inherited from upstream packages.

### Changed

- Bumped the active fork package version from `0.75.3+gswangg.1` to `0.75.4+gswangg.1`.
- Kept the fork-only Linux x64/arm64 optional native dependency pins in the root package manifest so clean Linux CI installs can build Tailwind/web-ui and Rollup-dependent packages.

## [0.75.3+gswangg.1] - 2026-05-18

Based on upstream [0.75.3].

### Merged from upstream

- Synced upstream release `v0.75.3`, including the undici HTTP/2 disablement for Node CLI stability.

### Changed

- Bumped the active fork package version from `0.75.2+gswangg.1` to `0.75.3+gswangg.1`.
- Kept the fork-only Linux x64/arm64 optional native dependency pins in the root package manifest so clean Linux CI installs can build Tailwind/web-ui and Rollup-dependent packages.

## [0.75.2+gswangg.1] - 2026-05-18

Based on upstream [0.75.2].

### Merged from upstream

- Synced upstream release `v0.75.2`, including Bun undici startup fixes, Xiaomi reasoning replay compatibility, Windows external editor/self-update fixes, pnpm v11 global install detection, Windows pnpm self-update support, and cross-spawn-based Windows npm-family command execution.

### Changed

- Bumped the active fork package version from `0.75.1+gswangg.1` to `0.75.2+gswangg.1`.
- Kept the fork-only Linux x64/arm64 optional native dependency pins in the root package manifest so clean Linux CI installs can build Tailwind/web-ui and Rollup-dependent packages.

## [0.75.1+gswangg.1] - 2026-05-18

Based on upstream [0.75.1], incorporating upstream [0.74.1] and [0.75.0].

### Merged from upstream

- Synced upstream releases through `v0.75.1`, including image generation support, Together AI provider support, Windows ARM64 binary artifacts, Node 22.19+ requirement, explicit XML prompt/context boundaries, user-scoped npm package installs, undici fetch/proxy fixes, OpenAI Codex model metadata updates, Xiaomi/OpenCode Go/Bedrock provider fixes, config selector sizing fixes, and npm Windows shim handling.

### Changed

- Bumped the active fork package version from `0.74.0+gswangg.1` to `0.75.1+gswangg.1`.
- Kept the fork-only Linux x64/arm64 optional native dependency pins in the root package manifest so clean Linux CI installs can build Tailwind/web-ui and Rollup-dependent packages.

## [0.74.0+gswangg.1] - 2026-05-07

Based on upstream [0.74.0].

### Merged from upstream

- Synced upstream release `v0.74.0`, including the package scope migration from `@mariozechner/*` to `@earendil-works/*`, the next-cycle changelog setup, and the read-tool stats script.

### Changed

- Bumped the active fork package version from `0.73.1+gswangg.1` to `0.74.0+gswangg.1`.
- Updated the fork `publish-gswangg` republish script to rewrite upstream `@earendil-works/*` package references into `@gswangg/*` staged packages.
- Added Linux x64/arm64 optional native packages for Tailwind's `@parcel/watcher`, `@tailwindcss/oxide`, `lightningcss`, and Rollup so clean Linux CI installs can build/test even when the lockfile was generated on another platform.
- Made the self-update package-name fallback test fixture use a future version so it remains valid across fork build-metadata releases.

## [0.73.1+gswangg.1] - 2026-05-07

Based on upstream [0.73.1].

### Merged from upstream

- Synced upstream release `v0.73.1`, including renamed self-update package support, kitty image ID fixes, interleaved/mixed stream event handling, Codex OAuth stderr cleanup, OpenAI Responses reasoning text delta handling, Kimi alias normalization, and the upstream `jiti` 2.7 switch.

### Changed

- Bumped the active fork package version from `0.73.0+gswangg.1` to `0.73.1+gswangg.1`.
- Adjusted the upstream self-update package-name fallback test fixture to request a version newer than the fork's build-metadata version, preserving the fork's "same upstream version is not an update" behavior.

## [0.73.0+gswangg.1] - 2026-05-05

Based on upstream [0.73.0].

### Merged from upstream

- Synced upstream release `v0.73.0`, including incremental bash output streaming, compact read rendering, Codex WebSocket session cleanup/fallback fixes, Xiaomi token-plan providers, environment-sensitive test stabilization, and TUI exact fuzzy-match prioritization.

### Fixed

- Pinned the fork release wake monitor to an explicitly configured target conversation (`~/.pi/agent/state/pi-fork-upstream-watch-target.json`) instead of routing through dynamic current-session state.

### Changed

- Bumped the active fork package version from `0.72.1+gswangg.1` to `0.73.0+gswangg.1`.

## [0.72.1+gswangg.1] - 2026-05-02

Based on upstream [0.72.1].

### Merged from upstream

- Synced upstream release `v0.72.1`, including the Codex transport-option fix and regenerated model metadata.

### Changed

- Bumped the active fork package version from `0.72.0+gswangg.2` to `0.72.1+gswangg.1`.

## [0.72.0+gswangg.2] - 2026-05-02

Based on upstream [0.72.0].

### Fixed

- Preserved `xhigh` thinking support for known GPT-5.2/5.3/5.4/5.5, Claude Opus 4.6/4.7, and DeepSeek V4 identities even when a custom registered model lacks generated `thinkingLevelMap` metadata.
- Ensured Bedrock Claude Opus 4.7 application-profile/custom models map `xhigh` to provider effort `xhigh`, even if copied from Opus 4.6 metadata where `xhigh` maps to `max`.

### Changed

- Bumped the active fork package version from `0.72.0+gswangg.1` to `0.72.0+gswangg.2`.

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
