import { Document, Schema, Types, model} from "mongoose";
import mongoosePagination from "mongoose-paginate-v2";
import { GENDER } from "../data/enums/enum";
import MODEL_NAMES from "../data/model_names";

const schemaFields: Record<keyof Omit<IUser, "full_name" | "phone_with_country_code">, any> = {
    first_name: { type: String,  required: [true, "first name is required"], trim: true, index: true},
    last_name: { type: String,  required: [true, "last name is required"], trim: true, index: true},
    middle_name: { type: String},
    email: { type: String, lowercase: true, unique: true, trim: true, required: [true, "email is required"]},
    phone: { type: String, unique: true, required: [true, "phone is required"], trim: true},
    phone_country_code: { type: String,  default: "234"},
    gender: {type: String, lowercase: true, required: [true, "gender is required"], enum: Object.values(GENDER)}
}
const UserSchema = new Schema(
    schemaFields,
    {
        toObject: { virtuals: true },
        toJSON: { virtuals: true },
        timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'}
    })
;

UserSchema.virtual('full_name').get(function() {
    if (this.middle_name)
    return `${this.first_name} ${this.middle_name} ${this.last_name}`;
    return `${this.first_name} ${this.last_name}`;
});

UserSchema.virtual('phone_with_country_code').get(function() {
    if (this.phone && this.phone_country_code) {
        const phoneWithoutZero = parseInt(this.phone);
        const phone = '+' + this.phone_country_code + phoneWithoutZero.toString();
        return phone;
    }
});


interface ICreateUserPayload {

    first_name: string;
    last_name: string;
    middle_name?: string;
    full_name?: string;
    phone_with_country_code?: string;
    email: string;
    phone: string;
    phone_country_code?: string;
    gender: string;
}

interface IUser extends Required<ICreateUserPayload> {};

UserSchema.plugin(mongoosePagination);

const User = model<IUser>(MODEL_NAMES.USER, UserSchema);
interface IUserDocument extends IUser, Document {_id: Types.ObjectId};

export default User;
export { IUserDocument, ICreateUserPayload, IUser }
