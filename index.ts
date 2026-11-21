import { env } from "./config/env";
import Bot from "./framework/bot/bot"
import { Command } from "./framework/bot/command";

const bot = new Bot(env);

const commands = await Command.loadFromDirectory("./commands");
bot.loadCommands(commands);

bot.start();