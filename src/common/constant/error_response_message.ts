/**
 * Provides response messages and methods that generates customized error messages for http error responses.
 * - The messages returned are of type IResponseMessage
 * - IResponseMessage has a response_code field of type number
 * - In addition to the regular http error codes being returned, the response_code field provides a more specific way to track errors on the client side.
*/

const requiredField = (field: string) => {
    return {
        response_code: 2,
        message: field + " is required",
    };
}

const resourceNotFound = (resource: string) => {
    return {
        response_code: 3,
        message: resource + " not found",
    };
}

const ERROR = Object.freeze({
    response_code: 4,
    message: "An error occurred",
});

const DUPLICATE_EMAIL = Object.freeze({
    response_code: 5,
    message: "This email already exist, please try a different email",
});

const DUPLICATE_PHONE = Object.freeze({
    response_code: 6,
    message: "This phone number already exist, please try a different phone number",
});

const UNABLE_TO_SAVE = Object.freeze({
    response_code: 7,
    message: "Unable to save",
});

const UNABLE_TO_COMPLETE_REQUEST = Object.freeze({
    response_code: 8,
    message: "Unable to complete request",
});

const invalidRequest = (reason: string) => {
    return {
        response_code: 9,
        message: "Invalid request. " + reason,
    };
}

const INVALID_LOGIN = Object.freeze({
    response_code: 10,
    message: "Invalid email or password",
});

const INVALID_TOKEN = Object.freeze({
    response_code: 11,
    message: "Unable to authenticate request. Please login to continue",
});

const actionNotPermitted = (action: string) => {
    return {
        response_code: 12,
        message: action + " is not permitted",
    };
}
    
const duplicateValue = (value: string) => {
    return {
        response_code: 13,
        message: `a duplicate value for ${value} already exists`,
    };
}

const SESSION_EXPIRED = Object.freeze({
    response_code: 14,
    message: "Session expired. Please login again",
});

const UNABLE_TO_LOGIN = Object.freeze({
    response_code: 15,
    message: "Unable to login",
});

const INVALID_SESSION_USER = Object.freeze({
    response_code: 16,
    message: "Unauthenticated user session. Please login again",
});

const PASSWORD_MISMATCH = Object.freeze({
    response_code: 17,
    message: "Passwords do not match",
});

const PASSWORD_UPDATE_REQUIRED = Object.freeze({
    response_code: 18,
    message: "Password update is required for this account",
});

const INVALID_PERMISSION = Object.freeze({
    response_code: 19,
    message: "Sorry you do not have permission to perform this action",
});

const invalidValue = (field: string) => {
    return {
        response_code: 20,
        message: `Invalid value provided for ${field}`,
    };
}

const INVALID_EMAIL = Object.freeze({
    response_code: 21,
    message: "Invalid email address",
});

const FILE_NOT_FOUND = Object.freeze({
    response_code: 22,
    message: "File not found. Please attach a file to your request",
});

const invalidFileType = (fileTypes: string[]) => {
    return {
        response_code: 23,
        message: "You tried to upload an invalid file type, upload a " +fileTypes.join()+ " file instead",
    }
}

const FILE_SIZE_LIMIT = Object.freeze({
    response_code: 24,
    message: "The size of this file is larger than the accepted limit",
});

const FILE_UPLOAD_ERROR = Object.freeze({
    response_code: 25,
    message: "Error uploading file. Please try again",
});

const badRequestError = (message: string) => {
    return {
        response_code: 26,
        message: message
    }
}

const MAX_FILE_COUNT_LIMIT = Object.freeze({
    response_code: 27,
    message: "You have exceeded the max number of files",
});

const GMAIL_OAUTH_CONSENT_REQUIRED = Object.freeze({
    response_code: 28,
    message: "Please grant us the required access to continue",
});

export {
    requiredField,
    MAX_FILE_COUNT_LIMIT,
    resourceNotFound,
    ERROR,
    DUPLICATE_EMAIL,
    DUPLICATE_PHONE,
    UNABLE_TO_SAVE,
    UNABLE_TO_COMPLETE_REQUEST,
    invalidRequest,
    INVALID_LOGIN,
    INVALID_TOKEN,
    actionNotPermitted,
    duplicateValue,
    SESSION_EXPIRED,
    badRequestError,
    FILE_UPLOAD_ERROR,
    FILE_SIZE_LIMIT,
    invalidFileType,
    FILE_NOT_FOUND,
    INVALID_EMAIL,
    invalidValue,
    INVALID_PERMISSION,
    PASSWORD_UPDATE_REQUIRED,
    PASSWORD_MISMATCH,
    INVALID_SESSION_USER,
    UNABLE_TO_LOGIN,
    GMAIL_OAUTH_CONSENT_REQUIRED
};