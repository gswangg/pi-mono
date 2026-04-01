# Command Execution API for Extensions

## problem

Extensions can already:
- send chat messages via `pi.sendUserMessage()`
- run session lifecycle actions from command handlers via `ExtensionCommandContext`

That leaves a gap for extensions that need to initiate slash commands programmatically from event handlers, tools, background tasks, or external control bridges.

Current workarounds are bad:
- `pi.sendUserMessage("/reload")` sends chat input, but does not execute built-in slash commands
- capturing an `ExtensionCommandContext` from some unrelated command handler is brittle and mode-specific
- reimplementing command behavior inside each extension duplicates core logic and drifts from pi behavior

Remote-control bridges are the clearest example. They need an explicit control-plane API for commands like:
- `/reload`
- `/new`
- `/compact`
- `/name`
- extension-defined commands
- skill/template slash commands

## goals

Add a first-class extension API for slash command execution that:
- uses the same command path as real user-entered slash commands
- does not require a captured `ExtensionCommandContext`
- keeps built-in command semantics owned by pi
- is explicit about command execution vs chat-message injection
- is available from normal extension code, not only command handlers

## non-goals

Not in the first step:
- generic queuing of slash commands while streaming
- converting arbitrary plain text into prompts through the same API
- making every mode support every interactive-only UI command
- changing normal editor submission behavior

## proposed api

Add a new extension API method:

```ts
await pi.executeCommand("/reload")
await pi.executeCommand("/compact focus on recent edits")
await pi.executeCommand("/name remote session")
```

Initial semantics:
- input must start with `/`
- executes a slash command through pi's command dispatcher
- returns `true` when the command was recognized and executed
- returns `false` when the command is unknown in the current mode/session
- may throw when execution is invalid in the current state (for example, if a command requires idle state)

## scope for initial implementation

### extension api surface
- add `pi.executeCommand(commandLine: string): Promise<boolean>`
- wire it through the shared extension runtime

### command dispatch
- expose a reusable slash-command execution path in interactive mode instead of keeping built-ins only inside editor submit handling
- support the same slash commands already available to a user typing into the editor
- preserve existing behavior for normal editor submission

### immediate use case

This is enough to let remote-control extensions do:
- execute `/reload` without smuggling command context
- execute `/new` without smuggling command context
- execute `/compact ...`
- execute `/name ...`
- execute extension commands and prompt/skill slash commands when available

## likely implementation shape

1. factor interactive-mode slash-command handling into a reusable method
2. add an extension runtime action that delegates to that method
3. bind the new action during `session.bindExtensions(...)`
4. keep editor submit using the same helper so behavior stays aligned
5. later, decide whether RPC/print should support the same API fully or return `false` for unsupported interactive commands

## future follow-ups

Potential step 2 work after the minimal API lands:
- queued command execution while streaming (`steer` / `followUp` semantics for commands)
- a lower-level `AgentSession.executeCommand()` / SDK surface
- richer result types (`handled`, `cancelled`, `reason`)
- unifying command routing across interactive, RPC, and print modes
