import { Response } from "express";
import winston from "winston";
import Env from "../config/environment_variables";
import { ENVIRONMENTS } from "../config/app_config";
require("winston-mongodb");

  /**
   * A Utility class that provides methods used for logging
  */
class Logger {

    /**
     * Logs the provided error to console
     * - Logs to file as well if environment is set to production
     * @param error javascript error object
     * @param res an optional express Response object
     * - res is provided if the error occurred in a http request and the route and method needs to be recorded
     * @returns void
    */
    public logError(error: Error, res?: Response) {

        winston.add(
            new winston.transports.Console({
                format: winston.format.prettyPrint(),
            })
        );

        winston.add(
            // @ts-ignore
            new winston.transports.MongoDB({
                db: Env.MONGODB_URI,
                options: {
                    dbName: "mainstack-test-logs",
                    useNewUrlParser: true,
                    useUnifiedTopology: true,
                },
            })
        ); 

        if (Env.ENVIRONMENT == ENVIRONMENTS.PROD) {

            // winston.add(
            //     new winston.transports.File({
            //         filename: "Error Logs.log",
            //         format: winston.format.prettyPrint(),
            //     })
            // );  
        }

        winston.log({
            level: "error",
            message: `Error on the endpoint, ${res?.req.method} ${res?.req.url}  ======>    ${error.message}`,
            metadata: error,
            time_stamp: new Date()
        });
    }
    
}

export default Logger;
