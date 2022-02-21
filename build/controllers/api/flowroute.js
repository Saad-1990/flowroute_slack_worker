"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = __importDefault(require("express"));
const message_1 = require("../../flowroute-service.ts/message");
const flow_channels_1 = require("../../models/flow-channels");
const messages_1 = require("../../models/messages");
const message_serrvice_1 = require("../../slack/message-serrvice");
const routes = express_1.default.Router();
routes.use('/flowroute_inbound', async (req, res) => {
    try {
        console.log('Inbound Message Recieved : ');
        console.log(JSON.stringify(req.body, undefined, 4));
        // DefaultModel.InsertTestDoc(req.body); 
        let payload = req.body.data.attributes;
        let attachments = req.body.included || [];
        payload.state = 'pending';
        let msgID = await messages_1.Messages.InsertMessage(payload);
        let channelName = 'fr-' + payload.from;
        let channel = await flow_channels_1.FlowRouteChannelsModel.FindChannel(channelName);
        if (!channel) {
            channel = await message_serrvice_1.SlackWebAPI.CreateChannel(channelName);
            await flow_channels_1.FlowRouteChannelsModel.InsertChannel(channel);
        }
        if (channel && channel.id) {
            let msgResponse = await message_serrvice_1.SlackWebAPI.SendMessage(channelName, channel.id, payload.body, attachments);
            if (msgResponse.ok)
                await messages_1.Messages.UpdateMessage(msgID, { state: 'sent' });
        }
        console.log('Body ', JSON.stringify(req.body, undefined, 4));
        res.send('ok');
    }
    catch (error) {
        console.log(error);
        res.status(500).send({ status: 'error', error: error });
    }
});
routes.use('/flowroute_outbound', async (req, res, next) => {
    if (req.body.hasOwnProperty('challenge')) {
        res.send(req.body.challenge);
    }
    else
        next();
});
routes.use('/flowroute_outbound', async (req, res) => {
    try {
        console.log(JSON.stringify(req.body, undefined, 4));
        if (!req.body.event.subtype)
            req.body.event.subtype = 'message';
        switch (req.body.event.type) {
            case 'message':
                switch (req.body.event.subtype) {
                    case 'message':
                    case 'file_share':
                    case 'message_replied':
                        if (!req.body.event.bot_profile) {
                            let channel = await flow_channels_1.FlowRouteChannelsModel.FindChannelByID(req.body.event.channel);
                            if (channel && channel.id) {
                                let to = channel.name.split('-')[1];
                                let temp = {
                                    data: {
                                        type: 'message',
                                        attributes: {
                                            body: req.body.event.text,
                                            to: to.toString(),
                                            from: message_1.FlowRouteAPI.phone_number,
                                            is_mms: (!req.body.event.files) ? false : true,
                                            media_urls: (!req.body.event.files) ? [] : req.body.event.files.map((file) => { return file.url_private_download; })
                                        }
                                    }
                                };
                                let result = await message_1.FlowRouteAPI.SendSMS(temp);
                                console.log('SMS Sent : ', result);
                            }
                        }
                        break;
                    default:
                        break;
                }
                break;
            case 'channel_created':
                if (req.body.event.channel.name.substring(0, 2) == 'fr-') {
                    let channelName = req.body.event.channel.name;
                    let channel = await flow_channels_1.FlowRouteChannelsModel.FindChannel(channelName);
                    if (!channel) {
                        channel = await message_serrvice_1.SlackWebAPI.CreateChannel(channelName);
                        await flow_channels_1.FlowRouteChannelsModel.InsertChannel(channel);
                    }
                }
                break;
            case 'channel_deleted':
                await flow_channels_1.FlowRouteChannelsModel.DeleteChannel(req.body.event.channel.id);
                break;
        }
        res.status(200).send({ status: 'ok' });
    }
    catch (error) {
        console.log(error);
        res.status(500).send({ status: 'error', error: error });
    }
});
exports.router = routes;
//# sourceMappingURL=flowroute.js.map