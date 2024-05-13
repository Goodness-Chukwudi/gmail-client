import {Express} from "express";
import Env from "../common/config/environment_variables";
import AppController from "../controllers/AppController";
import EmailController from "../controllers/EmailController";
class AppRoutes {

    private app: Express;
    constructor(app: Express) {
        this.app = app;
    }

    initializeRoutes() {
        
        this.app.use(Env.API_PATH + "/", AppController);
        this.app.use(Env.API_PATH + "/emails", EmailController);
    }
}

export default AppRoutes;