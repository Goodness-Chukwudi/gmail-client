import BaseApiController from "./base controllers/BaseApiController";
import { GMAIL_OAUTH_CONSENT_REQUIRED, UNABLE_TO_COMPLETE_REQUEST, badRequestError, requiredField, resourceNotFound } from "../common/constant/error_response_message";
import AppValidator from "../middlewares/validators/AppValidator";
import { gmailService, gmailTokenRepository} from "../services/gmail_service";
import { GmailAuthorizationScopes } from "../common/config/app_config";
import { Response, Request } from "express";
import multer from "multer";
import fs from  "fs";
import { SendEmailParams } from "../data/interfaces/interfaces";
import EmailValidator from "../middlewares/validators/EmailValidator";

const upload = multer({
    dest: 'uploads/',
    limits: {
        fileSize: 20 * 1024 * 1024
    }
})

class EmailController extends BaseApiController {

    appValidator: AppValidator;
    emailValidator: EmailValidator;

    constructor() {
        super();
    }

    protected initializeServices() {}
    
    protected initializeMiddleware() {
        this.appValidator = new AppValidator(this.router);
        this.emailValidator = new EmailValidator(this.router);
    }

    protected initializeRoutes() {
        this.getConsentPromptPageUrl("/consent_prompt_url"); //GET
        this.gmailAuthCallback("/gmail_oauth_callback"); //POST
        this.listMessageThreads("/threads"); //GET
        this.getThreadMessages("/threads/:id"); //GET
        this.listMessagesByLabels("/"); //GET
        this.listDraftMessages("/drafts"); //GET
        this.getMessageLabelStats("/stats"); //GET
        this.getMessageDetails("/:id/details"); //GET
        this.getDraft("/drafts/:id"); //GET
        this.starMessage("/:id/star"); //PATCH
        this.removeMessageStar("/:id/unstar"); //PATCH
        this.archiveMessage("/:id/archive"); //PATCH
        this.deleteMessage("/:id/trash"); //DELETE
        this.batchDelete("/trash"); //DELETE
        this.restoreMessage("/:id/untrash"); //PATCH
        this.sendMessage("/"); //POST
        this.createDraft("/drafts"); //POST
        this.updateDraft("/drafts/:id"); //PATCH
        this.deleteDraft("/drafts/:id"); //DELETE
        this.sendDraft("/drafts/:id/send"); //POST
        this.replyMessage("/:id/thread/:threadId/reply"); //POST
        this.disconnectApp("/revoke-access"); //DELETE
    }


    getConsentPromptPageUrl(path:string) {
        this.router.get(path, async (req, res) => {
            try {
                const user = this.requestUtils.getRequestUser();
                const url = await gmailService.getGmailConsentUrl(user.id, GmailAuthorizationScopes);

                return this.sendSuccessResponse(res, url);
            } catch (error:any) {
                this.sendErrorResponse(res, error, UNABLE_TO_COMPLETE_REQUEST, 500);
            }
        })
    }

    gmailAuthCallback(path:string) {
        this.router.post(path, async (req, res) => {
            try {
                const code = req.body.code;
                if (!code) {
                    const error = new Error("Code from Google's oauth callback is required");
                    return this.sendErrorResponse(res, error, requiredField("Code"), 500);
                }

                const user = this.requestUtils.getRequestUser();
                const token = await gmailService.getAccessToken(code);
                const tokenData = {
                    user: user.id,
                    email: user.email,
                    token: token.refresh_token,
                    scope: token.scope.split(" ")
                }

                await gmailTokenRepository.updateMany({user: user.id, is_active: true}, {is_active: false});
                const gmailToken = await gmailTokenRepository.save(tokenData);
                await gmailService.listenForEmailUpdates(gmailToken.token, gmailToken.email); //A cron will call this method for each gmail enabled user, once a day

                return this.sendSuccessResponse(res);
            } catch (error:any) {
                return this.sendErrorResponse(res, error, UNABLE_TO_COMPLETE_REQUEST, 500);
            }
        })
    }


