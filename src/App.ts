import express, { Express } from "express";
import helmet from "helmet";
import compression from "compression"
import AppRoutes from "./routes/AppRoutes";
import AuthController from "./controllers/AuthController";
import AuthMiddleware from "./middlewares/AuthMiddleware";
import Env from "./common/config/environment_variables";
import corsSettings from "./common/utils/cors";
import AppValidator from "./middlewares/validators/AppValidator";

class App {

    public app: Express;
    private authMiddleware: AuthMiddleware;
    private appRoutes: AppRoutes;
    private appValidator: AppValidator;

    constructor() {
      this.app = express();
      this.plugInMiddlewares();
      this.plugInRoutes();
    }

    private plugInMiddlewares() {
      this.app.use(express.json());
      this.app.use(express.urlencoded({ extended: false }));
      this.app.use(corsSettings);
      this.app.use(helmet());
      this.app.use(compression());

      this.authMiddleware = new AuthMiddleware(this.app);
      this.appRoutes = new AppRoutes(this.app);
      this.appValidator = new AppValidator(this.app);
    }

    private plugInRoutes() {
      this.app.get("/", (req, res) => {
        res.status(200).send("<h1>Successful</h1>");
      });

      this.app.get(Env.API_PATH + "/health", (req, res) => {
        const response = "Server is healthy____   " + new Date().toUTCString();
        res.status(200).send(response);
      });
      
      this.app.use(Env.API_PATH, this.appValidator.validateDefaultQueries);
      //load public/non secured routes
      this.app.use(Env.API_PATH + "/public", AuthController);

      //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      //  ALWAYS PREFIX EACH ENDPOINT WITH THE VALUE OF <API_PATH>
      //  THE AUTH GUARD ONLY WATCHES OUT FOR ENDPOINTS PREFIXED WITH THE VALUE OF <API_PATH>
      
      //  Load Authentication MiddleWare
      this.app.use(Env.API_PATH, this.authMiddleware.authGuard);
      
      //Initialize other routes
      //These routes are protected by the auth guard
      this.appRoutes.initializeRoutes();

      //return a 404 for unspecified/unmatched routes
      this.app.all("*", (req, res) => {
        
        res.status(404).send("RESOURCE NOT FOUND");
      });
      
    }
}

export default new App().app;