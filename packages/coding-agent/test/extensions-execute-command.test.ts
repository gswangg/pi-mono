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

describe("ExtensionAPI.executeCommand", () => {
	let tempDir: string;
	let sessionManager: SessionManager;
	let modelRegistry: ModelRegistry;

	beforeEach(() => {
		tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "pi-execute-command-test-"));
		sessionManager = SessionManager.inMemory();
		const authStorage = AuthStorage.create(path.join(tempDir, "auth.json"));
		modelRegistry = ModelRegistry.create(authStorage);
	});

	afterEach(() => {
		fs.rmSync(tempDir, { recursive: true, force: true });
	});

	it("delegates to the bound executeCommand action", async () => {
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
		const executeCommand = vi.fn(async (commandLine: string) => commandLine === "/reload");

		const actions: ExtensionActions = {
			sendMessage: () => {},
			sendUserMessage: () => {},
			executeCommand,
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
		await expect(api!.executeCommand("/reload")).resolves.toBe(true);
		expect(executeCommand).toHaveBeenCalledWith("/reload");

		await expect(api!.executeCommand("/unknown")).resolves.toBe(false);
		expect(executeCommand).toHaveBeenCalledWith("/unknown");
	});
});
