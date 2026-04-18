import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AgentTool } from "@mariozechner/pi-agent-core";
import { fauxAssistantMessage, fauxToolCall } from "@mariozechner/pi-ai";
import type { ExtensionAPI, MessageProvenance } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { afterEach, describe, expect, it } from "vitest";
import { createExtensionRuntime } from "../../src/core/extensions/loader.js";
import type { ResourceDiagnostic, ResourceLoader } from "../../src/core/resource-loader.js";
import type { SessionMessageEntry } from "../../src/core/session-manager.js";
import type { Skill } from "../../src/core/skills.js";
import { createSyntheticSourceInfo } from "../../src/core/source-info.js";
import { createHarness, getMessageText, type Harness } from "./harness.js";

/**
 * Integration tests for message provenance (see docs/message-provenance-api.md).
 *
 * Guarantees covered:
 *   1. Idle-path sendUserMessage: provenance reaches message_start + message_end + session entry.
 *   2. Streaming steer path: provenance reaches message_end when the queued message drains.
 *   3. Streaming followUp path: same, for follow-up delivery.
 *   4. AgentSession.prompt() provenance option works at the session layer too.
 *   5. No provenance by default: unmarked messages stay unmarked.
 *   6. JSONL round-trip: provenance survives JSON.stringify + JSON.parse.
 *   7. Mixed runs: one injected user with provenance + one without keeps them distinguishable.
 */

function findUserMessageEnd(harness: Harness, text: string) {
	return harness
		.eventsOfType("message_end")
		.find((event) => event.message.role === "user" && getMessageText(event.message) === text);
}

function getUserEntries(harness: Harness): SessionMessageEntry[] {
	return harness.sessionManager
		.getEntries()
		.filter((entry): entry is SessionMessageEntry => entry.type === "message" && entry.message.role === "user");
}

