import { saveAdmins, type AdminConfig } from "../config/adminConfig";
import { Command } from "../framework/bot/command";
import type { commandContext } from "../framework/bot/commandContext";
import { sendTextMessage } from "../framework/matrix/messages";

export default class adminCmd extends Command {
    constructor() {
        super({
            name: "Admin",
            requiresAdmin: true,
            execute: async (ctx: commandContext, args: string[]) => {
                if (args[0] === "ADD_ALL_IN_ROOM") {
                    const roomId = ctx.message.getRoomId();
                    if (!roomId) { return; }

                    try {
                        const admins = await addRoomMembersToAdmins(roomId, ctx, ctx.admins) as AdminConfig;
                        saveAdmins(admins);
                        sendTextMessage("Added all members of this room to the admin list.", roomId, ctx.client)
                    } catch {
                        console.log("Failed to add new admins.");
                    }
                }
            }
        });
    }
}

async function addRoomMembersToAdmins(roomId: string, ctx: commandContext, admins: AdminConfig): Promise<AdminConfig> {
    const response = await ctx.client.getJoinedRoomMembers(roomId);

    const addedUsers: string[] = [];

    for (const userId of Object.keys(response.joined)) {
        if (!admins.users.includes(userId)) {
            admins.users.push(userId);
        }
    }

    return admins;
}