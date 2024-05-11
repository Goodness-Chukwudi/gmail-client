import Logger from "../../common/utils/Logger";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Request, Response } from "express";
import { ClientSession } from "mongoose";
import { IResponseMessage } from "../../data/interfaces/interfaces";

abstract class BaseResponseHandler {

    protected logger: Logger;

    constructor() {
        this.logger = new Logger();
    }
    
    /**
     * Terminates the http request with the provided express res object.
     * An error response is created with the provided error details and returned to the client.
     * @param {Request} res The express response object to be used to send the error response 
     * @param {Error} error The error object. This is only for log purposes and it's not returned to client
     * @param {IResponseMessage} responseMessage A response message of type IResponseMessage
     * @param {number} statusCode HTTP status code of the error response
     * @param {ClientSession} session An optional mongoose client session, required to abort a running database transaction if any
     * @returns {void} void
    */
    protected async sendErrorResponse( res: Response, err: Error, responseMessage: IResponseMessage, statusCode: number, session?: ClientSession, data?: Record<string, any>) {

        if(session) await session.abortTransaction();

        const response = {
            message: responseMessage.message,
            success: false,
            error_code: responseMessage.response_code,
            data: data
        };

        if (statusCode == 500) this.logger.logError(err, res);

        res.status(statusCode).json(response);
    }

    /**
     * Terminates the http request with the provided express res object.
     * A success response is created and an optional data object data returned to the client.
     * @param {Response} res The express response object to be used to send the success response 
     * @param {*} data An optional data to be returned to the user
     * @param {ClientSession} session An optional mongoose client session, required to commit a running database transaction if any
     * @param {number} statusCode HTTP status code of the success response
     * @returns  void
    */
    protected async sendSuccessResponse(res: Response, data:any = null, session?: ClientSession, statusCode = 200) {
        if (session) await session.commitTransaction();
        const response = {
            success: true,
            data: data
        }
        res.status(statusCode).json(response);
    }
}

export default BaseResponseHandler;
