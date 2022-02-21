"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = require("../../server/http");
const message_serrvice_1 = require("../../slack/message-serrvice");
const utils_1 = require("../../utils/utils");
const routes = express_1.default.Router();
routes.use('/test_sms_recieve', async (req, res) => {
    console.log('sending slack sms');
    // await SlackWebAPI.SendMessage();
    res.send({ status: 'ok' });
});
routes.use('/test_channel_create', async (req, res) => {
    console.log('Crating Channel');
    await message_serrvice_1.SlackWebAPI.CreateChannel('fr-12018172450');
    res.send({ status: 'ok' });
});
routes.use('/stop', async (req, res) => {
    http_1.HTTPServer.StopServer();
    res.send({ msg: 'Stopping' });
});
//Always Use Default Routes at the End to ensure precedence
routes.use('/', async (req, res) => {
    console.log('Test Default Called ');
    await utils_1.Utils.Sleep(10000);
    res.send('Test Called');
    console.log('Response Sent');
});
exports.router = routes;
//# sourceMappingURL=test.js.map