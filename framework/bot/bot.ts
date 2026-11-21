import { createClient, MatrixClient, MatrixEvent, RoomEvent } from "matrix-js-sdk";
import type { config_template_basic } from "../env/template_basic";
import { Command } from "./command";
import CommandInput from "./commandInput";
import type { commandContext } from "./commandContext";
import { isAttachment, atxstoreTemporaryAttachment, consumeTemporaryAttachments } from "../matrix/attachments.ts";

export default class Bot {
    client: MatrixClient;
    readonly startTime: number;

    private commands: Map<string, Command> = new Map()
    private temporaryAttachments = new Map<
        string,
        {
            attachments: MatrixEvent[];
            timeout: ReturnType<typeof setTimeout>;
        }
    >();

    constructor(env: config_template_basic) {
        this.client = createClient({
            baseUrl: env.HOMESERVER,
            accessToken: env.ACCESS_TOKEN,
            userId: env.USERNAME
        })
        this.startTime = Date.now();
    }

    start() {
        this.registerEvents(this.client);
        this.client.startClient();
    }

    stop() {
        this.client.stopClient();
    }

    addCommand(command: Command) {
        this.commands.set(command.name, command)
    }

    loadCommands(commands: Command[]) {
        commands.forEach((command) => {
            this.addCommand(command);
        })
    }

    executeCommand(commandName: string, context: commandContext, args?: string[]) {
        const command = this.commands.get(commandName);
        if (command instanceof Command) {
            command.execute(context, (args ?? []))
        } else {
            console.log(`Command "${commandName}" not found."`)
        }
    }

    private registerEvents(client: MatrixClient) {
        client.on(RoomEvent.Timeline, async (event, room, toStartOfTimeline) => {
            if (toStartOfTimeline) return;
            if (event.getSender() === client.getUserId()) return;

            const eventId = event.getId();
            if (!eventId) return;

            const eventTime = event.getTs();
            if (eventTime < this.startTime) return;

            const content = event.getContent();
            const userId = event.getSender();

            if (!room) { return }
            if (!userId) { return; }

            if (isAttachment(event)) {
                const body = event.getContent().body ?? "";

                if (!body.trim().startsWith("!")) {
                    atxstoreTemporaryAttachment(room, userId, event, this.temporaryAttachments);
                    return;
                }
            }

            if (event.getType() !== "m.room.message") return;

            const body = content.body || "";
            // Ignore messages that aren't commands.
            if (!body.trim().startsWith("!")) return;

            try {
                const input = new CommandInput(body);

                // Attachments directly included in the command message.
                const directAttachments = isAttachment(event)
                    ? [event]
                    : [];

                // Attachments sent shortly before the command.
                const temporaryAttachments =
                    consumeTemporaryAttachments(room, userId, this.temporaryAttachments);

                const ctx: commandContext = {
                    userId: userId,
                    body: body,
                    attachments: [
                        ...temporaryAttachments,
                        ...directAttachments
                    ],
                    message: event,
                    client: this.client
                }
                this.executeCommand(input.commandName, ctx, input.arguments)
            } catch (error) {

            }
        })
    }
}