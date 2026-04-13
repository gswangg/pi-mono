# Slash Control APIs for Extensions

## problem

Extensions can already:
- send chat messages via `pi.sendUserMessage()`
- run session lifecycle actions from command handlers via `ExtensionCommandContext`

That still leaves a gap for extensions that need to drive slash-driven control flow from event handlers, tools, background tasks, or external bridges.

The bad workarounds were:
- `pi.sendUserMessage("/reload")` sends chat input, but does not execute built-in slash commands
- capturing an `ExtensionCommandContext` from some unrelated command handler is brittle and mode-specific
- reimplementing command and skill behavior inside each extension drifts from pi

Remote-control bridges are the clearest example. They need:
- strict command execution for built-ins and extension commands
- queue-aware `/skill:name` submission that behaves like local interactive slash input

## goals

Add first-class extension APIs that:
- reuse pi-owned slash behavior instead of extension-local copies
- keep commands and skills as separate concepts
- preserve interactive-mode queueing semantics for skills
- stay explicit about command execution vs prompt submission
- are available from normal extension code, not only command handlers

## non-goals

Not in this step:
- prompt-template execution through the command API
- arbitrary slash-text emulation
- generic command queueing while streaming
- making every mode support interactive-only UI commands
- changing normal editor submission behavior

## api

```ts
await pi.executeCommand("/reload")
await pi.executeCommand("/compact focus on recent edits")
await pi.executeCommand("/name remote session")

const expanded = pi.expandSkillCommand("/skill:debug logs")
await pi.submitSkill("/skill:debug logs")
```

### `pi.executeCommand(commandLine)`

Scope:
- built-in interactive slash commands
- extension-defined commands

Semantics:
- input must start with `/`
- returns `true` when the command name is recognized and dispatched
- returns `false` when the slash input is not a built-in or extension command in the current mode/session
- does **not** fall back to prompt templates, skills, or plain prompt submission

### `pi.expandSkillCommand(commandLine)`

Scope:
- `/skill:name ...` only

Semantics:
- input must be a known skill invocation
- returns the exact expanded prompt text pi would submit for that skill
- returns `undefined` when the skill is unknown
- useful for bridges that need echo-suppression parity with the eventual expanded local user message

### `pi.submitSkill(commandLine)`

Scope:
- `/skill:name ...` only

Semantics:
- returns `true` when the skill exists and was accepted for submission
- returns `false` when the skill is unknown
- in interactive mode, mirrors local typed-input behavior:
  - idle: submits immediately
  - streaming: queues as `steer`
  - compacting: queues for after compaction
- does **not** execute built-ins, extension commands, prompt templates, or arbitrary slash text

## implementation shape

1. keep interactive built-in command dispatch in a reusable helper
2. expose a separate queue-aware interactive skill-submission helper
3. bind both through `session.bindExtensions(...)`
4. keep editor submit using the same built-in command helper and existing prompt path
5. let bridges compose the two APIs explicitly:
   - `executeCommand()` for commands
   - `expandSkillCommand()` + `submitSkill()` for skills

## immediate use case

This is enough to let remote-control extensions do the honest thing:
- execute `/reload`, `/new`, `/compact`, `/name`, and extension commands without smuggling command context
- submit `/skill:name ...` with the same streaming/compaction semantics as local interactive input
- avoid treating prompt templates or arbitrary slash text as commands

## future follow-ups

Potential later work:
- richer result types for command rejection reasons
- a lower-level SDK surface for slash control
- unifying slash discoverability across interactive, RPC, and bridge surfaces
- deciding whether prompt templates deserve their own explicit submission API
