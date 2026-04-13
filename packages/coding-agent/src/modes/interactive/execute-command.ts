export interface InteractiveCommandHandlers {
	clearEditor(): void;
	showSettingsSelector(): void;
	showModelsSelector(): Promise<void>;
	handleModelCommand(searchTerm?: string): Promise<void>;
	handleExportCommand(text: string): Promise<void>;
	handleImportCommand(text: string): Promise<void>;
	handleShareCommand(): Promise<void>;
	handleCopyCommand(): Promise<void>;
	handleNameCommand(text: string): void;
	handleSessionCommand(): void;
	handleChangelogCommand(): void;
	handleHotkeysCommand(): void;
	showUserMessageSelector(): void;
	showTreeSelector(): void;
	showOAuthSelector(mode: "login" | "logout"): Promise<void>;
	handleClearCommand(): Promise<void>;
	handleCompactCommand(customInstructions?: string): Promise<void>;
	handleReloadCommand(): Promise<void>;
	handleDebugCommand(): void;
	handleArminSaysHi(): void;
	handleDementedDelves(): void;
	showSessionSelector(): void;
	shutdown(): Promise<void>;
}

export async function tryHandleInteractiveCommand(
	text: string,
	handlers: InteractiveCommandHandlers,
): Promise<boolean> {
	if (text === "/settings") {
		handlers.clearEditor();
		handlers.showSettingsSelector();
		return true;
	}
	if (text === "/scoped-models") {
		handlers.clearEditor();
		await handlers.showModelsSelector();
		return true;
	}
	if (text === "/model" || text.startsWith("/model ")) {
		const searchTerm = text.startsWith("/model ") ? text.slice(7).trim() : undefined;
		handlers.clearEditor();
		await handlers.handleModelCommand(searchTerm);
		return true;
	}
	if (text.startsWith("/export")) {
		await handlers.handleExportCommand(text);
		handlers.clearEditor();
		return true;
	}
	if (text.startsWith("/import")) {
		await handlers.handleImportCommand(text);
		handlers.clearEditor();
		return true;
	}
	if (text === "/share") {
		await handlers.handleShareCommand();
		handlers.clearEditor();
		return true;
	}
	if (text === "/copy") {
		await handlers.handleCopyCommand();
		handlers.clearEditor();
		return true;
	}
	if (text === "/name" || text.startsWith("/name ")) {
		handlers.handleNameCommand(text);
		handlers.clearEditor();
		return true;
	}
	if (text === "/session") {
		handlers.handleSessionCommand();
		handlers.clearEditor();
		return true;
	}
	if (text === "/changelog") {
		handlers.handleChangelogCommand();
		handlers.clearEditor();
		return true;
	}
	if (text === "/hotkeys") {
		handlers.handleHotkeysCommand();
		handlers.clearEditor();
		return true;
	}
	if (text === "/fork") {
		handlers.showUserMessageSelector();
		handlers.clearEditor();
		return true;
	}
	if (text === "/tree") {
		handlers.showTreeSelector();
		handlers.clearEditor();
		return true;
	}
	if (text === "/login") {
		await handlers.showOAuthSelector("login");
		handlers.clearEditor();
		return true;
	}
	if (text === "/logout") {
		await handlers.showOAuthSelector("logout");
		handlers.clearEditor();
		return true;
	}
	if (text === "/new") {
		handlers.clearEditor();
		await handlers.handleClearCommand();
		return true;
	}
	if (text === "/compact" || text.startsWith("/compact ")) {
		const customInstructions = text.startsWith("/compact ") ? text.slice(9).trim() : undefined;
		handlers.clearEditor();
		await handlers.handleCompactCommand(customInstructions);
		return true;
	}
	if (text === "/reload") {
		handlers.clearEditor();
		await handlers.handleReloadCommand();
		return true;
	}
	if (text === "/debug") {
		handlers.handleDebugCommand();
		handlers.clearEditor();
		return true;
	}
	if (text === "/arminsayshi") {
		handlers.handleArminSaysHi();
		handlers.clearEditor();
		return true;
	}
	if (text === "/dementedelves") {
		handlers.handleDementedDelves();
		handlers.clearEditor();
		return true;
	}
	if (text === "/resume") {
		handlers.showSessionSelector();
		handlers.clearEditor();
		return true;
	}
	if (text === "/quit") {
		handlers.clearEditor();
		await handlers.shutdown();
		return true;
	}

	return false;
}
