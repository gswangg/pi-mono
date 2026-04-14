import { afterEach, describe, expect, it } from "vitest";
import type { ExtensionAPI } from "../src/core/extensions/index.js";
import { createHarness, type Harness } from "./suite/harness.js";

describe("ExtensionAPI.getCommands", () => {
	let harness: Harness | undefined;

	afterEach(() => {
		harness?.cleanup();
		harness = undefined;
	});

	it("includes built-in interactive commands in discoverability output", async () => {
		let api: ExtensionAPI | undefined;
		harness = await createHarness({
			extensionFactories: [
				(pi) => {
					api = pi;
					pi.registerCommand("hello", {
						description: "Say hello",
						handler: async () => {},
					});
				},
			],
		});

		expect(api).toBeDefined();
		const commands = api!.getCommands();
		const reload = commands.find((command) => command.name === "reload");
		const newSession = commands.find((command) => command.name === "new");
		const extensionCommand = commands.find((command) => command.name === "hello");

		expect(reload).toMatchObject({
			name: "reload",
			source: "builtin",
			sourceInfo: { source: "builtin", path: "<builtin:reload>" },
		});
		expect(newSession).toMatchObject({
			name: "new",
			source: "builtin",
			sourceInfo: { source: "builtin", path: "<builtin:new>" },
		});
		expect(extensionCommand).toMatchObject({ name: "hello", source: "extension" });
		expect(commands.findIndex((command) => command.name === "reload")).toBeLessThan(
			commands.findIndex((command) => command.name === "hello"),
		);
	});
});
