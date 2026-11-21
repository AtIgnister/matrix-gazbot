
import { Command } from "../framework/bot/command";
import type { commandContext } from "../framework/bot/commandContext";

import { createDraft, getPost, getPostList, parseBearblogPost, updatePost, publishPost } from "../libs/bearblog/bearblog.ts";
import { BearblogPostStatuses } from "../libs/bearblog/post.ts";

import { sendTextMessage, sendTextMessageWithTextAttachment } from "../framework/matrix/messages.ts";
import { getAttachmentName, getTextAttachmentContent } from "../framework/matrix/attachments.ts";
import { env } from "../config/env.ts";

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

    private async exportCmd(ctx: commandContext, args: string[]) {
        const roomId = ctx.message.getRoomId();
        if (!roomId) return;
        if (!args[0]) return;

        const post = await getPost(args[0]);
        console.log(args);
        if (post === null) {
            sendTextMessage("Post not found.", roomId, ctx.client);
            return;
        }

        sendTextMessageWithTextAttachment("Post Exported:", post.content, roomId, ctx.client, post.slug + ".md")
    }

    private async createPostCmd(ctx: commandContext, args: string[]) {
        const roomId = ctx.message.getRoomId();

        if (!args[0]) return;
        if (!roomId) return;
        if (args[0] !== "draft") return;

        for (const attachment of ctx.attachments) {
            const text = await getTextAttachmentContent(ctx.client, attachment);
            const attachmentName = await getAttachmentName(attachment);
            if (!text) {
                sendTextMessage("No attachment content found.", roomId, ctx.client)
                return;
            }

            if (!attachmentName) { return; }
            const draft = parseBearblogPost(text, attachmentName)

            const post = await createDraft(draft);

            if (post) {
                sendTextMessage(`Draft created! View it at https://${env.BEARBLOG_SUBDOMAIN}.bearblog.dev/${post.slug}/?token=${post.token} \nUID: ${post.uid}`, roomId, ctx.client)
            }
        }
    }

    private async updatePostCmd(ctx: commandContext, args: string[]) {
        const roomId = ctx.message.getRoomId();
        if (!args[0]) return;
        if (!roomId) return;

        for (const attachment of ctx.attachments) {
            const text = await getTextAttachmentContent(ctx.client, attachment);
            const attachmentName = await getAttachmentName(attachment);
            if (!text) {
                sendTextMessage("No attachment content found.", roomId, ctx.client)
                return;
            }

            if (!attachmentName) { return; }
            const updatedPost = parseBearblogPost(text, attachmentName)

            const post = await updatePost(args[0], updatedPost);
            if (!post) {
                return;
            }

            if (post.publish == false) {
                sendTextMessage(`Draft updated! View it at https://${env.BEARBLOG_SUBDOMAIN}.bearblog.dev/${post.slug}/?token=${post.token} \nUID: ${post.uid}`, roomId, ctx.client);
            } else {
                sendTextMessage(`Post updated! View it at https://${env.BEARBLOG_SUBDOMAIN}.bearblog.dev/${post.slug} \nUID: ${post.uid}`, roomId, ctx.client)
            }
        }
    }

    private async publishPostCmd(ctx: commandContext, args: string[]) {
        const roomId = ctx.message.getRoomId();
        if (!args[0]) return;
        if (!roomId) return;

        const post = await publishPost(args[0])
        if (!post) {
            return;
        }

        sendTextMessage(`Post published! View it at https://${env.BEARBLOG_SUBDOMAIN}.bearblog.dev/${post.slug} \nUID: ${post.uid}`, roomId, ctx.client)
    }

    constructor() {
        super({
            name: ["gaz", "gazette"],
            execute: async (ctx: commandContext, args: string[]) => {
                if (args[0] === "list") {
                    await this.listCmd(ctx, args.slice(1));
                }
                if (args[0] === "export") {
                    await this.exportCmd(ctx, args.slice(1))
                }
                if (args[0] === "create") {
                    await this.createPostCmd(ctx, args.slice(1));
                }
                if (args[0] === "update") {
                    await this.updatePostCmd(ctx, args.slice(1));
                }
                if (args[0] === "publish") {
                    await this.publishPostCmd(ctx, args.slice(1));
                }
            }
        });
    }
}
