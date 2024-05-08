import express from 'express';
import UserMiddleware from "../../middlewares/UserMiddleware";
import BaseResponseHandler from './BaseResponseHandlerController';
import RequestUtils from '../../common/utils/RequestUtils';

/**
 * An abstract class that provides a base controller for all API controllers.
 * Controllers that extends this class get access to:
 * - an instance of the following classes: RequestUtils, UserMiddleware
 * - Other non private members of the BaseResponseHandler class
 * - The express router of the request
 * - an abstract method initServices that needs to be implemented when initializing services
 * - an abstract method initializeMiddleware that needs to be implemented when initializing middlewares
 * - an abstract method initializeRoutes that needs to be implemented when initializing routes
*/
abstract class BaseApiController extends BaseResponseHandler {

    router;
    protected userMiddleWare: UserMiddleware;
    protected requestUtils: RequestUtils;


    constructor() {
        super();
        this.router = express.Router();
        this.userMiddleWare = new UserMiddleware(this.router);
        this.requestUtils = new RequestUtils(this.router);
        this.initializeServices();
        this.initializeMiddleware();
        this.initializeRoutes();
    }
    protected abstract initializeServices():void;
    protected abstract initializeMiddleware():void;
    protected abstract initializeRoutes():void;
}

export default BaseApiController;
