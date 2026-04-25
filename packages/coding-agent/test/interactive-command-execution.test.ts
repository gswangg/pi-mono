import { describe, expect, it, vi } from "vitest";
import {
	type InteractiveCommandHandlers,
	tryHandleInteractiveCommand,
} from "../src/modes/interactive/execute-command.js";

function createHandlers(): InteractiveCommandHandlers & { calls: string[] } {
	const calls: string[] = [];
	return {
		calls,
		clearEditor: vi.fn(() => {
			calls.push("clearEditor");
		}),
		showSettingsSelector: vi.fn(() => {
			calls.push("showSettingsSelector");
		}),
		showModelsSelector: vi.fn(async () => {
			calls.push("showModelsSelector");
		}),
		handleModelCommand: vi.fn(async (searchTerm?: string) => {
			calls.push(`handleModelCommand:${searchTerm ?? ""}`);
		}),
		handleExportCommand: vi.fn(async (text: string) => {
			calls.push(`handleExportCommand:${text}`);
		}),
		handleImportCommand: vi.fn(async (text: string) => {
			calls.push(`handleImportCommand:${text}`);
		}),
		handleShareCommand: vi.fn(async () => {
			calls.push("handleShareCommand");
		}),
		handleCopyCommand: vi.fn(async () => {
			calls.push("handleCopyCommand");
		}),
		handleNameCommand: vi.fn((text: string) => {
			calls.push(`handleNameCommand:${text}`);
		}),
		handleSessionCommand: vi.fn(() => {
			calls.push("handleSessionCommand");
		}),
		handleChangelogCommand: vi.fn(() => {
			calls.push("handleChangelogCommand");
		}),
		handleHotkeysCommand: vi.fn(() => {
			calls.push("handleHotkeysCommand");
		}),
		showUserMessageSelector: vi.fn(() => {
			calls.push("showUserMessageSelector");
		}),
		handleCloneCommand: vi.fn(async () => {
			calls.push("handleCloneCommand");
		}),
		showTreeSelector: vi.fn(() => {
			calls.push("showTreeSelector");
		}),
		showOAuthSelector: vi.fn(async (mode: "login" | "logout") => {
			calls.push(`showOAuthSelector:${mode}`);
		}),
		handleClearCommand: vi.fn(async () => {
			calls.push("handleClearCommand");
		}),
		handleCompactCommand: vi.fn(async (customInstructions?: string) => {
			calls.push(`handleCompactCommand:${customInstructions ?? ""}`);
		}),
		handleReloadCommand: vi.fn(async () => {
			calls.push("handleReloadCommand");
		}),
		handleDebugCommand: vi.fn(() => {
			calls.push("handleDebugCommand");
		}),
		handleArminSaysHi: vi.fn(() => {
			calls.push("handleArminSaysHi");
		}),
		handleDementedDelves: vi.fn(() => {
			calls.push("handleDementedDelves");
		}),
		showSessionSelector: vi.fn(() => {
			calls.push("showSessionSelector");
		}),
		shutdown: vi.fn(async () => {
			calls.push("shutdown");
		}),
	};
}

describe("tryHandleInteractiveCommand", () => {
	it("dispatches built-in commands and preserves clear ordering", async () => {
		const handlers = createHandlers();

		await expect(tryHandleInteractiveCommand("/reload", handlers)).resolves.toBe(true);
		expect(handlers.calls).toEqual(["clearEditor", "handleReloadCommand"]);

		handlers.calls.length = 0;
		await expect(tryHandleInteractiveCommand("/name remote", handlers)).resolves.toBe(true);
		expect(handlers.calls).toEqual(["handleNameCommand:/name remote", "clearEditor"]);
	});

	it("parses command arguments for model and compact", async () => {
		const handlers = createHandlers();

		await expect(tryHandleInteractiveCommand("/model opus", handlers)).resolves.toBe(true);
		expect(handlers.handleModelCommand).toHaveBeenCalledWith("opus");

		await expect(tryHandleInteractiveCommand("/compact focus on diffs", handlers)).resolves.toBe(true);
		expect(handlers.handleCompactCommand).toHaveBeenCalledWith("focus on diffs");
	});

	it("returns false for unknown commands", async () => {
		const handlers = createHandlers();
		await expect(tryHandleInteractiveCommand("/nope", handlers)).resolves.toBe(false);
		expect(handlers.calls).toEqual([]);
	});
});
