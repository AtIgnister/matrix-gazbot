import type { MatrixClient, MatrixEvent } from "matrix-js-sdk";

export interface commandContext {
    userId: string,
    body: string,
    attachments: MatrixEvent[];
    message: MatrixEvent;
    client: MatrixClient
}