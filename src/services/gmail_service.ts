import Env from '../common/config/environment_variables';
import { GmailTokenCredentials, IEmailMessage, IEmailMessageHeader } from '../data/interfaces/interfaces';
import GmailToken, { IGmailToken, ICreateGmailToken, IGmailTokenDocument} from '../models/gmail_api_token';
import DBQuery from './DBQuery';
import {google} from "googleapis";

const gmail = google.gmail('v1');
const oauth2Client = new google.auth.OAuth2(
    Env.GOOGLE_CLIENT_ID,
    Env.GOOGLE_CLIENT_SECRET,
    Env.GMAIL_CALLBACK_URL
);

class GmailTokenRepository extends DBQuery<IGmailToken, ICreateGmailToken, IGmailTokenDocument> {

    constructor() {
        super(GmailToken);
    }
}

const gmailTokenRepository = new GmailTokenRepository();

const getAccessToken = async (code: string): Promise<GmailTokenCredentials> => {
    try {
        const {tokens} = await oauth2Client.getToken(code)
        oauth2Client.setCredentials(tokens);
        
        return tokens as GmailTokenCredentials;
    } catch (error) {
        throw error;
    }
}

const getGmailConsentUrl = async (userId: string, scopes: string[]): Promise<string> => {
    try {
        
        const existingToken = await gmailTokenRepository.findOne({user: userId, is_active: true});
        if (existingToken) scopes.push(...existingToken.scope);
        const url = oauth2Client.generateAuthUrl({
            access_type: "offline",
            scope: scopes,
            prompt: "consent"
        });

        return url;
    } catch (error) {
        throw error;
    }
}

const listenForEmailUpdates = async (refreshToken: string, email?: string) => {
    try {
      oauth2Client.setCredentials({ refresh_token: refreshToken })
      
      const topicNameOrId = Env.GOOGLE_TOPIC_NAME;
      await gmail.users.watch({userId: email || 'me', requestBody: {topicName: topicNameOrId}});
      
    } catch (error) {
      console.log(error)
    }

}

const listMessageThreads = async (refreshToken: string, maxResults = 10, nextPageToken?: string) => {
    try {

      oauth2Client.setCredentials({ refresh_token: refreshToken })

      const response = await gmail.users.threads.list({userId: 'me', maxResults, pageToken: nextPageToken});
      const threadResponses = response.data.threads || [];

      const threads = [];
      for await (const threadResponse of threadResponses) {
        const threadDetails = await gmail.users.threads.get({userId: 'me', id: threadResponse.id!});

        const threadMessages:any[] = [];
        let attachmentCount = 0;
        threadDetails.data?.messages?.forEach(message => {
          
          if (message.labelIds?.includes("INBOX") || message.labelIds?.includes("SENT")) {
            
            const threadHeaders = extractMessagesHeaders(message.payload?.headers || []);
            if(message.payload?.parts && message.payload.parts[1]?.filename) {
              attachmentCount += message.payload.parts.length - 1;
            }
            
            const threadMessage = {
              headers: threadHeaders,
              id: message.id,
              threadId: message.threadId,
              labelIds: message.labelIds,
              snippet: message.snippet
            };
  
            threadMessages.push(threadMessage);
          }
        })

        if (threadMessages.length > 0)
          threads.push({id: threadResponse.id, attachment_count: attachmentCount, messages: threadMessages});
      }

      return {
        success: true,
        data: threads,
        next_page_token: response.data.nextPageToken
      }
      
    } catch (error:any) {
      return {
        success: false,
        error: error.response?.data?.error
      }
    }
}

const getThreadMessages = async (refreshToken: string, threadId: string, search?: string) => {
  try {
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    
    const threadMessages = await gmail.users.threads.get({userId: 'me', id: threadId});

    const messages: IEmailMessage[] = [];
    let messageHeaders = {};
    if (!threadMessages.data.messages)  return { success: true, data: [] };

    for await (const message of threadMessages.data.messages) {
      if (!message.labelIds?.includes("SPAM") && !message.labelIds?.includes("TRASH") && !message.labelIds?.includes("DRAFT")) {

        messageHeaders = extractMessagesHeaders(message.payload?.headers || []);

        let messageBody = "";
        const body = message.payload?.parts ? message.payload.parts[1].body : message.payload?.body;

        if (body?.data) {
          const buffer = Buffer.from(body.data, "base64");
          messageBody = buffer.toString("utf-8");
        } 

        const attachments = [];
        if (body?.attachmentId) {
          //@ts-ignore
          const textPart = message.payload.parts[0]?.parts[1]?.body?.data;
          if (textPart) {
            const buffer = Buffer.from(textPart, "base64");
            messageBody = buffer.toString("utf-8");
          }

          const parts = message?.payload?.parts || [];
          for (let j = 1; j < parts.length; j++) {
            const part = parts[j];
            const attachmentId = part.body?.attachmentId as string;
            const fileName = part.filename;
            const mimeType = part.mimeType;
            const attachmentResponse = await gmail.users.messages.attachments.get({userId: 'me', id: attachmentId, messageId: message.id!});
            const attachment = {
              file_name: fileName!,
              file_type: mimeType!,
              file: attachmentResponse.data.data!
            }
            attachments.push(attachment);
          }
        }
        
        const threadMessage: IEmailMessage = {
          headers: messageHeaders as IEmailMessageHeader,
          id: message.id!,
          threadId: message.threadId!,
          labelIds: message.labelIds!,
          snippet: message.snippet!,
          body: messageBody,
          attachments: attachments
        };

        if (search) {
          const nameRegex = new RegExp(`${search}`, "i");
          if(nameRegex.test(messageBody)) messages.push(threadMessage);
        } else {
          messages.push(threadMessage);
        }
      }
    }

    return {
      success: true,
      data: messages
    }
  } catch (error:any) {
    return {
      success: false,
      error: error.response?.data?.error
    }
  }
}

function extractMessagesHeaders(headers: any[]) {
    const threadHeaders:Record<string,any> = {};
    headers.forEach((header) => {
      if (header.name == "From") threadHeaders["from"] = header.value;
      if (header.name == "To") threadHeaders["to"] = header.value;
      if (header.name == "Subject") threadHeaders["subject"] = header.value;
      if (header.name == "Date") threadHeaders["date"] = header.value;
      if (header.name == "Cc") threadHeaders["cc"] = header.value;
      if (header.name == "Message-ID") threadHeaders["message_id"] = header.value;
    });

    return threadHeaders as IEmailMessageHeader;
}

export default GmailTokenRepository;
export {
    gmailTokenRepository,
    getGmailConsentUrl,
    getAccessToken,
    listenForEmailUpdates,
    listMessageThreads,
    getThreadMessages
}
