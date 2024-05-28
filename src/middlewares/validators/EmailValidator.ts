import { NextFunction, Request, Response, Router } from "express";
import Joi from "joi";
import BaseRouterMiddleware from "../BaseRouterMiddleware";
import { JoiValidatorOptions } from "../../common/config/app_config";
import { badRequestError } from "../../common/constant/error_response_message";


class EmailValidator extends BaseRouterMiddleware {

    constructor(appRouter: Router) {
        super(appRouter);
    }

    protected initializeServices() {}

    validateEmail = async ( req: Request, res: Response, next: NextFunction ) => {
        try {
            const body = req.body;
            body.recipient = JSON.parse(body.recipient);
            body.cc = JSON.parse(body.cc);
            body.bcc = JSON.parse(body.bcc);

            const BodySchema = Joi.object({
                recipient: Joi.array().items(Joi.string().email()).unique().min(1).required(),
                cc: Joi.array().items(Joi.string().email()).unique().min(1),
                bcc: Joi.array().items(Joi.string().email()).unique().min(1),
                email_body: Joi.string().required(),
                subject: Joi.string()
            });
            
            await BodySchema.validateAsync(body, JoiValidatorOptions);

            next();
        } catch (error: any) {
            return this.sendErrorResponse(res, error, badRequestError(error.message), 400);
        }
    };

    validateDraft = async ( req: Request, res: Response, next: NextFunction ) => {
        try {
            const body = req.body;

            body.recipient = JSON.parse(body.recipient);
            body.cc = JSON.parse(body.cc);
            body.bcc = JSON.parse(body.bcc);

            const BodySchema = Joi.object({
                recipient: Joi.array().items(Joi.string().email()).unique().min(1),
                cc: Joi.array().items(Joi.string().email()).unique().min(1),
                bcc: Joi.array().items(Joi.string().email()).unique().min(1),
                email_body: Joi.string(),
                subject: Joi.string()
            });
            
            await BodySchema.validateAsync(body, JoiValidatorOptions);

            next();
        } catch (error: any) {
            return this.sendErrorResponse(res, error, badRequestError(error.message), 400);
        }
    };
}

export default EmailValidator;