import cors from "cors";
import Env from "../config/environment_variables";

const corsOptions = {
    origin: Env.ALLOWED_ORIGINS,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Date", "Content-Type", "Origin", "Authorization"],
    credentials: true,
    optionSuccessStatus: 200,
};

const corsSettings = cors(corsOptions);

export default corsSettings;