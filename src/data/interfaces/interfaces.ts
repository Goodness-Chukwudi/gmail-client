import joi, { Extension, Root } from "joi";
import { Types } from "mongoose";

interface IResponseMessage {
    response_code: number;
    message: string;
}

interface IObjectIdExtension extends Extension {
    type: 'string',
    base: joi.StringSchema
    messages: {'string.objectId': string},
    rules: {
        objectId: { validate(value:string, helpers:any): any }
    }
}
declare const JoiExtensionFactory: (joi: Root) => IObjectIdExtension;

interface PaginatedDocument<T> {
    items: T[];
    paginator: {
        items_count: number;
        items_per_page: number;
        current_page: number;
        next_page: number | null;
        previous_page: number | null;
        has_previous_page: boolean;
        has_next_page: boolean;
        total_pages: number;
        serial_number: number;

    }
}

interface InsertManyResult {
    acknowledged: boolean;
    insertedIds: Types.ObjectId[]
}

interface UpdateManyResult {
    acknowledged: boolean;
    matchedCount: number;
    modifiedCount: number;
    upsertedCount: number;
    upsertedId: Types.ObjectId[]
}

interface DeleteResult {
    acknowledged: boolean;
    deletedCount: number;
}

interface AuthTokenPayload {
    user: string;
    loginSession: string
}

interface GmailTokenCredentials {
    access_token: string;
    expiry_date: number;
    id_token: string;
    refresh_token: string;
    scope: string;
    token_type: string;
}

interface IEmailMessageHeader {
    from: string;
    to: string;
    subject: string;
    message_id: string;
    date: string;
    cc: string;
    bcc?: string;
};


interface IEmailMessage {
    headers: IEmailMessageHeader;
    id: string;
    threadId: string;
    labelIds: string[];
    snippet: string;
    body?: string;
    attachment_count?: number;
    draft_id?: string;
    attachments?: {
      file_name: string,
      file_type: string,
      file: string
    }[]
};

export {
    IResponseMessage,
    JoiExtensionFactory,
    PaginatedDocument,
    InsertManyResult,
    UpdateManyResult,
    DeleteResult,
    AuthTokenPayload,
    GmailTokenCredentials,
    IEmailMessageHeader,
    IEmailMessage
}
