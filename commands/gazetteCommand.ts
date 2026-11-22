
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
        if (!args[0] || !roomId) return;

        // Fetch the existing post to get its current title.
        const existingPost = await getPost(args[0]);

        if (!existingPost) {
            await sendTextMessage("Post not found.", roomId, ctx.client);
            return;
        }

        for (const attachment of ctx.attachments) {
            const text = await getTextAttachmentContent(ctx.client, attachment);
            const attachmentName = await getAttachmentName(attachment);

            if (!text) {
                await sendTextMessage("No attachment content found.", roomId, ctx.client);
                return;
            }

            if (!attachmentName) return;

            // Use the existing post title as fallback.
            const updatedPost = parseBearblogPost(text, existingPost.title || attachmentName);

            const post = await updatePost(args[0], updatedPost);

            if (!post) return;

            if (post.publish === false) {
                await sendTextMessage(
                    `Draft updated! View it at https://${env.BEARBLOG_SUBDOMAIN}.bearblog.dev/${post.slug}/?token=${post.token}\nUID: ${post.uid}`,
                    roomId,
                    ctx.client
                );
            } else {
                await sendTextMessage(
                    `Post updated! View it at https://${env.BEARBLOG_SUBDOMAIN}.bearblog.dev/${post.slug}\nUID: ${post.uid}`,
                    roomId,
                    ctx.client
                );
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

        await sendTextMessage(`Post published! View it at https://${env.BEARBLOG_SUBDOMAIN}.bearblog.dev/${post.slug} \nUID: ${post.uid}`, roomId, ctx.client);
    }

    private async helpCmd(ctx: commandContext, args: string[]) {
        const roomId = ctx.message.getRoomId();
        if (!roomId) return;

        await sendTextMessage(`
            # Help - !gazette
            You can call the gazette command in two different ways - !gaz or !gazette.
            These are the available options:

            ## list
            Usage: gazette list [post_type]
            Lists all posts. For the first argument, specify either draft or published, to get the respective post types.
            All listed posts will also show their respective UID. You'll need this for most other commands.
            Examples: !gazette list drafts, !gazette list published

            ## export
            Usage: !gazette export [UID]
            Exports a gazette post to a markdown file. This takes a UID as its first argument.
            Use this when you want to edit a post, to first get the version that's currently saved on the gazette.
            Examples: !gazette export MreDPdoAtdobnyIoZcud 

            ## create
            Usage: !gazette create draft | (text attachment required)
            Publishes the attached text file to the grizzly gazette as a draft post, and returns a viewable URL, and a UID.
            Only works if you attach a markdown file to your message.
            Add a [frontmatter header](https://www.markdownlang.com/advanced/frontmatter.html) to the file you attach to change the post attributes. All the attributes are called the same thing they're called on bearblog.
            Examples: !gazette create draft

            ## update
            Usage: !gazette update [UID] | (text attachment required)
            Updates the post with the specified UID by replacing its contents with the content of the attachment.
            Supports frontmatter for updating post attributes. Will only change the attributes included in the frontmatter header, meaning that you can't accidentally unset attributes.
            Examples: !gazette update MreDPdoAtdobnyIoZcud

            ## publish
            Usage: !gazette publish [UID]
            Publishes the post with the specified UID.
            This can technically also be done by just changing the frontmatter attribute "publish" to true, this command is just for the sake of convenience.
            Examples: !gazette publish MreDPdoAtdobnyIoZcud
            
        `, roomId, ctx.client);
    }

    constructor() {
        super({
            name: ["gaz", "gazette"],
            requiresAdmin: true,
            execute: async (ctx: commandContext, args: string[]) => {
                if (args[0] === "list") {
                    await this.listCmd(ctx, args.slice(1));
                    return;
                }
                if (args[0] === "export") {
                    await this.exportCmd(ctx, args.slice(1))
                    return;
                }
                if (args[0] === "create") {
                    await this.createPostCmd(ctx, args.slice(1));
                    return;
                }
                if (args[0] === "update") {
                    await this.updatePostCmd(ctx, args.slice(1));
                    return;
                }
                if (args[0] === "publish") {
                    await this.publishPostCmd(ctx, args.slice(1));
                    return;
                }

                this.helpCmd(ctx, args.slice(1));
            }
        });
    }
}
