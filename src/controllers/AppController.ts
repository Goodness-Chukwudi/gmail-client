import BaseApiController from "./base controllers/BaseApiController";
import { UNABLE_TO_COMPLETE_REQUEST } from "../common/constant/error_response_message";
import { BIT, PASSWORD_STATUS } from "../data/enums/enum";
import { USER_PASSWORD_LABEL } from "../common/constant/app_constants";
import { createMongooseTransaction } from "../common/utils/app_utils";
import AppValidator from "../middlewares/validators/AppValidator";
import { PASSWORD_UPDATE_SUCCESSFUL } from "../common/constant/success_response_message";
import { passwordRepository } from "../services/password_service";
import { loginSessionRepository } from "../services/login_session_service";
import { logoutUser } from "../services/user_service";
import { createAuthToken } from "../common/utils/auth_utils";

class AppController extends BaseApiController {
    private appValidator: AppValidator;

    constructor() {
        super();
    }

    protected initializeServices() {}
    
    protected initializeMiddleware() {
        this.appValidator = new AppValidator(this.router)
    }

    protected initializeRoutes() {
        this.me("/me"); //GET
        this.logout("/logout"); //PATCH
        this.updatePassword("/password"); //PATCH
    }

    me(path:string) {
        //returns the logged in user
        this.router.get(path, (req, res) => {
            const user = this.requestUtils.getLoggedInUser();
            this.sendSuccessResponse(res, user);
        })
    }

    logout(path:string) {
        this.router.patch(path, async (req, res) => {
            try {
                const activeLoginSession = this.requestUtils.getLoginSession();
    
                if (activeLoginSession.validity_end_date > new Date()) {
                    activeLoginSession.logged_out = true;
                    activeLoginSession.validity_end_date = new Date();
                } else {
                    activeLoginSession.expired = true
                }

                activeLoginSession.status = BIT.OFF;
                await activeLoginSession.save();
                this.sendSuccessResponse(res);
    
            } catch (error: any) {
                this.sendErrorResponse(res, error, UNABLE_TO_COMPLETE_REQUEST, 500);
            }
        });
    }


    updatePassword(path:string) {
        this.router.patch(path,
            this.appValidator.validatePasswordUpdate,
            this.userMiddleWare.validatePassword,
            this.userMiddleWare.hashNewPassword
        );

        this.router.patch(path, async (req, res, next) => {
            const session = await createMongooseTransaction();
            try {
                const loggedInUser = this.requestUtils.getLoggedInUser();
                const previousPassword = this.requestUtils.getDataFromState(USER_PASSWORD_LABEL);

                const passwordData = {
                    password: req.body.password,
                    email: loggedInUser.email,
                    user: loggedInUser.id
                }
                await passwordRepository.save(passwordData, session);
                //Deactivate old password
                await passwordRepository.updateById(previousPassword.id, {status: PASSWORD_STATUS.DEACTIVATED}, session);
                next();
            } catch (error:any) {
                this.sendErrorResponse(res, error, UNABLE_TO_COMPLETE_REQUEST, 500, session) 
            }
        });

        this.router.patch(path, async (req, res) => {
            try {
                const user = this.requestUtils.getLoggedInUser();
                await logoutUser(user.id);
    
                const loginSessionData = {
                    user: user.id,
                    status: BIT.ON
                };
                const loginSession = await loginSessionRepository.save(loginSessionData);
                const token = createAuthToken(user.id, loginSession.id);
        
                this.sendSuccessResponse(res, {message: PASSWORD_UPDATE_SUCCESSFUL, token: token});                
            } catch (error: any) {
                this.sendErrorResponse(res, error, UNABLE_TO_COMPLETE_REQUEST, 500);
            }
        });
    }
}

export default new AppController().router;
