export default class CommandInput {
    commandName: string;
    arguments: string[];

    constructor(messageBody: string) {
        const parts = messageBody.trim().split(/\s+/);

        if (!parts[0]?.startsWith("!")) {
            throw new Error("Invalid command prefix");
        }

        this.commandName = parts[0].slice(1);
        this.arguments = parts.slice(1);
    }
}