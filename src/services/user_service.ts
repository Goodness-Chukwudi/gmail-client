import DBQuery from './DBQuery';
import User, { IUser, ICreateUserPayload, IUserDocument } from '../models/user';
import { BIT } from '../data/enums/enum';
import { loginSessionRepository } from './login_session_service';

class UserRepository extends DBQuery<IUser, ICreateUserPayload, IUserDocument> {
    
    constructor() {
        super(User);
    }
}

const logoutUser = async (userId: string) => {
 return new Promise(async (resolve, reject) => {
    try {
        let activeLoginSession = await loginSessionRepository.findOne({status: BIT.ON, user: userId})

        if(activeLoginSession) {
            if (activeLoginSession.validity_end_date> new Date()) {
                activeLoginSession.logged_out = true;
                activeLoginSession.validity_end_date = new Date();
            } else {
                activeLoginSession.expired = true
            }
            activeLoginSession.status = BIT.OFF;
            activeLoginSession = await activeLoginSession.save();
        }
        resolve(activeLoginSession);

    } catch (error) {
        reject(error);
    }
 })
}

const userRepository = new UserRepository();

export default UserRepository;
export {
    userRepository,
    logoutUser
}
