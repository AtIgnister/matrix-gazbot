import { MatrixClient, MsgType, EventType } from "matrix-js-sdk";

export async function sendTextMessage(
    textContent: string,
    roomId: string,
    client: MatrixClient
): Promise<void> {
    await client.sendEvent(roomId, EventType.RoomMessage, {
        msgtype: MsgType.Text,
        body: textContent
    });
}

export async function sendTextMessageWithTextAttachment(
    message: string,
    attachment: string,
    roomId: string,
    client: MatrixClient,
    filename: string = "attachment.txt"
): Promise<void> {
    // Send the regular text message
    await client.sendTextMessage(roomId, message);

    // Convert attachment string to a Blob
    const blob = new Blob([attachment], {
        type: "text/plain"
    });

    // Upload attachment
    const upload = await client.uploadContent(blob, {
        name: filename,
        type: "text/plain"
    });

    // Send attachment event
    await client.sendEvent(roomId, EventType.RoomMessage, {
        msgtype: MsgType.File,
        body: filename,
        filename,
        url: upload.content_uri,
        info: {
            mimetype: "text/plain",
            size: blob.size
        }
    });
}