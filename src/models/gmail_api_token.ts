import { Document, Schema, Types, model} from "mongoose";
import MODEL_NAMES from "../data/model_names";
import { IUserDocument } from "./user";

const ObjectId = Schema.Types.ObjectId;

const GmailTokenSchema = new Schema<Record<keyof IGmailToken, any>>({
    user: {type: ObjectId, required: true, ref: MODEL_NAMES.USER},
    email: {type: String, required: true},
    token: {type: String, required: true},
    scope: {type: [String], required: true},
    is_active: {type: Boolean, default: true}
},

{
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

interface ICreateGmailToken {
    user: string|IUserDocument,
    email: string,
    token: string,
    scope: string[],
    is_active?: boolean
}

interface IGmailToken extends Required<ICreateGmailToken> {};

const GmailToken = model<IGmailToken>(MODEL_NAMES.GMAIL_API_TOKEN, GmailTokenSchema);
interface IGmailTokenDocument extends IGmailToken, Document {_id: Types.ObjectId};

export default GmailToken;
export { IGmailTokenDocument, ICreateGmailToken, IGmailToken }
