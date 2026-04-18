import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthStorage } from "../src/core/auth-storage.js";
import { createEventBus } from "../src/core/event-bus.js";
import { createExtensionRuntime, loadExtensionFromFactory } from "../src/core/extensions/loader.js";
import { ExtensionRunner } from "../src/core/extensions/runner.js";
import type { ExtensionActions, ExtensionAPI, ExtensionContextActions } from "../src/core/extensions/types.js";
import { ModelRegistry } from "../src/core/model-registry.js";
import { SessionManager } from "../src/core/session-manager.js";

describe("ExtensionAPI skill helpers", () => {
	let tempDir: string;
	let sessionManager: SessionManager;
	let modelRegistry: ModelRegistry;

	beforeEach(() => {
		tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "pi-submit-skill-test-"));
		sessionManager = SessionManager.inMemory();
		const authStorage = AuthStorage.create(path.join(tempDir, "auth.json"));
		modelRegistry = ModelRegistry.create(authStorage);
	});

	afterEach(() => {
		fs.rmSync(tempDir, { recursive: true, force: true });
	});

	it("delegates submitSkill and expandSkillCommand to bound runtime actions", async () => {
		const runtime = createExtensionRuntime();
		let api: ExtensionAPI | undefined;
		const extension = await loadExtensionFromFactory(
			(pi) => {
				api = pi;
			},
			tempDir,
			createEventBus(),
			runtime,
		);
		const runner = new ExtensionRunner([extension], runtime, tempDir, sessionManager, modelRegistry);
		const submitSkill = vi.fn(async (commandLine: string) => commandLine === "/skill:debug logs");
		const expandSkillCommand = vi.fn((commandLine: string) =>
			commandLine === "/skill:debug logs"
				? '<skill name="debug" location="/tmp/debug/SKILL.md">\nReferences are relative to /tmp/debug.\n\nbody\n</skill>\n\nlogs'
				: undefined,
		);

		const actions: ExtensionActions = {
			sendMessage: () => {},
			sendUserMessage: () => {},
			executeCommand: async () => false,
			submitSkill,
			expandSkillCommand,
			appendEntry: () => {},
			setSessionName: () => {},
			getSessionName: () => undefined,
			setLabel: () => {},
			getActiveTools: () => [],
			getAllTools: () => [],
			setActiveTools: () => {},
			refreshTools: () => {},
			getCommands: () => [],
			setModel: async () => false,
			getThinkingLevel: () => "off",
			setThinkingLevel: () => {},
		};
		const contextActions: ExtensionContextActions = {
			getModel: () => undefined,
			isIdle: () => true,
			getSignal: () => undefined,
			abort: () => {},
			hasPendingMessages: () => false,
			shutdown: () => {},
			getContextUsage: () => undefined,
			compact: () => {},
			getSystemPrompt: () => "",
		};

		runner.bindCore(actions, contextActions);

		expect(api).toBeDefined();
		await expect(api!.submitSkill("/skill:debug logs")).resolves.toBe(true);
		expect(submitSkill).toHaveBeenCalledWith("/skill:debug logs", undefined);
		expect(api!.expandSkillCommand("/skill:debug logs")).toContain('<skill name="debug"');
		expect(expandSkillCommand).toHaveBeenCalledWith("/skill:debug logs");
		await expect(api!.submitSkill("/skill:missing")).resolves.toBe(false);

		const provenance = { source: "extension.pi-remote-control", externalId: "skill-42" };
		await expect(api!.submitSkill("/skill:debug logs", { provenance })).resolves.toBe(true);
		expect(submitSkill).toHaveBeenLastCalledWith("/skill:debug logs", { provenance });
	});
});
