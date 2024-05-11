import BaseRouterMiddleware from "./BaseRouterMiddleware";
import { GMAIL_TOKEN_LABEL, USER_LABEL, USER_PASSWORD_LABEL } from '../common/constant/app_constants';
import { NextFunction, Request, Response, Router } from 'express';
import { userService, userRepository } from "../services/user_service";
import { passwordRepository } from "../services/password_service";
import * as errorMessage from "../common/constant/error_response_message";
import { PASSWORD_STATUS } from "../data/enums/enum";
import { getCode } from "../common/utils/app_utils";
import { hashData, validateHashedData } from "../common/utils/auth_utils";
import { gmailService, gmailTokenRepository } from "../services/gmail_service";
import { GmailAuthorizationScopes } from "../common/config/app_config";

class UserMiddleware extends BaseRouterMiddleware {

    constructor(appRouter: Router) {
        super(appRouter)
    }


    protected initializeServices() {}

    /**
     * A middleware that fetches a user from the db using the email provided in the request.
     * - The fetched user is available through the getDataFromState or getRequestUser method of the request service
    */
    public loadUserToRequestByEmail = (req: Request, res: Response, next: NextFunction) => {
        const email = req.body.email;

        if (!email) {
            const error = new Error("email is required");
            return this.sendErrorResponse(res, error, errorMessage.requiredField("Email"), 400);
        }

        passwordRepository.findOneAndPopulate({email: email, status: PASSWORD_STATUS.ACTIVE}, ["user"])
            .then((password) => {
                if (!password) {
                    return this.sendErrorResponse(res, new Error("User not found"), errorMessage.INVALID_LOGIN, 400)
                }
                this.requestUtils.addDataToState(USER_LABEL, password.user);
                this.requestUtils.addDataToState(USER_PASSWORD_LABEL, password);
                next();
            })
            .catch((err) => {
                return this.sendErrorResponse( res, err, errorMessage.UNABLE_TO_COMPLETE_REQUEST, 500 );
            })
    }

    /**
     * Hashes a new password.
     * - Returns an invalid login error response for invalid password
    */
    public hashNewPassword = async (req: Request, res: Response, next: any) => {
        try {
            if (req.body.new_password) {
    
                if (req.body.confirm_password !== req.body.new_password) {
                    const error = new Error("Passwords do not match");
                    return this.sendErrorResponse(res, error, errorMessage.PASSWORD_MISMATCH, 400);
                }
    
                req.body.password = await hashData(req.body.new_password);
    
                next();
            } else {
                const error  =  new Error("No password provided");
                return this.sendErrorResponse(res, error, errorMessage.requiredField("New password"), 400)
            }
            
        } catch (error:any) {
            this.sendErrorResponse(res, error, errorMessage.UNABLE_TO_COMPLETE_REQUEST, 500);
        }

    }

    /**
     * Generate a default password for a user.
    */
    public generatePassword = async (req: Request, res: Response, next: any) => {
        try {
            const password = getCode(8);
            req.body.new_password = password;
            req.body.confirm_password = password;
            next();
            
        } catch (error: any) {
            this.sendErrorResponse(res, error, errorMessage.UNABLE_TO_COMPLETE_REQUEST, 500);
        }
    }

    /**
     * Validates user's password.
     * Returns an invalid login error response for invalid password
    */
    public validatePassword = async (req: Request, res: Response, next: any) => {
        try {
            let userPassword = this.requestUtils.getDataFromState(USER_PASSWORD_LABEL);
            if (!userPassword) {
                const user = this.requestUtils.getRequestUser();
                userPassword = await passwordRepository.findOne({email: user.email, status: PASSWORD_STATUS.ACTIVE});
                this.requestUtils.addDataToState(USER_PASSWORD_LABEL, userPassword);
            }

            const isCorrectPassword = await validateHashedData(req.body.password, userPassword.password);
            if (!isCorrectPassword) return this.sendErrorResponse(res, new Error("Wrong password"), errorMessage.INVALID_LOGIN, 400);

            next();
        } catch (error:any) {
            console.log(error)
            return this.sendErrorResponse(res, error, errorMessage.UNABLE_TO_COMPLETE_REQUEST, 500);
        }

    }

    /**
     * Logs out the user from other devices who's session hasn't expired yet.
    */
    public logoutExistingSession = async (req: Request, res: Response, next: any) => {
        try {
            
            const user = this.requestUtils.getRequestUser();
            await userService.logoutUser(user.id);
            next();
        } catch (error: any) {
            return this.sendErrorResponse(res, error, errorMessage.UNABLE_TO_LOGIN, 500);
        }
    }

    public validateEmail = (req:Request, res:Response, next:any) => {
        const email = req.body.email;
        if (!email) {
            const error = new Error("Email is required");
            return this.sendErrorResponse(res, error, errorMessage.requiredField("Email"), 400);
        }

        const emailRegex = new RegExp(/^([a-z0-9]+(?:[._-][a-z0-9]+)*)@([a-z0-9]+(?:[.-][a-z0-9]+)*\.[a-z]{2,})$/, "i");
        if (!emailRegex.test(email)) {
            const error =  new Error("Invalid email address");
            return this.sendErrorResponse(res, error, errorMessage.INVALID_EMAIL, 400);
        }

        userRepository.findOne({email: email})
            .then((user) => {
                if (user) {
                    const error = new Error("Email already exists");
                    return this.sendErrorResponse(res, error, errorMessage.DUPLICATE_EMAIL, 400);
                }
                next();
            })
            .catch((err) => {
                this.sendErrorResponse(res, err, errorMessage.UNABLE_TO_COMPLETE_REQUEST, 500);
        })
    }

    public validatePhone = (req:Request, res:Response, next:any) => {
        const phone = req.body.phone;
        if (!phone) {
            const error = new Error("Phone number is required");
            return this.sendErrorResponse(res, error, errorMessage.requiredField("Phone"), 400);
        }

        userRepository.findOne({phone: phone})
            .then((user) => {
                if (user) {
                    const error = new Error("Phone number already exists");
                    return this.sendErrorResponse(res, error, errorMessage.DUPLICATE_PHONE, 400);
                }
                next();
            })
            .catch((err) => {
                this.sendErrorResponse(res, err, errorMessage.UNABLE_TO_COMPLETE_REQUEST, 500);
        })
    }

    public setGmailToken = async (req:Request, res:Response, next:any) => {
        const user = this.requestUtils.getRequestUser();
        const token = await gmailTokenRepository.findOne({user: user._id, is_active: true});
        if(!token) {
            const consentPageUrl = await gmailService.getGmailConsentUrl(user.id, GmailAuthorizationScopes);
            const error = new Error("Gmail token not found");
            return this.sendErrorResponse(res, error, errorMessage.GMAIL_OAUTH_CONSENT_REQUIRED, 400, undefined, {consentPageUrl});
        };

        this.requestUtils.addDataToState(GMAIL_TOKEN_LABEL, token);
        next();
    }
}

export default UserMiddleware;