describe("message provenance", () => {
	const harnesses: Harness[] = [];

	afterEach(() => {
		while (harnesses.length > 0) {
			harnesses.pop()?.cleanup();
		}
	});

	it("flows through sendUserMessage on the idle path to message events and session entries", async () => {
		const harness = await createHarness();
		harnesses.push(harness);
		harness.setResponses([fauxAssistantMessage("ok")]);

		const provenance: MessageProvenance = {
			source: "extension.pi-remote-control",
			externalId: "remote-uuid-idle",
			metadata: { peer: "alice" },
		};

		// Public AgentSession.sendUserMessage returns a Promise; the extension runtime
		// wraps it fire-and-forget for extensions that cannot await. We exercise the
		// awaitable surface here; streaming tests below exercise the fire-and-forget path.
		await harness.session.sendUserMessage("hello from remote", { provenance });

		const startEvent = harness
			.eventsOfType("message_start")
			.find((event) => event.message.role === "user" && getMessageText(event.message) === "hello from remote");
		expect(startEvent).toBeDefined();
		expect(startEvent!.message.role === "user" && startEvent!.message.provenance).toEqual(provenance);

		const endEvent = findUserMessageEnd(harness, "hello from remote");
		expect(endEvent).toBeDefined();
		expect(endEvent!.message.role === "user" && endEvent!.message.provenance).toEqual(provenance);

		const userEntries = getUserEntries(harness);
		expect(userEntries).toHaveLength(1);
		expect(userEntries[0].message.role === "user" && userEntries[0].message.provenance).toEqual(provenance);
	});

	it("flows through streaming steer injection and survives queue drain", async () => {
		let extensionApi: ExtensionAPI | undefined;
		let releaseTool: (() => void) | undefined;
		const waitTool: AgentTool = {
			name: "wait",
			label: "Wait",
			description: "Wait for release",
			parameters: Type.Object({}),
			execute: async () => {
				await new Promise<void>((resolve) => {
					releaseTool = resolve;
				});
				return { content: [{ type: "text", text: "released" }], details: {} };
			},
		};
		const harness = await createHarness({
			tools: [waitTool],
			extensionFactories: [
				(pi) => {
					extensionApi = pi;
				},
			],
		});
		harnesses.push(harness);

		harness.setResponses([
			fauxAssistantMessage(fauxToolCall("wait", {}), { stopReason: "toolUse" }),
			fauxAssistantMessage("saw steer"),
		]);

		const toolStarted = new Promise<void>((resolve) => {
			const unsubscribe = harness.session.subscribe((event) => {
				if (event.type === "tool_execution_start" && event.toolName === "wait") {
					unsubscribe();
					resolve();
				}
			});
		});

		const promptPromise = harness.session.prompt("start");
		await toolStarted;
		await new Promise((resolve) => setTimeout(resolve, 0));

		const provenance: MessageProvenance = {
			source: "extension.pi-remote-control",
			externalId: "remote-uuid-steer",
		};
		extensionApi!.sendUserMessage("steer payload", { deliverAs: "steer", provenance });

		releaseTool!();
		await promptPromise;

		const endEvent = findUserMessageEnd(harness, "steer payload");
		expect(endEvent).toBeDefined();
		expect(endEvent!.message.role === "user" && endEvent!.message.provenance).toEqual(provenance);

		const steeredEntry = getUserEntries(harness).find((entry) => getMessageText(entry.message) === "steer payload");
		expect(steeredEntry).toBeDefined();
		expect(steeredEntry!.message.role === "user" && steeredEntry!.message.provenance).toEqual(provenance);
	});

	it("flows through streaming followUp injection and survives queue drain", async () => {
		let extensionApi: ExtensionAPI | undefined;
		let releaseTool: (() => void) | undefined;
		const waitTool: AgentTool = {
			name: "wait",
			label: "Wait",
			description: "Wait for release",
			parameters: Type.Object({}),
			execute: async () => {
				await new Promise<void>((resolve) => {
					releaseTool = resolve;
				});
				return { content: [{ type: "text", text: "released" }], details: {} };
			},
		};
		const harness = await createHarness({
			tools: [waitTool],
			extensionFactories: [
				(pi) => {
					extensionApi = pi;
				},
			],
		});
		harnesses.push(harness);

		harness.setResponses([
			fauxAssistantMessage(fauxToolCall("wait", {}), { stopReason: "toolUse" }),
			fauxAssistantMessage("first-turn done"),
			fauxAssistantMessage("followup done"),
		]);

		const toolStarted = new Promise<void>((resolve) => {
			const unsubscribe = harness.session.subscribe((event) => {
				if (event.type === "tool_execution_start" && event.toolName === "wait") {
					unsubscribe();
					resolve();
				}
			});
		});

		const promptPromise = harness.session.prompt("start");
		await toolStarted;
		await new Promise((resolve) => setTimeout(resolve, 0));

		const provenance: MessageProvenance = {
			source: "channel.whatsapp",
			externalId: "wa-msg-42",
			metadata: { peer: "+15551234567" },
		};
		extensionApi!.sendUserMessage("queued followup", { deliverAs: "followUp", provenance });

		releaseTool!();
		await promptPromise;

		const endEvent = findUserMessageEnd(harness, "queued followup");
		expect(endEvent).toBeDefined();
		expect(endEvent!.message.role === "user" && endEvent!.message.provenance).toEqual(provenance);

		const followUpEntry = getUserEntries(harness).find(
			(entry) => getMessageText(entry.message) === "queued followup",
		);
		expect(followUpEntry).toBeDefined();
		expect(followUpEntry!.message.role === "user" && followUpEntry!.message.provenance).toEqual(provenance);
	});

	it("honors provenance passed directly to AgentSession.prompt()", async () => {
		const harness = await createHarness();
		harnesses.push(harness);
		harness.setResponses([fauxAssistantMessage("ok")]);

		const provenance: MessageProvenance = { source: "cron.nightly-review" };
		await harness.session.prompt("nightly", { provenance });

		const endEvent = findUserMessageEnd(harness, "nightly");
		expect(endEvent).toBeDefined();
		expect(endEvent!.message.role === "user" && endEvent!.message.provenance).toEqual(provenance);
	});

	it("leaves provenance undefined when callers do not set it", async () => {
		const harness = await createHarness();
		harnesses.push(harness);
		harness.setResponses([fauxAssistantMessage("ok"), fauxAssistantMessage("ok-direct")]);

		await harness.session.sendUserMessage("plain extension message");
		await harness.session.prompt("plain local message");

		const extensionEnd = findUserMessageEnd(harness, "plain extension message");
		const localEnd = findUserMessageEnd(harness, "plain local message");
		expect(extensionEnd).toBeDefined();
		expect(localEnd).toBeDefined();
		expect(extensionEnd!.message.role === "user" && extensionEnd!.message.provenance).toBeUndefined();
		expect(localEnd!.message.role === "user" && localEnd!.message.provenance).toBeUndefined();
	});

	it("survives JSON.stringify / JSON.parse round-trip for session transcript persistence", async () => {
		const harness = await createHarness();
		harnesses.push(harness);
		harness.setResponses([fauxAssistantMessage("ok")]);

		const provenance: MessageProvenance = {
			source: "extension.pi-remote-control",
			externalId: "remote-uuid-roundtrip",
			metadata: { peer: "bob", nested: { deeper: [1, 2, 3] } },
		};
		await harness.session.sendUserMessage("persist me", { provenance });

		const entry = getUserEntries(harness).find((e) => getMessageText(e.message) === "persist me");
		expect(entry).toBeDefined();

		// Simulate the exact transcript round-trip path used by SessionManager._persist
		// (see session-manager.ts: each entry becomes JSON.stringify(entry) + "\n").
		const line = JSON.stringify(entry);
		const parsed = JSON.parse(line) as SessionMessageEntry;
		expect(parsed.message.role).toBe("user");
		if (parsed.message.role === "user") {
			expect(parsed.message.provenance).toEqual(provenance);
		}
	});

	it("threads provenance through submitSkill to the expanded user message", async () => {
		const skillDir = join(tmpdir(), `pi-prov-skill-${Date.now()}-${Math.random().toString(36).slice(2)}`);
		mkdirSync(skillDir, { recursive: true });
		const skillFile = join(skillDir, "SKILL.md");
		writeFileSync(skillFile, "---\nname: debug\ndescription: debug skill\n---\n\nskill body text\n", "utf-8");

		const skill: Skill = {
			name: "debug",
			description: "debug skill",
			filePath: skillFile,
			baseDir: skillDir,
			sourceInfo: createSyntheticSourceInfo(skillFile, { source: "test" }),
			disableModelInvocation: false,
		};

		const diagnostics: ResourceDiagnostic[] = [];
		const resourceLoader: ResourceLoader = {
			getExtensions: () => ({ extensions: [], errors: [], runtime: createExtensionRuntime() }),
			getSkills: () => ({ skills: [skill], diagnostics }),
			getPrompts: () => ({ prompts: [], diagnostics: [] }),
			getThemes: () => ({ themes: [], diagnostics: [] }),
			getAgentsFiles: () => ({ agentsFiles: [] }),
			getSystemPrompt: () => undefined,
			getAppendSystemPrompt: () => [],
			extendResources: () => {},
			reload: async () => {},
		};

		const harness = await createHarness({ resourceLoader });
		harnesses.push(harness);
		harness.setResponses([fauxAssistantMessage("got skill")]);

		const provenance: MessageProvenance = {
			source: "extension.pi-remote-control",
			externalId: "skill-remote-uuid",
		};

		const submitted = await harness.session.submitSkill("/skill:debug logs", { provenance });
		expect(submitted).toBe(true);

		const userEnds = harness.eventsOfType("message_end").filter((event) => event.message.role === "user");
		expect(userEnds).toHaveLength(1);
		const userMsg = userEnds[0].message;
		expect(userMsg.role).toBe("user");
		if (userMsg.role === "user") {
			expect(userMsg.provenance).toEqual(provenance);
			// Sanity: the emitted text is the expanded skill content, not the raw /skill:... line.
			expect(getMessageText(userMsg)).toContain("skill body text");
			expect(getMessageText(userMsg)).toContain("logs"); // the args
		}
	});

	it("distinguishes mixed-origin messages in the same session", async () => {
		const harness = await createHarness();
		harnesses.push(harness);
		harness.setResponses([
			fauxAssistantMessage("got remote"),
			fauxAssistantMessage("got local"),
			fauxAssistantMessage("got second-remote"),
		]);

		const remoteA: MessageProvenance = { source: "extension.pi-remote-control", externalId: "A" };
		const remoteB: MessageProvenance = { source: "extension.pi-remote-control", externalId: "B" };

		await harness.session.sendUserMessage("remote A", { provenance: remoteA });
		await harness.session.prompt("local message");
		await harness.session.sendUserMessage("remote B", { provenance: remoteB });

		const entries = getUserEntries(harness);
		const byText: Record<string, SessionMessageEntry> = {};
		for (const entry of entries) {
			byText[getMessageText(entry.message)] = entry;
		}

		expect(byText["remote A"]?.message.role === "user" && byText["remote A"].message.provenance).toEqual(remoteA);
		expect(
			byText["local message"]?.message.role === "user" && byText["local message"].message.provenance,
		).toBeUndefined();
		expect(byText["remote B"]?.message.role === "user" && byText["remote B"].message.provenance).toEqual(remoteB);
	});
});
