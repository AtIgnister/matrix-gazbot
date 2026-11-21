import { readFile } from "node:fs/promises";
import { writeFile } from "node:fs/promises";

export type AdminConfig = {
    users: string[];
};

export async function loadAdmins(): Promise<AdminConfig> {
    const data = await readFile("./admins.json", "utf-8");
    return JSON.parse(data) as AdminConfig;
}

export async function saveAdmins(admins: AdminConfig): Promise<void> {
    await writeFile(
        "admins.json",
        JSON.stringify(admins, null, 4),
        "utf-8"
    );
}