    listMessageThreads(path:string) {
        this.router.get(path, this.userMiddleWare.setGmailToken);
        this.router.get(path, async (req, res) => {
            try {
                const gmailToken = this.requestUtils.getGmailToken();
                const user = this.requestUtils.getRequestUser();

                let pageSize;
                let nextPageToken;
                if (req.query.page_size) pageSize = Number(req.query.page_size);
                if (req.query.next_page_token) nextPageToken = req.query.next_page_token as string;

                const response = await gmailService.listMessageThreads(gmailToken.token, pageSize, nextPageToken);
                if (!response.success) return await this.handleGmailApiErrors(res, response, user.id);

                return this.sendSuccessResponse(res, response.data);
            } catch (error:any) {
                return this.sendErrorResponse(res, error, UNABLE_TO_COMPLETE_REQUEST, 500);
            }
        })
    }


    getThreadMessages(path:string) {
        this.router.get(path,this.userMiddleWare.setGmailToken);
        this.router.get(path, async (req, res) => {
            try {
                const gmailToken = this.requestUtils.getGmailToken();
                const user = this.requestUtils.getRequestUser();

                const search = req.query.search ? req.query.search as string : undefined;
                const response = await gmailService.getThreadMessages(gmailToken.token, req.params.id, search);
                if (!response.success) return await this.handleGmailApiErrors(res, response, user.id);

                return this.sendSuccessResponse(res, response.data);
            } catch (error:any) {
                return this.sendErrorResponse(res, error, UNABLE_TO_COMPLETE_REQUEST, 500);
            }
        })
    }


    listMessagesByLabels(path:string) {
        this.router.get(path,this.userMiddleWare.setGmailToken);
        this.router.get(path, async (req, res) => {
            try {
                const label:any = req.query.label;
                const labels = ["TRASH", "STARRED", "SENT", "DRAFT", "UNREAD", "IMPORTANT", "INBOX"];
                if (!labels.includes(label)) {
                    const message = "Label must be either of " + labels.join(", ");
                    const error = new Error(message);
                    return this.sendErrorResponse(res, error, badRequestError(message), 400);
                }

                const gmailToken = this.requestUtils.getGmailToken();
                const user = this.requestUtils.getRequestUser();

                let pageSize;
                let nextPageToken;
                if (req.query.page_size) pageSize = Number(req.query.page_size);
                if (req.query.next_page_token) nextPageToken = req.query.next_page_token as string;

                const response = await gmailService.listMessages(gmailToken.token, label, pageSize, nextPageToken);
                if (!response.success) return await this.handleGmailApiErrors(res, response, user.id);

                return this.sendSuccessResponse(res, response.data);
            } catch (error:any) {
                return this.sendErrorResponse(res, error, UNABLE_TO_COMPLETE_REQUEST, 500);
            }
        })
    }

    listDraftMessages(path:string) {
        this.router.get(path,this.userMiddleWare.setGmailToken);
        this.router.get(path, async (req, res) => {
            try {
                const gmailToken = this.requestUtils.getGmailToken();
                const user = this.requestUtils.getRequestUser();

                let pageSize;
                let nextPageToken;
                if (req.query.page_size) pageSize = Number(req.query.page_size);
                if (req.query.next_page_token) nextPageToken = req.query.next_page_token as string;

                const response = await gmailService.listDrafts(gmailToken.token, pageSize, nextPageToken);
                if (!response.success) return await this.handleGmailApiErrors(res, response, user.id);

                return this.sendSuccessResponse(res, response.data);
            } catch (error:any) {
                return this.sendErrorResponse(res, error, UNABLE_TO_COMPLETE_REQUEST, 500);
            }
        })
    }

    getMessageLabelStats(path:string) {
        this.router.get(path,this.userMiddleWare.setGmailToken);
        this.router.get(path, async (req, res) => {
            try {
                if(!req.query.label) {
                    const error = new Error("Label Id is required");
                    return this.sendErrorResponse(res, error, requiredField("label"), 400);
                }
                const gmailToken = this.requestUtils.getGmailToken();
                const user = this.requestUtils.getRequestUser();

                const response = await gmailService.getLabelStats(gmailToken.token, req.query.label.toString().split(","));
                if (!response.success) return await this.handleGmailApiErrors(res, response, user.id);

                return this.sendSuccessResponse(res, response.data);
            } catch (error:any) {
                return this.sendErrorResponse(res, error, UNABLE_TO_COMPLETE_REQUEST, 500);
            }
        })
    }

