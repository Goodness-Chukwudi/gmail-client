import RequestUtils from "../common/utils/RequestUtils";
import BaseResponseHandler from "../controllers/base controllers/BaseResponseHandlerController";
import { NextFunction, Request, Response, Router } from "express";
import Joi from "joi";
import { JoiValidatorOptions } from "../common/config/app_config";
import { objectId } from "../common/utils/joi_extensions";
import { badRequestError } from "../common/constant/error_response_message";

const JoiId = Joi.extend(objectId);

/**
 * An abstract class that provides a base middleware for all routers.
 * Middleware classes that extend this class get access to:
 * - an instance of RequestUtils
 * - Other non private members of the BaseResponseHandler class
 * - The express router of the request
 * - an abstract method initServices that needs to be implemented when initializing services
*/
abstract class BaseRouterMiddleware extends BaseResponseHandler {

    public router;
    protected requestUtils: RequestUtils;


    constructor(appRouter: Router) {
        super();
        this.router = appRouter;
        this.requestUtils = new RequestUtils(this.router);
        this.initializeServices();
    }
    protected abstract initializeServices():void;

    /**
     * Validates the specified properties on the query object of a http request.
     * The specified properties are
     * - size, a number specifying the number of items per page in a paginated endpoint
     * - page, a number specifying the page number in a paginated endpoint
     * - sort, a boolean specifying if the documents should be sorted by the created_at property
     * - id, a mongo db object Id
     * - ids, a list of mongo db object Ids
     * Returns a 404 with the appropriate error message if validation fails
    */ 
    validateDefaultQueries = async ( req: Request, res: Response, next: NextFunction ) => {
        try {
            const QuerySchema = Joi.object({

                page_size: Joi.number().min(0),
                page: Joi.number().min(0),
                sort: Joi.object(),
                user_id: JoiId.string().objectId(),
                id: JoiId.string().objectId(),
                ids: Joi.array().items(JoiId.string().objectId()).min(1),
                startDate: Joi.date().iso(),
                endDate: Joi.date().iso()
            });
            const ParamSchema = Joi.object({
                id: JoiId.string().objectId(),
            });

            JoiValidatorOptions.allowUnknown = true;
            await QuerySchema.validateAsync(req.query, JoiValidatorOptions);
            await ParamSchema.validateAsync(req.params, JoiValidatorOptions);

            next();
        } catch (error: any) {
            return this.sendErrorResponse(res, error, badRequestError(error.message), 400);
        }
    };
    
    /**
     * Validates the specified properties on the params object of a http request.
     * - ids, a list of mongo db object Ids
     * Returns a 404 with the appropriate error message if validation fails
    */ 
    validateDefaultParams = async ( req: Request, res: Response, next: NextFunction ) => {
        try {
            const ParamSchema = Joi.object({
                id: JoiId.string().objectId().required()
            });
            
            await ParamSchema.validateAsync(req.params, JoiValidatorOptions);
            next();
        } catch (error: any) {
            return this.sendErrorResponse(res, error, badRequestError(error.message), 400);
        }
    };
}

export default BaseRouterMiddleware;
