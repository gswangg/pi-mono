import { describe, expect, it, vi } from "vitest";
import { getModel } from "../src/models.ts";
import { streamAnthropic } from "../src/providers/anthropic.ts";
import type { Context } from "../src/types.ts";

const mockState = vi.hoisted(() => ({
	constructorOpts: undefined as Record<string, unknown> | undefined,
	createParams: undefined as Record<string, unknown> | undefined,
}));

vi.mock("@anthropic-ai/sdk", () => {
	function createSseResponse(): Response {
		const body = [
			`event: message_start\ndata: ${JSON.stringify({
				type: "message_start",
				message: {
					id: "msg_test",
					usage: { input_tokens: 10, output_tokens: 0 },
				},
			})}\n`,
			`event: message_delta\ndata: ${JSON.stringify({
				type: "message_delta",
				delta: { stop_reason: "end_turn" },
				usage: { output_tokens: 5 },
			})}\n`,
		].join("\n");

		return new Response(body, {
			status: 200,
			headers: { "content-type": "text/event-stream" },
		});
	}

	class FakeAnthropic {
		constructor(opts: Record<string, unknown>) {
			mockState.constructorOpts = opts;
		}
		messages = {
			create: (params: Record<string, unknown>) => {
				mockState.createParams = params;
				return {
					asResponse: async () => createSseResponse(),
				};
			},
		};
	}

	return { default: FakeAnthropic };
});

describe("Anthropic OAuth Claude Code identity", () => {
	it("uses the forked Claude Code CLI version in OAuth identity headers", async () => {
		const model = getModel("anthropic", "claude-opus-4-7");
		expect(model.api).toBe("anthropic-messages");

		const context: Context = {
			systemPrompt: "You are a helpful assistant.",
			messages: [{ role: "user", content: "Hello", timestamp: Date.now() }],
		};

		const stream = streamAnthropic(model, context, { apiKey: "sk-ant-oat-test-token" });
		for await (const event of stream) {
			if (event.type === "error") break;
		}

		const opts = mockState.constructorOpts!;
		expect(opts.apiKey).toBeNull();
		expect(opts.authToken).toBe("sk-ant-oat-test-token");

		const headers = opts.defaultHeaders as Record<string, string>;
		expect(headers["user-agent"]).toBe("claude-cli/2.1.143");
		expect(headers["x-app"]).toBe("cli");
		expect(headers["anthropic-beta"]).toContain("claude-code-20250219");
		expect(headers["anthropic-beta"]).toContain("oauth-2025-04-20");

		const params = mockState.createParams!;
		expect(params.system).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ text: "You are Claude Code, Anthropic's official CLI for Claude." }),
			]),
		);
	});
});
