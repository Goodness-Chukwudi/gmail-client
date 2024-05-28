import { Request } from "express";
import { ENVIRONMENTS } from "../config/app_config";
import Env from "../config/environment_variables";
import { getCode } from "./app_utils";
import bcrypt from 'bcryptjs';
import Jwt from "jsonwebtoken";
import { AuthTokenPayload } from "../../data/interfaces/interfaces";

/**
 * Generates an authentication token. Signs the provided data into the token
 * @param {ILoginSession} loginSession the login session of type ILoginSession, created for a user's login
 * @returns {string} an alphanumeric string of the specified length
*/
const createAuthToken = (userId: string, loginSessionId: string): string => {
    try {
        const data:AuthTokenPayload = {user: userId, loginSession: loginSessionId};
        const token = Jwt.sign({ data: data}, Env.JWT_PRIVATE_KEY, { expiresIn: Env.JWT_EXPIRY });
        return token;
        
    } catch (error) {
        throw error;
    }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type jwtCallBack = (err: any, decoded: any) => void;
/**
 * Verifies a jwt token and decodes the payload
 * @callback jwtCallBack
 * @param {string} token the jwt token to be verified
 * @param {jwtCallBack} callback a callback function passed to jwt verify api on verification
 * @returns void
*/
const verifyJwtToken = (token: string, callback:(err: any, decoded: any) => void) => {
    Jwt.verify(token, Env.JWT_PRIVATE_KEY, (err, decoded) => {
        callback(err, decoded);
    });
}
    
/**
 * Generates a default password
 * @returns {string} a string
*/
const createDefaultPassword = (): string => {
    try {
        return (Env.ENVIRONMENT === ENVIRONMENTS.DEV)? "password" : getCode(8);
        
    } catch (error) {
        throw error;
    }
}

/**
 * Hashes the provided data
 * @param {string} data the data to be hashed
 * @param {number} rounds number of rounds to use to generate the hash salt. Defaults to 12
 * @returns {Promise<string>} A promise that resolves to string
*/
const hashData = (data: string, rounds = 12): Promise<string> => {
    return new Promise(async (resolve, reject) => {
        try {
            const salt = await bcrypt.genSalt(rounds);
            const hash = bcrypt.hash(data, salt);
            resolve(hash);
        } catch (error) {
            reject(error);
        }
    });       
}

/**
 * Compares and validates the equality of a value with a hashed data
 * @param {string} value the value to be compared with a hashed data
 * @param {string} hashedData the hashed data to compare with the provided value
 * @returns {boolean} A promise that resolves to boolean. Returns true if the two values are equal, other wise false
*/
const validateHashedData = (value: string, hashedData: string): Promise<boolean> => {
    return new Promise(async (resolve, reject) => {
        try {
            const valid = await bcrypt.compare(value, hashedData);
            resolve(valid);
        } catch (error) {
            reject(error);
        }
    });       
}

/**
 * Retrieves the bearer token from the authorization header of an express request
 * @param {Request} req an instance of the express request to get the token from
 * @returns {string}  a string
*/
const getTokenFromRequest = (req: Request): string => {
    const payload = req.headers.authorization || "";
    let jwt = "";
    if (payload) {
        if (payload.split(" ").length > 1) {
            jwt = payload.split(" ")[1];
            return jwt;
        }
    }
    return jwt;
}

export {
    getTokenFromRequest,
    validateHashedData,
    hashData,
    createDefaultPassword,
    verifyJwtToken,
    createAuthToken
};