import { APP_NAME } from "../config.js";
import { createSyntheticSourceInfo, type SourceInfo } from "./source-info.js";

export type SlashCommandSource = "builtin" | "extension" | "prompt" | "skill";

export interface SlashCommandInfo {
	name: string;
	description?: string;
	source: SlashCommandSource;
	sourceInfo: SourceInfo;
}

export interface BuiltinSlashCommand {
	name: string;
	description: string;
}

export interface DiscoverableSlashCommandInput {
	builtins?: ReadonlyArray<BuiltinSlashCommand>;
	extensions?: ReadonlyArray<{ invocationName: string; description?: string; sourceInfo: SourceInfo }>;
	prompts?: ReadonlyArray<{ name: string; description?: string; sourceInfo: SourceInfo }>;
	skills?: ReadonlyArray<{ name: string; description?: string; sourceInfo: SourceInfo }>;
}

export function getBuiltinSlashCommandInfos(
	builtins: ReadonlyArray<BuiltinSlashCommand> = BUILTIN_SLASH_COMMANDS,
): SlashCommandInfo[] {
	return builtins.map((command) => ({
		name: command.name,
		description: command.description,
		source: "builtin" as const,
		sourceInfo: createSyntheticSourceInfo(`<builtin:${command.name}>`, { source: "builtin" }),
	}));
}

export function buildDiscoverableSlashCommandInfos(input: DiscoverableSlashCommandInput): SlashCommandInfo[] {
	const builtinCommands = getBuiltinSlashCommandInfos(input.builtins);
	const extensionCommands = (input.extensions ?? []).map((command) => ({
		name: command.invocationName,
		description: command.description,
		source: "extension" as const,
		sourceInfo: command.sourceInfo,
	}));
	const promptCommands = (input.prompts ?? []).map((prompt) => ({
		name: prompt.name,
		description: prompt.description,
		source: "prompt" as const,
		sourceInfo: prompt.sourceInfo,
	}));
	const skillCommands = (input.skills ?? []).map((skill) => ({
		name: `skill:${skill.name}`,
		description: skill.description,
		source: "skill" as const,
		sourceInfo: skill.sourceInfo,
	}));
	return [...builtinCommands, ...extensionCommands, ...promptCommands, ...skillCommands];
}

export const BUILTIN_SLASH_COMMANDS: ReadonlyArray<BuiltinSlashCommand> = [
	{ name: "settings", description: "Open settings menu" },
	{ name: "model", description: "Select model (opens selector UI)" },
	{ name: "scoped-models", description: "Enable/disable models for Ctrl+P cycling" },
	{ name: "export", description: "Export session (HTML default, or specify path: .html/.jsonl)" },
	{ name: "import", description: "Import and resume a session from a JSONL file" },
	{ name: "share", description: "Share session as a secret GitHub gist" },
	{ name: "copy", description: "Copy last agent message to clipboard" },
	{ name: "name", description: "Set session display name" },
	{ name: "session", description: "Show session info and stats" },
	{ name: "changelog", description: "Show changelog entries" },
	{ name: "hotkeys", description: "Show all keyboard shortcuts" },
	{ name: "fork", description: "Create a new fork from a previous user message" },
	{ name: "clone", description: "Duplicate the current session at the current position" },
	{ name: "tree", description: "Navigate session tree (switch branches)" },
	{ name: "login", description: "Configure provider authentication" },
	{ name: "logout", description: "Remove provider authentication" },
	{ name: "new", description: "Start a new session" },
	{ name: "compact", description: "Manually compact the session context" },
	{ name: "resume", description: "Resume a different session" },
	{ name: "reload", description: "Reload keybindings, extensions, skills, prompts, and themes" },
	{ name: "quit", description: `Quit ${APP_NAME}` },
];
