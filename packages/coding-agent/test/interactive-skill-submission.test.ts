import { describe, expect, it, vi } from "vitest";
import { trySubmitInteractiveSkill } from "../src/modes/interactive/submit-skill.js";

function createHandlers() {
	return {
		submitPrompt: vi.fn(async () => {}),
		queueCompactionMessage: vi.fn(() => {}),
		updatePendingMessagesDisplay: vi.fn(() => {}),
		requestRender: vi.fn(() => {}),
	};
}

describe("trySubmitInteractiveSkill", () => {
	it("returns false for unknown or non-skill slash input", async () => {
		const handlers = createHandlers();
		const state = {
			isStreaming: false,
			isCompacting: false,
			isKnownSkillCommand: () => false,
		};

		await expect(trySubmitInteractiveSkill("/skill:missing", state, handlers)).resolves.toBe(false);
		await expect(trySubmitInteractiveSkill("/reload", state, handlers)).resolves.toBe(false);
		expect(handlers.submitPrompt).not.toHaveBeenCalled();
	});

	it("submits known skills immediately while idle", async () => {
		const handlers = createHandlers();
		const state = {
			isStreaming: false,
			isCompacting: false,
			isKnownSkillCommand: () => true,
		};

		await expect(trySubmitInteractiveSkill("/skill:debug logs", state, handlers)).resolves.toBe(true);
		expect(handlers.submitPrompt).toHaveBeenCalledWith("/skill:debug logs", { source: "interactive" });
		expect(handlers.queueCompactionMessage).not.toHaveBeenCalled();
	});

	it("queues known skills as steer while streaming", async () => {
		const handlers = createHandlers();
		const state = {
			isStreaming: true,
			isCompacting: false,
			isKnownSkillCommand: () => true,
		};

		await expect(
			trySubmitInteractiveSkill("/skill:debug logs", state, handlers, { source: "extension" }),
		).resolves.toBe(true);
		expect(handlers.submitPrompt).toHaveBeenCalledWith("/skill:debug logs", {
			source: "extension",
			streamingBehavior: "steer",
		});
		expect(handlers.updatePendingMessagesDisplay).toHaveBeenCalledTimes(1);
		expect(handlers.requestRender).toHaveBeenCalledTimes(1);
	});

	it("queues known skills for after compaction", async () => {
		const handlers = createHandlers();
		const state = {
			isStreaming: false,
			isCompacting: true,
			isKnownSkillCommand: () => true,
		};

		await expect(trySubmitInteractiveSkill("/skill:debug logs", state, handlers)).resolves.toBe(true);
		expect(handlers.queueCompactionMessage).toHaveBeenCalledWith("/skill:debug logs", "steer");
		expect(handlers.submitPrompt).not.toHaveBeenCalled();
	});
});
