export interface InteractiveSkillState {
	isStreaming: boolean;
	isCompacting: boolean;
	isKnownSkillCommand(commandLine: string): boolean;
}

import type { MessageProvenance } from "../../core/messages.js";

export interface InteractiveSkillHandlers {
	submitPrompt(
		commandLine: string,
		options?: {
			source?: "interactive" | "extension";
			streamingBehavior?: "steer" | "followUp";
			provenance?: MessageProvenance;
		},
	): Promise<void>;
	queueCompactionMessage(commandLine: string, mode: "steer" | "followUp"): void;
	updatePendingMessagesDisplay(): void;
	requestRender(): void;
}

export async function trySubmitInteractiveSkill(
	commandLine: string,
	state: InteractiveSkillState,
	handlers: InteractiveSkillHandlers,
	options?: { source?: "interactive" | "extension"; provenance?: MessageProvenance },
): Promise<boolean> {
	if (!commandLine.startsWith("/skill:")) {
		return false;
	}

	if (!state.isKnownSkillCommand(commandLine)) {
		return false;
	}

	if (state.isCompacting) {
		// Compaction queueing does not yet carry provenance. Remote submissions that
		// land during compaction will echo to the remote once the queued turn runs.
		// Acceptable trade-off for now; revisit if remote-during-compact becomes common.
		handlers.queueCompactionMessage(commandLine, "steer");
		return true;
	}

	if (state.isStreaming) {
		await handlers.submitPrompt(commandLine, {
			source: options?.source ?? "interactive",
			streamingBehavior: "steer",
			...(options?.provenance ? { provenance: options.provenance } : {}),
		});
		handlers.updatePendingMessagesDisplay();
		handlers.requestRender();
		return true;
	}

	await handlers.submitPrompt(commandLine, {
		source: options?.source ?? "interactive",
		...(options?.provenance ? { provenance: options.provenance } : {}),
	});
	return true;
}
