import { Channel } from "@slack/web-api/dist/response/ChannelsCreateResponse";
import express from "express";
import { FlowRouteAPI, FLOWROUT_SMS_TYPE } from "../../flowroute-service.ts/message";
import { DefaultModel } from "../../models/defaultmodel";
import { FlowRouteChannelsModel } from "../../models/flow-channels";
import { Messages } from "../../models/messages";
import { HTTPServer } from "../../server/http";
import { SlackWebAPI } from "../../slack/message-serrvice";
import { Utils } from "../../utils/utils";

const routes = express.Router();



routes.use('/flowroute_inbound', async (req, res) => {

    try {
        console.log('Inbound Message Recieved : ');
        console.log(JSON.stringify(req.body, undefined, 4));
        // DefaultModel.InsertTestDoc(req.body); 

        let payload = req.body.data.attributes;
        let attachments = req.body.included || [];
        payload.state = 'pending';
        let msgID = await Messages.InsertMessage(payload);

        let channelName = 'fr-' + payload.from;
        let channel: Channel | undefined = await FlowRouteChannelsModel.FindChannel(channelName);
        if (!channel) {
            channel = await SlackWebAPI.CreateChannel(channelName);
            await FlowRouteChannelsModel.InsertChannel(channel);
        }
        if (channel && channel.id) {

            let msgResponse = await SlackWebAPI.SendMessage(channelName, channel.id, payload.body, attachments);
            if (msgResponse.ok) await Messages.UpdateMessage(msgID, { state: 'sent' });

        }

        console.log('Body ', JSON.stringify(req.body, undefined, 4));
        res.send('ok');

    } catch (error) {
        console.log(error);
        res.status(500).send({ status: 'error', error: error });

    }


});


routes.use('/flowroute_outbound', async (req, res, next) => {

    if ((req.body as Object).hasOwnProperty('challenge')) {
        res.send(req.body.challenge);
    } else next();


});
routes.use('/flowroute_outbound', async (req, res) => {

    try {
        console.log(JSON.stringify(req.body, undefined, 4));

        if (!req.body.event.subtype) req.body.event.subtype = 'message';
        switch (req.body.event.type) {
            case 'message':
                switch (req.body.event.subtype) {
                    case 'message':
                    case 'file_share':
                    case 'message_replied':
                        if (!req.body.event.bot_profile) {
                            let channel = await FlowRouteChannelsModel.FindChannelByID(req.body.event.channel);
                            if (channel && channel.id) {
                                let to = channel.name.split('-')[1];
                                let temp: FLOWROUT_SMS_TYPE = {
                                    data: {
                                        type: 'message',
                                        attributes: {
                                            body: req.body.event.text,
                                            to: to.toString(),
                                            from: FlowRouteAPI.phone_number,
                                            is_mms: (!req.body.event.files) ? false : true,
                                            media_urls: (!req.body.event.files) ? [] : req.body.event.files.map((file: any) => { return file.url_private_download })
                                        }
                                    }
                                }
                                let result = await FlowRouteAPI.SendSMS(temp);
                                console.log('SMS Sent : ', result);
                            }
                        }
                        break;
                    default:
                        break;
                }
                break;

            case 'channel_created':
                if ((req.body.event.channel.name as string).substring(0, 2) == 'fr-') {
                    let channelName = req.body.event.channel.name;
                    let channel: Channel | undefined = await FlowRouteChannelsModel.FindChannel(channelName);
                    if (!channel) {
                        channel = await SlackWebAPI.CreateChannel(channelName);
                        await FlowRouteChannelsModel.InsertChannel(channel);
                    }
                }
                break;
            case 'channel_deleted':
                await FlowRouteChannelsModel.DeleteChannel(req.body.event.channel.id);
                break;
        }
        res.status(200).send({ status: 'ok' });


    } catch (error) {
        console.log(error);
        res.status(500).send({ status: 'error', error: error });

    }


});


export const router = routes;