import { Command } from "../framework/bot/command";
import type { commandContext } from "../framework/bot/commandContext";
import { getTextAttachmentContent } from "../framework/matrix/attachments";

export default class exampleCmd extends Command {
    constructor() {
        super({
            name: "Example",
            requiresAdmin: false,
            execute: async (ctx: commandContext, ...args: any[]) => {
                console.log("Hello world!");
                console.log(ctx.body)
                for (const attachment of ctx.attachments) {
                    const text = await getTextAttachmentContent(ctx.client, attachment);

                    if (text !== null) {
                        console.log("Attachment contents:", text);
                    }
                }
            }
        });
    }
}