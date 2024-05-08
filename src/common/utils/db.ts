import mongoose from "mongoose";
import Env from "../config/environment_variables";
import { DbConfig } from "../config/app_config";

const connectToDB = async () => {
    return connectToMongoDbUsingMongoose();
}

async function connectToMongoDbUsingMongoose() {
    return new Promise((resolve, reject) => {
        try {
            mongoose.connect(Env.MONGODB_URI, DbConfig);
            mongoose.connection.on('disconnected', () => console.log("DB disconnected"));
            mongoose.connection.on('error', err => {
                console.error('Unable to connect to MongoDB via Mongoose\n'+ err.message);
                reject(err);
            });
        
            mongoose.connection.once('open', async () => {
                console.log('Connected to MongoDB via Mongoose');
                resolve(true);
            });
        } catch (error) {
            console.log(error)
            reject(error)
        }
    })
}

export default connectToDB;