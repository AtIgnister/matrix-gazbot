import { loadAdmins, type AdminConfig } from "./config/adminConfig";
import { env } from "./config/env";
import Bot from "./framework/bot/bot"
import { Command } from "./framework/bot/command";

const admins: AdminConfig = await loadAdmins();
const bot = new Bot(env, admins);

const commands = await Command.loadFromDirectory("./commands");
bot.loadCommands(commands);

bot.start();