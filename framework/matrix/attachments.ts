import { MatrixEvent, Room, MatrixClient } from "matrix-js-sdk";

export function isAttachment(event: MatrixEvent): boolean {
    const type = event.getType();
    const content = event.getContent();

    if (type === "m.sticker") return true;
    if (!content.msgtype) { return false }

    return (
        type === "m.room.message" &&
        ["m.image", "m.video", "m.audio", "m.file"].includes(content.msgtype)
    );
}

export function getAttachmentKey(room: Room, userId: string): string {
    return `${room.roomId}:${userId}`;
}

export function atxstoreTemporaryAttachment(
    room: Room,
    userId: string,
    event: MatrixEvent,
    temporaryAttachments: Map<
        string,
        {
            attachments: MatrixEvent[];
            timeout: ReturnType<typeof setTimeout>;
        }
    >
): void {
    const key = getAttachmentKey(room, userId);

    let entry = temporaryAttachments.get(key);

    if (entry) {
        clearTimeout(entry.timeout);
    } else {
        entry = {
            attachments: [],
            timeout: setTimeout(() => { }, 0)
        };
    }

    entry.attachments.push(event);

    entry.timeout = setTimeout(() => {
        temporaryAttachments.delete(key);
    }, 5000);

    temporaryAttachments.set(key, entry);
}

export function consumeTemporaryAttachments(
    room: Room,
    userId: string,
    temporaryAttachments: Map<
        string,
        {
            attachments: MatrixEvent[];
            timeout: ReturnType<typeof setTimeout>;
        }
    >
): MatrixEvent[] {
    const key = getAttachmentKey(room, userId);
    const entry = temporaryAttachments.get(key);

    if (!entry) return [];

    clearTimeout(entry.timeout);
    temporaryAttachments.delete(key);

    return entry.attachments;
}

export async function getTextAttachmentContent(
    client: MatrixClient,
    event: MatrixEvent
): Promise<string | null> {
    const content = event.getContent();

    if (!isAttachment(event)) return null;

    const mimetype = content.info?.mimetype;

    if (!mimetype || !mimetype.startsWith("text/")) {
        return null;
    }

    const url = content.url;

    if (!url) return null;

    const downloadUrl = client.mxcUrlToHttp(
        url,
        undefined,
        undefined,
        undefined,
        false,
        true,
        true
    );

    if (!downloadUrl) { return null }

    const response = await fetch(downloadUrl, {
        headers: {
            Authorization: `Bearer ${client.getAccessToken()}`
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to download attachment: ${response.status}`);
    }

    return await response.text();
}