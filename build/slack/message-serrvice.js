"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlackWebAPI = void 0;
const web_api_1 = require("@slack/web-api");
class SlackWebAPI {
    constructor() {
        this.channelID = 'C032K0S52QY';
    }
    static INIT(token) {
        this.webClient = new web_api_1.WebClient(token || Buffer.from('eG94cC0zMDU2NjE0MDQ0OTAyLTMwODcwMjU2NDc4ODgtMzE0Njc0MTM4NjA1My03YTA5ZGEyMDgzMTRhOWVlOGNhNGQzMTU5ODg0ZjU2Ng==', 'base64').toString('utf-8'));
        console.log('INIT Succeeded Slack');
    }
    static async CreateChannel(name, is_private = false) {
        try {
            let response = await this.webClient.conversations.create({
                name: name.toLowerCase(),
                is_private: is_private
            });
            console.log('Channel Create Response : ', response);
            if (response.channel)
                return response.channel;
            else
                throw new Error(response.error);
        }
        catch (error) {
            console.log('error : ', error);
            throw error;
        }
    }
    static async UnarchiveChannel(channelID) {
        try {
            let response = await this.webClient.conversations.unarchive({ channel: channelID });
            if (response.ok)
                return response.ok;
            else
                throw new Error(response.error);
        }
        catch (error) {
            console.log('error : ', error);
            throw error;
        }
    }
    static async SendMessage(channelName, channel, text, attachments = []) {
        try {
            let blocks = [];
            blocks.push({
                type: 'section',
                text: {
                    text: text,
                    type: 'plain_text'
                }
            });
            let slackAttachmentBlocks = attachments.map((attachment) => {
                let temp = {
                    type: 'image',
                    image_url: attachment.attributes.url,
                    alt_text: 'FlowRoute Attachment',
                };
                return temp;
            });
            return await this.webClient.chat.postMessage({
                channel: channel,
                text: text,
                blocks: [...blocks, ...slackAttachmentBlocks],
                unfurl_links: true,
                unfurl_media: true,
            });
        }
        catch (error) {
            console.log('error', error.data);
            let blocks = [];
            blocks.push({
                type: 'section',
                text: {
                    text: text,
                    type: 'plain_text'
                }
            });
            let slackAttachmentBlocks = attachments.map((attachment) => {
                let temp = {
                    type: 'image',
                    image_url: attachment.attributes.url,
                    alt_text: 'FlowRoute Attachment',
                };
                return temp;
            });
            switch (error.data.error) {
                case 'channel_not_found':
                    let temp = await SlackWebAPI.CreateChannel(channelName);
                    if (temp && temp.id) {
                        return await this.webClient.chat.postMessage({
                            channel: channel,
                            blocks: [...blocks, ...slackAttachmentBlocks],
                            unfurl_links: true,
                            unfurl_media: true,
                        });
                    }
                case 'is_archived':
                    await this.UnarchiveChannel(channel);
                    return await this.webClient.chat.postMessage({
                        channel: channel,
                        blocks: [...blocks, ...slackAttachmentBlocks],
                        unfurl_links: true,
                        unfurl_media: true,
                    });
                default:
                    throw error;
            }
        }
    }
}
exports.SlackWebAPI = SlackWebAPI;
//# sourceMappingURL=message-serrvice.js.map