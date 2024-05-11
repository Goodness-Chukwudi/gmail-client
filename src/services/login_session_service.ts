import LoginSession, {ILoginSession, ICreateLoginSession, ILoginSessionDocument} from '../models/login_session';
import DBQuery from './DBQuery';

class LoginSessionRepository extends DBQuery<ILoginSession, ICreateLoginSession, ILoginSessionDocument> {

    constructor() {
        super(LoginSession);
    }

}

const loginSessionRepository = new LoginSessionRepository();

export default LoginSessionRepository;
export { loginSessionRepository }
