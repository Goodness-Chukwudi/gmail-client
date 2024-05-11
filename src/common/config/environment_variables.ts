import 'dotenv/config'

interface IEnv {
    ENVIRONMENT: string;
    PORT: number;
    ALLOWED_ORIGINS: string[];
    API_VERSION: string;
    API_PATH: string;
    MONGODB_URI: string;
    JWT_PRIVATE_KEY: string;
    JWT_EXPIRY: string;
    GOOGLE_TOPIC_NAME: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    GMAIL_CALLBACK_URL: string;
}


const Env: IEnv = {
    ENVIRONMENT: process.env.ENVIRONMENT as string,
    PORT: process.env.PORT as unknown as number,
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS?.split(", ") as string[],
    API_VERSION: process.env.API_VERSION as string,
    API_PATH: "/api/" + process.env.API_VERSION,
    JWT_PRIVATE_KEY: process.env.JWT_PRIVATE_KEY as string,
    JWT_EXPIRY: process.env.JWT_EXPIRY as string,
    MONGODB_URI: process.env.MONGODB_URI as string,
    GOOGLE_TOPIC_NAME: process.env.GOOGLE_TOPIC_NAME as string,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID as string,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET as string,
    GMAIL_CALLBACK_URL: process.env.GMAIL_CALLBACK_URL as string
}

export default Env;