    getMessageDetails(path:string) {
        this.router.get(path,this.userMiddleWare.setGmailToken);
        this.router.get(path, async (req, res) => {
            try {
                const gmailToken = this.requestUtils.getGmailToken();
                const user = this.requestUtils.getRequestUser();

                const response = await gmailService.getMessage(gmailToken.token, req.params.id);
                if (!response.success) return await this.handleGmailApiErrors(res, response, user.id);

                return this.sendSuccessResponse(res, response.data);
            } catch (error:any) {
                return this.sendErrorResponse(res, error, UNABLE_TO_COMPLETE_REQUEST, 500);
            }
        })
    }

    getDraft(path:string) {
        this.router.get(path,this.userMiddleWare.setGmailToken);
        this.router.get(path, async (req, res) => {
            try {
                const gmailToken = this.requestUtils.getGmailToken();
                const user = this.requestUtils.getRequestUser();

                const response = await gmailService.getDraftDetails(gmailToken.token, req.params.id);
                if (!response.success) return await this.handleGmailApiErrors(res, response, user.id);

                return this.sendSuccessResponse(res, response.data);
            } catch (error:any) {
                return this.sendErrorResponse(res, error, UNABLE_TO_COMPLETE_REQUEST, 500);
            }
        })
    }

    starMessage(path:string) {
        this.router.patch(path, this.userMiddleWare.setGmailToken);
        this.router.patch(path, async (req, res) => {
            try {
                const gmailToken = this.requestUtils.getGmailToken();
                const user = this.requestUtils.getRequestUser();

                const response = await gmailService.addMessageLabels(gmailToken.token, req.params.id, "STARRED");
                if (!response.success) return await this.handleGmailApiErrors(res, response, user.id);

                return this.sendSuccessResponse(res);
            } catch (error:any) {
                return this.sendErrorResponse(res, error, UNABLE_TO_COMPLETE_REQUEST, 500);
            }
        })
    }

    removeMessageStar(path:string) {
        this.router.patch(path, this.userMiddleWare.setGmailToken);
        this.router.patch(path, async (req, res) => {
            try {
                const gmailToken = this.requestUtils.getGmailToken();
                const user = this.requestUtils.getRequestUser();

                const response = await gmailService.removeMessageLabels(gmailToken.token, req.params.id, "STARRED");
                if (!response.success) return await this.handleGmailApiErrors(res, response, user.id);

                return this.sendSuccessResponse(res);
            } catch (error:any) {
                return this.sendErrorResponse(res, error, UNABLE_TO_COMPLETE_REQUEST, 500);
            }
        })
    }

    archiveMessage(path:any) {
        this.router.patch(path, this.userMiddleWare.setGmailToken);
        this.router.patch(path, async (req, res) => {
            try {
                const gmailToken = this.requestUtils.getGmailToken();
                const user = this.requestUtils.getRequestUser();

                const response = await gmailService.removeMessageLabels(gmailToken.token, req.params.id, "INBOX");
                if (!response.success) return await this.handleGmailApiErrors(res, response, user.id);

                return this.sendSuccessResponse(res);
            } catch (error:any) {
                return this.sendErrorResponse(res, error, UNABLE_TO_COMPLETE_REQUEST, 500);
            }
        })
    }

    deleteMessage(path:string) {
        this.router.delete(path, this.userMiddleWare.setGmailToken);
        this.router.delete(path, async (req, res) => {
            try {
                const gmailToken = this.requestUtils.getGmailToken();
                const user = this.requestUtils.getRequestUser();

                const response = await gmailService.trashMessage(gmailToken.token, req.params.id);
                if (!response.success) return await this.handleGmailApiErrors(res, response, user.id);

                return this.sendSuccessResponse(res);
            } catch (error:any) {
                return this.sendErrorResponse(res, error, UNABLE_TO_COMPLETE_REQUEST, 500);
            }
        })
    }

    batchDelete(path:string) {
        this.router.delete(path, this.userMiddleWare.setGmailToken);
        this.router.delete(path, async (req, res) => {
            try {
                const gmailToken = this.requestUtils.getGmailToken();
                const user = this.requestUtils.getRequestUser();

                const response = await gmailService.batchDelete(gmailToken.token, req.body.message_ids);
                if (!response.success) return await this.handleGmailApiErrors(res, response, user.id);

                return this.sendSuccessResponse(res);
            } catch (error:any) {
                return this.sendErrorResponse(res, error, UNABLE_TO_COMPLETE_REQUEST, 500);
            }
        })
    }

