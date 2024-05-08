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

export {
    IResponseMessage,
    JoiExtensionFactory,
    PaginatedDocument,
    InsertManyResult,
    UpdateManyResult,
    DeleteResult,
    AuthTokenPayload
}
