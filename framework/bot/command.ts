import { readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type { commandContext } from "./commandContext";

export abstract class Command {
    public readonly name: string;
    public readonly execute: (
        ctx: commandContext,
        args: string[]
    ) => Promise<void> | void;
    public readonly subcommands: Map<string, Command>;

    constructor(options: {
        name: string;
        execute: (ctx: commandContext, ...args: any[]) => Promise<void> | void;
        subcommands?: Map<string, Command>;
    }) {
        this.name = options.name;
        this.execute = options.execute;
        this.subcommands = options.subcommands ?? new Map();
    }

    addSubcommand(key: string, command: Command): void {
        this.subcommands.set(key, command);
    }

    getSubcommand(key: string): Command | undefined {
        return this.subcommands.get(key);
    }

    static async loadFromDirectory(directory: string): Promise<Command[]> {
        const files = await readdir(directory);
        const commands: Command[] = [];

        for (const file of files.filter(f => f.endsWith(".ts") || f.endsWith(".js")).sort()) {
            console.log(file)
            const filePath = resolve(directory, file);
            const module = await import(pathToFileURL(filePath).href);

            const CommandClass = module.default;

            if (
                typeof CommandClass !== "function" ||
                !(CommandClass.prototype instanceof Command)
            ) {
                continue;
            }

            const command: Command = new CommandClass();
            commands.push(command);

            console.log(`Instanciated new command ${command.name}`)
        }

        return commands;
    }
}