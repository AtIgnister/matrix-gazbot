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