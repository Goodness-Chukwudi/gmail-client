import BaseApiController from "./base controllers/BaseApiController";
import { UNABLE_TO_LOGIN } from "../common/constant/error_response_message";
import { LOGIN_SUCCESSFUL } from "../common/constant/success_response_message";
import { BIT } from "../data/enums/enum";
import { loginSessionRepository } from "../services/login_session_service";
import { createAuthToken } from "../common/utils/auth_utils";

class AuthController extends BaseApiController {

    constructor() {
        super();
    }

    protected initializeServices() {}
    
    protected initializeMiddleware() {}

    protected initializeRoutes() {
        this.login("/login"); //POST
    }

    login(path:string) {
        this.router.post(path,
            this.userMiddleWare.loadUserToRequestByEmail,
            this.userMiddleWare.validatePassword,
            this.userMiddleWare.logoutExistingSession
        );

        this.router.post(path, async (req, res) => {
            const user = this.requestUtils.getLoggedInUser();

            try {
                const loginSessionData = {
                    user: user.id,
                    status: BIT.ON
                };
        
                const loginSession = await loginSessionRepository.save(loginSessionData);
                const token = createAuthToken(user.id, loginSession.id);

                const response = {
                    message: LOGIN_SUCCESSFUL,
                    token: token,
                    user: user
                }

                return res.status(200).json(response);
            } catch (error:any) {
                this.sendErrorResponse(res, error, UNABLE_TO_LOGIN, 500);
            }
        });
    }
}

export default new AuthController().router;
