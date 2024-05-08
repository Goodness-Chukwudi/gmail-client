import { ClientSession, Document, Model, Schema, Types, model} from "mongoose";
import MODEL_NAMES from "../data/model_names";

const ObjectId = Schema.Types.ObjectId;

const SequenceCounterSchema = new Schema<Record<keyof ISequenceCounter, any>, SequenceCounterModel>({
    current_count: {type: Number, required: true},
    name: {type: String, required: true, unique: true},
    previous_counter: { type: ObjectId, ref: MODEL_NAMES.SEQUENCE_COUNTER},
    next_counter: { type: ObjectId, ref: MODEL_NAMES.SEQUENCE_COUNTER},
    status: { type: String, default: "active", enum: ["active", "deactivated"]}
},
{
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

interface ICreateSequenceCounter {
    current_count: number;
    name: string;
    previous_counter?: string | ISequenceCounterDocument;
    next_counter?: string | ISequenceCounterDocument;
    status?: string;
}

interface ISequenceCounter extends Required<ICreateSequenceCounter> {};

interface SequenceCounterModel extends Model<ISequenceCounter> {
    getNextNumber(name: string, session?: ClientSession): number
}

SequenceCounterSchema.statics.getNextNumber = async function (name: string, session: ClientSession | null = null) {
    
    try {
        let counter = await this.findOneAndUpdate(
            {type: name},
            { $inc: { current_count: 1} },
            { new: true, session: session}
            );
            
            if (!counter) {
                const newCounter = new SequenceCounter({current_count: 1, name: name});
                counter = await newCounter.save({session: session});
            }
            
        return counter.current_count;
        
    } catch (error) {
        throw error;
    }
}
    
const SequenceCounter = model<ISequenceCounter, SequenceCounterModel>(MODEL_NAMES.SEQUENCE_COUNTER, SequenceCounterSchema);
interface ISequenceCounterDocument extends ISequenceCounter, Document {_id: Types.ObjectId};

export default SequenceCounter;
export { ISequenceCounter, ICreateSequenceCounter, ISequenceCounterDocument }
