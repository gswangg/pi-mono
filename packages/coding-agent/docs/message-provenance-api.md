# Message Provenance for Extension-Injected User Messages

## problem

Extensions can inject user messages into a live session with `pi.sendUserMessage(text, { deliverAs })`. The injected text enters the session and is emitted back to **every** extension via `message_start` / `message_end`. That is correct for most uses, but it creates a real problem for bridges that mirror the session to an external surface.

The clearest case is a remote-control bridge:

1. Remote client sends a user message to the bridge with some external UUID.
2. Bridge calls `pi.sendUserMessage(text)` to inject the message locally.
3. Pi emits `message_end` with the resulting local user message.
4. The bridge's own `message_end` handler sees that user message and wants to forward it outward as a Claude-like event — but forwarding it would echo the remote's own message back to itself.

The bridge has no stable identifier tying the locally-emitted user message back to the originating remote event. Today it has to fall back to content-based correlation sidecars (normalize text, remember `beforeEntryCount`, match after emission, persist a binding table across reloads). That code exists purely because the extension API discards the origin of an injected message.

## goal

Let extensions attach opaque provenance metadata when they inject a user message, so that downstream extension handlers can identify the origin of the resulting user message without content-correlation hacks.

The bridge flow becomes:

1. Remote sends user message with external UUID `U`.
2. Bridge calls `pi.sendUserMessage(text, { provenance: { source: "extension.pi-remote-control", externalId: U } })`.
3. Pi emits `message_end` with `message.provenance.externalId === U` and `message.provenance.source === "extension.pi-remote-control"`.
4. Any extension (including the bridge itself) can read `message.provenance` and know exactly which external event caused this local user message.

No sidecar, no content correlation, no reload binding table.

## non-goals

- No authenticity guarantees. Provenance is cooperative metadata. Any extension can set any source. Trust decisions belong to the consumer.
- No flow for assistant or tool-result messages. Scoped to `UserMessage` only.
- No transport to the LLM. Provenance is metadata, not prompt content. Provider adapters reconstruct messages from `role` + `content`, so provenance never leaks to the model.
- No schema for what lives under `metadata`. That is per-source.

## api

### type

The `MessageProvenance` type is defined in `packages/coding-agent/src/core/messages.ts`:

```ts
export interface MessageProvenance {
    /**
     * Well-known identifier for the originating system.
     * Convention: dot-separated, lowercase. Extensions should use "extension.<package>".
     * Examples: "extension.pi-remote-control", "channel.whatsapp", "cron.nightly-review".
     */
    source: string;

    /**
     * Opaque external identifier stable within `source`.
     * E.g. the upstream remote UUID, a webhook delivery id, a cron run id.
     */
    externalId?: string;

    /**
     * Free-form metadata. Shape is per-source.
     */
    metadata?: Record<string, unknown>;
}
```

The optional field is attached to `UserMessage` via TypeScript declaration merging into `@mariozechner/pi-ai`, following the same pattern already used for custom message roles:

```ts
declare module "@mariozechner/pi-ai" {
    interface UserMessage {
        /** Optional origin metadata for extension-injected or bridged user messages. */
        provenance?: MessageProvenance;
    }
}
```

This keeps the fork's blast radius inside `packages/coding-agent/`. No edits to `packages/ai/` or `packages/agent/` are required.

### extension api

```ts
// Inject a user message with provenance attached.
pi.sendUserMessage(content, {
    deliverAs: "steer",
    provenance: {
        source: "extension.pi-remote-control",
        externalId: remoteUuid,
    },
});

// Submit a /skill invocation with provenance attached to the expanded prompt.
await pi.submitSkill("/skill:debug logs", {
    provenance: {
        source: "extension.pi-remote-control",
        externalId: remoteUuid,
    },
});
```

Both signatures gain a `provenance` option. The change is strictly additive; callers that don't set it see no behavior change.

### guarantees

1. **Round-trip through events.** If an extension injects a user message with provenance `P`, the subsequent `message_start` and `message_end` events carry the same user message with `message.provenance` equal to `P`.
2. **Round-trip through queues.** The guarantee holds whether the message is delivered immediately (idle), steered into the active turn (`deliverAs: "steer"`), or queued as a follow-up (`deliverAs: "followUp"`).
3. **Round-trip through the transcript.** Provenance is persisted verbatim into the session JSONL as part of the user message and restored on load. Reloading the session preserves `message.provenance`.
4. **Opaque to the LLM.** Provider adapters reconstruct LLM-bound messages from `role` + `content`. Provenance is never sent to the model.
5. **No default injection.** Pi does not synthesize a `provenance` for messages that callers leave unmarked. A user typing into the terminal produces a user message with no `provenance`.
6. **Same guarantees for `submitSkill`.** When a skill is submitted with provenance, the expanded user message carries it through the same event/queue/transcript paths. The one exception is compaction-time queueing: if a skill is submitted during compaction it is queued via `queueCompactionMessage(...)` which does not currently thread provenance. Remote submissions landing exactly during compaction may echo back. This is a minor gap and can be closed with a future patch to the compaction queue.

### what this lets an extension do

- Identify bridged/injected messages without content correlation.
- Attribute a user message back to a specific external event id.
- Survive session reloads without persisting a sidecar binding table.
- Carry small source-specific metadata (channel name, peer id, webhook signature, etc.) where a full extension store would be overkill.

## non-api surface

### not changing

- `AgentSession.prompt(text, options)` is still the public promotion point; it gains an optional `provenance` on `PromptOptions` but its behavior is unchanged when unset.
- Queue dedup matches by text only, so adding provenance does not change dedup semantics.
- `convertToLlm` and provider adapters are untouched; they already reconstruct LLM shapes without carrying extras.
- `packages/ai/` and `packages/agent/` are not modified. The `UserMessage` extension is declaration-merged from coding-agent, mirroring the existing `CustomAgentMessages` augmentation pattern.

### persistence

Session entries are written as `JSON.stringify(entry) + "\n"` to a JSONL file and reparsed with `JSON.parse` on load. Extra fields on the message object round-trip automatically; no schema migration is required.

## immediate use case

`pi-remote-control` today runs a `RemoteIngressSidecar` (~178 LOC plus correlation logic in the controller) to:

- normalize inbound remote text
- record `{remoteUuid, normalizedText, beforeEntryCount}` per injection
- match the resulting local user message by content at `message_end` time
- bind `{remoteUuid → localEntryId}` for later lookups
- migrate the binding table across session switches

With `provenance` on user messages, the sidecar is deleted. Suppression becomes:

```ts
pi.on("message_end", (event) => {
    if (event.message.role !== "user") return;
    if (event.message.provenance?.source === "extension.pi-remote-control") {
        // This is our own injection bouncing back. Don't forward to the remote.
        return;
    }
    forwardLocalUserMessageToRemote(event.message);
});
```

## future follow-ups

- Extending `AssistantMessage` and `ToolResultMessage` with provenance when a real use case arises (e.g. attributing tool results to a specific subagent run).
- A typed registry of well-known `source` values so consumers can match against constants rather than strings.
- An optional `beforeAgentStart` hook to modify provenance, similar to content transforms.
