import DBQuery from './DBQuery';
import UserPassword, { IUserPassword, ICreateUserPassword, IUserPasswordDocument } from '../models/user_password';

class PasswordRepository extends DBQuery<IUserPassword, ICreateUserPassword, IUserPasswordDocument> {

    constructor() {
        super(UserPassword);
    }
}

const passwordRepository = new PasswordRepository();

export default PasswordRepository;
export { passwordRepository }
