import Joi from "joi";
import { ENVIRONMENTS } from "../config/app_config";
import Env from "../config/environment_variables";

function validateEnvironmentVariables() {
    try {

        const EnvSchema = Joi.object({
            ENVIRONMENT: Joi.string().valid(...Object.values(ENVIRONMENTS)).required(),
            PORT: Joi.number().required(),
            ALLOWED_ORIGINS: Joi.array().items(Joi.string()).min(1).required(),
            API_VERSION: Joi.string().required(),
            API_PATH: Joi.string().required(),
            MONGODB_URI: Joi.string().required(),
            JWT_PRIVATE_KEY: Joi.string().required(),
            JWT_EXPIRY: Joi.string().required()
        });
        
        const response = EnvSchema.validate(Env);
        if (response.error) throw new Error(`Env validation error: ${response.error.message}`);

    } catch (error) {
        throw error;
    }
};

export default validateEnvironmentVariables;