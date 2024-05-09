import { Document, Schema, Types, model} from "mongoose";
import { PASSWORD_STATUS } from "../data/enums/enum";
import MODEL_NAMES from "../data/model_names";
import { IUserDocument } from "./user";

const ObjectId = Schema.Types.ObjectId;

const UserPasswordSchema = new Schema<Record<keyof IUserPassword, any>>({
    password: {type: String, required: true},
    email: {type: String, required: true, index: true, unique: true},
    user: { type: ObjectId, required: true, ref: MODEL_NAMES.USER},
    status: { type: String, default: PASSWORD_STATUS.ACTIVE, enum: Object.values(PASSWORD_STATUS)}
},

{
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

interface ICreateUserPassword {
    password: string;
    email: string;
    user: string | IUserDocument;
    status?: string;
}

interface IUserPassword extends Required<ICreateUserPassword> {};

const UserPassword = model<IUserPassword>(MODEL_NAMES.USER_PASSWORD, UserPasswordSchema);
interface IUserPasswordDocument extends IUserPassword, Document {_id: Types.ObjectId};

export default UserPassword;
export { IUserPasswordDocument, ICreateUserPassword, IUserPassword }