    restoreMessage(path:string) {
        this.router.patch(path, this.userMiddleWare.setGmailToken);
        this.router.patch(path, async (req, res) => {
            try {
                const gmailToken = this.requestUtils.getGmailToken();
                const user = this.requestUtils.getRequestUser();

                const response = await gmailService.unTrashMessage(gmailToken.token, req.params.id);
                if (!response.success) return await this.handleGmailApiErrors(res, response, user.id);

                return this.sendSuccessResponse(res);
            } catch (error:any) {
                return this.sendErrorResponse(res, error, UNABLE_TO_COMPLETE_REQUEST, 500);
            }
        })
    }

    sendMessage(path:string) {
        this.router.post(path,
            upload.array('attachments'),
            this.emailValidator.validateEmail,
            this.userMiddleWare.setGmailToken
        );
        this.router.post(path, async (req, res) => {
            try {
                const gmailToken = this.requestUtils.getGmailToken();
                const user = this.requestUtils.getRequestUser();
            
                const body = req.body
                const attachments = this.extractAttachments(req);
                const message = {
                    recipient: body.recipient,
                    cc: body.cc,
                    bcc: body.bcc,
                    body: body.email_body,
                    subject: body.subject,
                    attachments: attachments
                }

                const response = await gmailService.sendMessage(gmailToken.token, message);
                if (!response.success) return await this.handleGmailApiErrors(res, response, user.id);

                return this.sendSuccessResponse(res);
            } catch (error:any) {
                return this.sendErrorResponse(res, error, UNABLE_TO_COMPLETE_REQUEST, 500);
            }
        })
    }

    createDraft(path:string) {
        this.router.post(path,
            upload.array('attachments'),
            this.emailValidator.validateDraft,
            this.userMiddleWare.setGmailToken
        );
        this.router.post(path, async (req, res) => {
            try {
                const gmailToken = this.requestUtils.getGmailToken();
                const user = this.requestUtils.getRequestUser();

                const body = req.body
                const attachments = this.extractAttachments(req);
                const message = {
                    recipient: body.recipient,
                    cc: body.cc,
                    bcc: body.bcc,
                    body: body.email_body,
                    subject: body.subject,
                    attachments: attachments
                }

                const response = await gmailService.createDraft(gmailToken.token, message);
                if (!response.success) return await this.handleGmailApiErrors(res, response, user.id);

                return this.sendSuccessResponse(res);
            } catch (error:any) {
                return this.sendErrorResponse(res, error, UNABLE_TO_COMPLETE_REQUEST, 500);
            }
        })
    }

    updateDraft(path:string) {
        this.router.patch(path,
            upload.array('attachments'),
            this.emailValidator.validateDraft,
            this.userMiddleWare.setGmailToken
        );
        this.router.patch(path, async (req, res) => {
            try {
                const gmailToken = this.requestUtils.getGmailToken();
                const user = this.requestUtils.getRequestUser();

                const body = req.body
                const attachments = this.extractAttachments(req);
                const message = {
                    recipient: body.recipient,
                    cc: body.cc,
                    bcc: body.bcc,
                    body: body.email_body,
                    subject: body.subject,
                    attachments: attachments
                }

                const response = await gmailService.updateDraft(gmailToken.token, req.params.id, message);
                if (!response.success) return await this.handleGmailApiErrors(res, response, user.id);

                return this.sendSuccessResponse(res);
            } catch (error:any) {
                return this.sendErrorResponse(res, error, UNABLE_TO_COMPLETE_REQUEST, 500);
            }
        })
    }

    deleteDraft(path:string) {
        this.router.delete(path, this.userMiddleWare.setGmailToken);
        this.router.delete(path, async (req, res) => {
            try {
                const gmailToken = this.requestUtils.getGmailToken();
                const user = this.requestUtils.getRequestUser();

                const response = await gmailService.deleteDraft(gmailToken.token, req.params.id);
                if (!response.success) return await this.handleGmailApiErrors(res, response, user.id);

                return this.sendSuccessResponse(res);
            } catch (error:any) {
                return this.sendErrorResponse(res, error, UNABLE_TO_COMPLETE_REQUEST, 500);
            }
        })
    }

