export interface InteractiveSkillState {
	isStreaming: boolean;
	isCompacting: boolean;
	isKnownSkillCommand(commandLine: string): boolean;
}

export interface InteractiveSkillHandlers {
	submitPrompt(
		commandLine: string,
		options?: { source?: "interactive" | "extension"; streamingBehavior?: "steer" | "followUp" },
	): Promise<void>;
	queueCompactionMessage(commandLine: string, mode: "steer" | "followUp"): void;
	updatePendingMessagesDisplay(): void;
	requestRender(): void;
}

export async function trySubmitInteractiveSkill(
	commandLine: string,
	state: InteractiveSkillState,
	handlers: InteractiveSkillHandlers,
	options?: { source?: "interactive" | "extension" },
): Promise<boolean> {
	if (!commandLine.startsWith("/skill:")) {
		return false;
	}

	if (!state.isKnownSkillCommand(commandLine)) {
		return false;
	}

	if (state.isCompacting) {
		handlers.queueCompactionMessage(commandLine, "steer");
		return true;
	}

	if (state.isStreaming) {
		await handlers.submitPrompt(commandLine, {
			source: options?.source ?? "interactive",
			streamingBehavior: "steer",
		});
		handlers.updatePendingMessagesDisplay();
		handlers.requestRender();
		return true;
	}

	await handlers.submitPrompt(commandLine, { source: options?.source ?? "interactive" });
	return true;
}
