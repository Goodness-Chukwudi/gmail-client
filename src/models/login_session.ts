import { Document, Schema, Types, model} from "mongoose";
import { BIT } from "../data/enums/enum";
import MODEL_NAMES from "../data/model_names";
import { IUserDocument } from "./user";

const ObjectId = Schema.Types.ObjectId;

const LoginSessionSchema = new Schema<Record<keyof ILoginSession, any>>({
    user: { type: ObjectId, required: true, ref: MODEL_NAMES.USER},
    status: {type: Number, enum: Object.values(BIT), default: BIT.OFF},
    validity_end_date: {type: Date, default: new Date(Date.now() + 86400000)}, //1 day
    logged_out: {type: Boolean, default: false},
    expired: {type: Boolean, default: false},
    os: { type: String},
    version: { type: String},
    device: { type: String},
    ip: { type: String},
}, 
{
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

interface ICreateLoginSession {
    user: string | IUserDocument;
    status?: number;
    validity_end_date?: Date;
    logged_out?: boolean;
    expired?: boolean;
    os?: string;
    version?: string;
    device?: string;
    ip?: string;
}

interface ILoginSession extends Required<ICreateLoginSession> {};

const LoginSession = model<ILoginSession>(MODEL_NAMES.LOGIN_SESSION, LoginSessionSchema);
interface ILoginSessionDocument extends ILoginSession, Document {_id: Types.ObjectId};

export default LoginSession;
export { ILoginSession, ICreateLoginSession, ILoginSessionDocument };
