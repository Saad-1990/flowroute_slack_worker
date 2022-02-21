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

routes.use('/test_sms_recieve', async (req, res) => {
    console.log('sending slack sms');
    // await SlackWebAPI.SendMessage();
    res.send({ status: 'ok' });
})

routes.use('/test_channel_create', async (req, res) => {
    console.log('Crating Channel');
    await SlackWebAPI.CreateChannel('fr-12018172450');
    res.send({ status: 'ok' });
})

routes.use('/stop', async (req, res) => {
    HTTPServer.StopServer();
    res.send({ msg: 'Stopping' });
});


//Always Use Default Routes at the End to ensure precedence
routes.use('/', async (req, res) => {
    console.log('Test Default Called ');
    await Utils.Sleep(10000);
    res.send('Test Called');
    console.log('Response Sent');
});

export const router = routes;