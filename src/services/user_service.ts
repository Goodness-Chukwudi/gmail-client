import DBQuery from './DBQuery';
import User, { IUser, ICreateUserPayload, IUserDocument } from '../models/user';
import { BIT } from '../data/enums/enum';
import { loginSessionRepository } from './login_session_service';
import { createAuthToken } from '../common/utils/auth_utils';
import { ILoginSessionDocument } from '../models/login_session';
import { ClientSession } from 'mongoose';

class UserRepository extends DBQuery<IUser, ICreateUserPayload, IUserDocument> {
    
    constructor() {
        super(User);
    }
}

const logoutUser = async (userId: string): Promise<ILoginSessionDocument> => {
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

const loginUser = async (userId: string, session?: ClientSession): Promise<string> => {
 return new Promise(async (resolve, reject) => {
    try {
        const loginSessionData = {
            user: userId,
            status: BIT.ON
        };
        const loginSession = await loginSessionRepository.save(loginSessionData, session);
        const token = createAuthToken(userId, loginSession.id);
        resolve(token);
    } catch (error) {
        reject(error);
    }
 })
}

const userRepository = new UserRepository();
const userService = {
    logoutUser,
    loginUser
};

export default UserRepository;
export { userRepository, userService }
