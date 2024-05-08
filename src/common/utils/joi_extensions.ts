import { Root } from "joi";
import { isValidObjectId} from "mongoose";
import { JoiExtensionFactory } from "../../data/interfaces/interfaces";

/**
 * A Joi extension for validating mongo object ids
 * - the extension factory returned by this method, provides custom validation for object ids
 * @returns an extension factory function of type ObjectIdExtension for object mongo object ids
*/
function objectIdExtension() {
  const extension: typeof JoiExtensionFactory = (joi:Root) => ({
      type: "string",
      base: joi.string(),
      messages: {
          'string.objectId': '{{#label}} must be a valid Id',
      },
      rules: {
          objectId: {
            validate: (value:string, helpers:any) => {
              const alphaNumRegex = new RegExp(/^[a-z0-9]+$/);
              if (!isValidObjectId(value) || !alphaNumRegex.test(value)) {
                  return helpers.error('string.objectId');
              }
    
              return value;
            }
          }
        }
  });

  return extension;
}
/**
 * A Joi extension for validating dates
 * - the extension factory returned by this method, provides custom validation for dates in multiple formats
 * @returns an extension factory function for validating dates
*/
function dateExtension () {
  return require('@joi/date');
}

const objectId = objectIdExtension();
const date = dateExtension();

export {
  objectId,
  date
}