import BaseApiController from "./base controllers/BaseApiController";
import { GMAIL_OAUTH_CONSENT_REQUIRED, UNABLE_TO_COMPLETE_REQUEST, badRequestError, requiredField, resourceNotFound } from "../common/constant/error_response_message";
import AppValidator from "../middlewares/validators/AppValidator";
import { gmailService, gmailTokenRepository} from "../services/gmail_service";
import { GmailAuthorizationScopes } from "../common/config/app_config";
import { Response } from "express";

class EmailController extends BaseApiController {

    appValidator: AppValidator;

    constructor() {
        super();
    }

    protected initializeServices() {}
    
    protected initializeMiddleware() {
        this.appValidator = new AppValidator(this.router);
    }

    protected initializeRoutes() {
        this.getConsentPromptPageUrl("/consent_prompt_url"); //GET
        this.gmailAuthCallback("/gmail_oauth_callback"); //POST
        this.listMessageThreads("/threads"); //GET
        this.getThreadMessages("/threads/:id"); //GET
        this.listMessages("/"); //GET
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
                const user = this.requestUtils.getRequestUser();
                const token = await gmailService.getAccessToken(req.body.code);
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
        this.router.get(path,this.userMiddleWare.setGmailToken);
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


    listMessages(path:string) {
        this.router.get(path,this.userMiddleWare.setGmailToken);
        this.router.get(path, async (req, res) => {
            try {
                const label:any = req.query.label;
                const labels = ["TRASH", "STARRED", "SENT", "DRAFT"];
                if (!labels.includes(label)) {
                    const message = "Label must be either of " + labels.join();
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

                const response = await gmailService.getLabelStats(gmailToken.token, req.query.label.toString());
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

                const response = await gmailService.batchDelete(gmailToken.token, req.body.ids);
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

    private async handleGmailApiErrors(res:Response, response:Record<string,any>, userId: string) {
        try {
            const error = new Error(response.error.message);
    
            if (response.error.code == 403 || response.error.code == 401) {
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
}

export default new EmailController().router;
