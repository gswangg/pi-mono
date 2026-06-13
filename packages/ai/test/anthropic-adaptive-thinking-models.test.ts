import { describe, expect, it } from "vitest";
import { getModels, getProviders } from "../src/models.ts";
import type { Api, Model } from "../src/types.ts";

// Restrict the required-present snapshot to anthropic-native built-ins. Third-party
// catalogs (opencode, vercel-ai-gateway) regenerate from live model lists and have
// dropped/re-added claude-fable-5 between releases, which makes a hardcoded multi-provider
// snapshot drift-prone. arrayContaining stays forward-compatible if those return.
const EXPECTED_CURRENT_ADAPTIVE_THINKING_MODELS = ["anthropic/claude-fable-5", "anthropic/claude-opus-4-8"];

function getAllModels(): Model<Api>[] {
	return getProviders().flatMap((provider) => getModels(provider) as Model<Api>[]);
}

describe("Anthropic adaptive thinking model metadata", () => {
	it("marks built-in Anthropic Messages models that use adaptive thinking", () => {
		const flaggedModels = getAllModels()
			.filter((model): model is Model<"anthropic-messages"> => model.api === "anthropic-messages")
			.filter((model) => model.compat?.forceAdaptiveThinking === true)
			.map((model) => `${model.provider}/${model.id}`)
			.sort();

		expect(flaggedModels).toEqual(expect.arrayContaining([...EXPECTED_CURRENT_ADAPTIVE_THINKING_MODELS].sort()));
		expect(flaggedModels).toEqual(
			flaggedModels.filter((modelId) => /(opus[-.]4[-.][678]|sonnet[-.]4[-.]6|fable[-.]5)/.test(modelId)),
		);
	});
});
