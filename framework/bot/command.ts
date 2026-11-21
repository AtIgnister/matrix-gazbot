import { readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type { commandContext } from "./commandContext";

export abstract class Command {
    public readonly name: string | string[];
    public readonly execute: (
        ctx: commandContext,
        args: string[]
    ) => Promise<void> | void;
    constructor(options: {
        name: string | string[];
        execute: (ctx: commandContext, ...args: any[]) => Promise<void> | void;
    }) {
        this.name = options.name;
        this.execute = options.execute;
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