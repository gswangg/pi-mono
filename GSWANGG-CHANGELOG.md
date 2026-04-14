# gswangg Fork Changelog

All notable changes to the `gswangg/pi-mono` fork, on top of upstream `badlogic/pi-mono`.

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
