import { Block, ChatPostMessageResponse, ImageBlock, MessageAttachment, SectionBlock, WebClient } from '@slack/web-api'
import { Channel } from '@slack/web-api/dist/response/ChannelsCreateResponse';
import { Attachment } from '@slack/web-api/dist/response/ChatPostMessageResponse';
import { FlowRouteChannelsModel } from '../models/flow-channels';


export abstract class SlackWebAPI {

    channelID: string = 'C032K0S52QY';
    static webClient: WebClient;
    public static INIT(token?: string) {
        this.webClient = new WebClient(token || Buffer.from('eG94cC0zMDU2NjE0MDQ0OTAyLTMwODcwMjU2NDc4ODgtMzE0Njc0MTM4NjA1My03YTA5ZGEyMDgzMTRhOWVlOGNhNGQzMTU5ODg0ZjU2Ng==', 'base64').toString('utf-8'));

        console.log('INIT Succeeded Slack');

    }

    public static async CreateChannel(name: string, is_private = false): Promise<Channel | undefined> {
        try {

            let response = await this.webClient.conversations.create({
                name: name.toLowerCase(),
                is_private: is_private
            });
            console.log('Channel Create Response : ', response);
            if (response.channel) return response.channel
            else throw new Error(response.error);


        } catch (error) {
            console.log('error : ', error);
            throw error;
        }
    }

    public static async UnarchiveChannel(channelID: string): Promise<boolean | undefined> {
        try {

            let response = await this.webClient.conversations.unarchive({ channel: channelID })
            if (response.ok) return response.ok;
            else throw new Error(response.error);


        } catch (error) {
            console.log('error : ', error);
            throw error;
        }
    }




    public static async SendMessage(channelName: string, channel: string, text: string, attachments = []): Promise<ChatPostMessageResponse> {
        try {
            let blocks: Block[] = [];

            blocks.push({
                type: 'section',
                text: {
                    text: text,
                    type: 'plain_text'
                }

            } as SectionBlock)
            let slackAttachmentBlocks = attachments.map((attachment: any) => {
                let temp: ImageBlock = {
                    type: 'image',
                    image_url: attachment.attributes.url,
                    alt_text: 'FlowRoute Attachment',
                }

                return temp
            })


            return await this.webClient.chat.postMessage({
                channel: channel,
                blocks: [...blocks, ...slackAttachmentBlocks],
                unfurl_links: true,
                unfurl_media: true,
            });

        } catch (error: any) {
            console.log('error', error.data);
            let blocks: Block[] = [];

            blocks.push({
                type: 'section',
                text: {
                    text: text,
                    type: 'plain_text'
                }

            } as SectionBlock)
            let slackAttachmentBlocks = attachments.map((attachment: any) => {
                let temp: ImageBlock = {
                    type: 'image',
                    image_url: attachment.attributes.url,
                    alt_text: 'FlowRoute Attachment',
                }

                return temp
            })
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