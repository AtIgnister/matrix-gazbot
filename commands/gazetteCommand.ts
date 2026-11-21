
import { Command } from "../framework/bot/command";
import type { commandContext } from "../framework/bot/commandContext";
import { getPostList } from "../libs/bearblog/bearblog.ts";
import { BearblogPostStatuses } from "../libs/bearblog/post.ts";
import { sendTextMessage } from "../framework/matrix/messages.ts";

export default class gazetteCmd extends Command {
    private async listCmd(ctx: commandContext, args: string[]) {
        const status =
            args[0] === "draft" || args[0] === "drafts"
                ? BearblogPostStatuses.Draft
                : BearblogPostStatuses.Published;

        const subdomain = process.env.BEARBLOG_SUBDOMAIN;
        const data = await getPostList(status);

        let msg = "";

        data.posts.forEach((post, index) => {
            const link = status === BearblogPostStatuses.Draft
                ? `https://${subdomain}.bearblog.dev/${post.slug}/?token=${post.token}`
                : `https://${subdomain}.bearblog.dev/${post.slug}`;

            msg += `Title: ${post.title}\n`;
            msg += `UID: ${post.uid}\n`;
            msg += `Link: ${link}`;

            if (index !== data.posts.length - 1) {
                msg += "\n\n";
            }
        });

        const roomId = ctx.message.getRoomId();
        if (!roomId) return;

        await sendTextMessage(msg || "No posts found.", roomId, ctx.client);
    }

    constructor() {
        super({
            name: "gaz",
            execute: async (ctx: commandContext, args: string[]) => {
                console.log(args);
                if (args[0] === "list") {
                    await this.listCmd(ctx, args.slice(1));
                }
            }
        });
    }
}