    sendDraft(path:string) {
        this.router.post(path,
            upload.array('attachments'),
            this.emailValidator.validateDraft,
            this.userMiddleWare.setGmailToken
        );
        this.router.post(path, async (req, res) => {
            try {
                const gmailToken = this.requestUtils.getGmailToken();
                const user = this.requestUtils.getRequestUser();

                const body = req.body
                const attachments = this.extractAttachments(req);
                const message = {
                    recipient: body.recipient,
                    cc: body.cc,
                    bcc: body.bcc,
                    body: body.email_body,
                    subject: body.subject,
                    attachments: attachments
                }

                if (Object.keys(message).length > 0) {
                    const updateResponse = await gmailService.updateDraft(gmailToken.token, req.params.id, message);
                    if (!updateResponse.success) return await this.handleGmailApiErrors(res, updateResponse, user.id);
                }

                const response = await gmailService.sendDraft(gmailToken.token, req.params.id);
                if (!response.success) return await this.handleGmailApiErrors(res, response, user.id);

                return this.sendSuccessResponse(res);
            } catch (error:any) {
                return this.sendErrorResponse(res, error, UNABLE_TO_COMPLETE_REQUEST, 500);
            }
        })
    }

    replyMessage(path:string) {
        this.router.post(path,
            upload.array('attachments'),
            this.emailValidator.validateEmail,
            this.userMiddleWare.setGmailToken
        );
        this.router.post(path, async (req, res) => {
            try {
                const gmailToken = this.requestUtils.getGmailToken();
                const user = this.requestUtils.getRequestUser();

                const body = req.body
                const attachments = this.extractAttachments(req);
                const message: SendEmailParams = {
                    recipient: body.recipient,
                    cc: body.cc,
                    bcc: body.bcc,
                    body: body.email_body,
                    subject: body.subject,
                    attachments: attachments,
                    threadId: req.params.threadId
                }
                
                const messageId = req.params.id;
                const threadId = req.params.threadId;

                const messageParams = await gmailService.getReplyMessageParams(gmailToken.token, messageId, threadId);
                if (!messageParams.success) return await this.handleGmailApiErrors(res, messageParams, user.id);

                message.references = messageParams.data!.references;
                message.in_reply_to = messageParams.data!.message_id;
                message.subject = messageParams.data!.subject;

                const response = await gmailService.sendMessage(gmailToken.token, message);
                if (!response.success) return await this.handleGmailApiErrors(res, response, user.id);

                return this.sendSuccessResponse(res);
            } catch (error:any) {
                return this.sendErrorResponse(res, error, UNABLE_TO_COMPLETE_REQUEST, 500);
            }
        })
    }

    disconnectApp(path:string) {
        this.router.delete(path, this.userMiddleWare.setGmailToken);
        this.router.delete(path, async (req, res) => {
            try {
                const user = this.requestUtils.getRequestUser();
                const gmailToken = await gmailTokenRepository.findOne({user: user._id, is_active: true});
                if (gmailToken.token) await gmailService.revokeAppAccess(gmailToken.token);
                await gmailTokenRepository.deleteMany({user: user._id});
                
                return this.sendSuccessResponse(res);
            } catch (error:any) {
                return this.sendErrorResponse(res, error, UNABLE_TO_COMPLETE_REQUEST, 500);
            }
        })
    }

    private async handleGmailApiErrors(res:Response, response:Record<string,any>, userId: string) {
        try {
            const error = new Error(response.error.message);
            if (response.error.code == 403 || response.error.code == 401 || response.error == "invalid_grant") {
                const consentPageUrl = await gmailService.getGmailConsentUrl(userId, GmailAuthorizationScopes);
                return this.sendErrorResponse(res, error, GMAIL_OAUTH_CONSENT_REQUIRED, 400, undefined, {consentPageUrl});
            }
    
            if (response.error.code == 404) {
                return this.sendErrorResponse(res, error, resourceNotFound("messages"), 404);
            }
    
            if (response.error.code == 400) {
                return this.sendErrorResponse(res, error, badRequestError("Invalid request"), 400);
            }
    
            throw new Error("Gmail API error");
        } catch (error) {
            throw error;
        }
    }

    private extractAttachments(req:Request) {
        try {
            const attachments = [];
            if (req.files) {
                const files = req.files as Express.Multer.File[]
                for (const file of files) {
                    const fileContent = Buffer.from(fs.readFileSync(file.path)).toString("base64");
                    
                    const attachment = {
                        filename: file.originalname,
                        content: fileContent,
                        encoding: 'base64'
                    }
                    attachments.push(attachment);
                }
                return attachments;
            }
            return undefined;
        } catch (error) {
            throw error;
        }
    }
}

export default new EmailController().router;
