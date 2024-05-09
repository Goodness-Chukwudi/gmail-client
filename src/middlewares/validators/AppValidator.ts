import { NextFunction, Request, Response, Router } from "express";
import Joi from "joi";
import BaseRouterMiddleware from "../BaseRouterMiddleware";
import { JoiValidatorOptions } from "../../common/config/app_config";
import { GENDER } from "../../data/enums/enum";
import { DUPLICATE_EMAIL, DUPLICATE_PHONE, badRequestError } from "../../common/constant/error_response_message";
import { userRepository } from "../../services/user_service";


class AppValidator extends BaseRouterMiddleware {

    constructor(appRouter: Router) {
        super(appRouter);
    }

    protected initializeServices() {}

    validateUserSignup = async ( req: Request, res: Response, next: NextFunction ) => {
        try {
            const BodySchema = Joi.object({
                first_name: Joi.string().max(50).required(),
                last_name: Joi.string().max(50).required(),
                middle_name: Joi.string().max(50),
                email: Joi.string().email().required(),
                phone: Joi.string().max(50).required(),
                gender: Joi.string().valid(...Object.values(GENDER)).required(),
                new_password: Joi.string().required(),
                confirm_password: Joi.string().required()
            });
            
            await BodySchema.validateAsync(req.body, JoiValidatorOptions);

            const existingUser = await userRepository.findOne({$or: [{email: req.body.email.toLowerCase()}, {phone: req.body.phone}]});
            if(existingUser) {
                if (existingUser.email == req.body.email) {
                    const error = new Error("A user with this email already exist");
                    return this.sendErrorResponse(res, error, DUPLICATE_EMAIL, 400)
                }
                if (existingUser.phone == req.body.phone) {
                    const error = new Error("A user with this phone number already exist");
                    return this.sendErrorResponse(res, error, DUPLICATE_PHONE, 400)
                }
            }

            next();
        } catch (error: any) {
            return this.sendErrorResponse(res, error, badRequestError(error.message), 400);
        }
    };


    validatePasswordUpdate = async ( req: Request, res: Response, next: NextFunction ) => {
        try {
            const body = req.body;
            const BodySchema = Joi.object({
                password: Joi.string().required(),
                new_password: Joi.string().required(),
                confirm_password: Joi.string().required()
            });
            
            await BodySchema.validateAsync(body, JoiValidatorOptions);

            next();
        } catch (error: any) {
            return this.sendErrorResponse(res, error, badRequestError(error.message), 400);
        }
    };
}

export default AppValidator;