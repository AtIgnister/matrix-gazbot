import type { MatrixClient, MatrixEvent } from "matrix-js-sdk";
import type { AdminConfig } from "../../config/adminConfig";

export interface commandContext {
    userId: string,
    body: string,
    attachments: MatrixEvent[];
    message: MatrixEvent;
    client: MatrixClient,
    readonly admins: AdminConfig;
}