import { configDotenv } from "dotenv";
import type { config_template_bearblog } from "../framework/env/template_bearblog";

configDotenv();

export const env: config_template_bearblog = {
    HOMESERVER: process.env.HOMESERVER!,
    ACCESS_TOKEN: process.env.ACCESS_TOKEN!,
    USERNAME: process.env.USERNAME!,
    BEARBLOG_KEY: process.env.BEARBLOG_KEY!,
    BEARBLOG_SUBDOMAIN: process.env.BEARBLOG_SUBDOMAIN!
};