"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlowRouteAPI = void 0;
const stream_1 = __importDefault(require("stream"));
const axios_1 = __importDefault(require("axios"));
class FlowRouteAPI {
    static INIT(username, password, phone_number) {
        this.username = username;
        this.password = password;
        this.phone_number = phone_number;
    }
    static async SendSMS(body) {
        try {
            // prepare query string for API call
            const url = this.endpoint + '/v2.1/messages';
            let result = await axios_1.default.post(url, JSON.stringify(body), {
                auth: {
                    username: this.username,
                    password: this.password
                },
                headers: {
                    'content-type': 'application/json; charset=utf-8',
                    'user-agent': 'Flowroute SDK v3.0',
                    'accept': 'application/vnd.api+json'
                }
            });
            return result.data;
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    }
    static jsonSerialize(data) {
        return JSON.stringify(data);
    }
    /**
     * Validates and processes the given Url
     * @param  {String}  url  The Url to process
     * @return {String}       Processed url
     */
    static CleanURL(url) {
        // ensure that the urls are absolute
        const re = /^https?:\/\/[^/]+/;
        const match = url.match(re);
        if (match === null) {
            return null;
        }
        // remove redundant forward slashes
        const protocol = match[0];
        let queryUrl = url.substring(protocol.length);
        queryUrl = queryUrl.replace(/\/\/+/, '/');
        const result = protocol + queryUrl;
        return result;
    }
    static CleanObject(input) {
        if (!input) {
            return input;
        }
        const cleanedObj = input;
        if (cleanedObj instanceof stream_1.default.Stream) {
            return cleanedObj;
        }
        const keys = Object.keys(cleanedObj);
        for (let iter = 0; iter < keys.length; iter += 1) {
            const value = cleanedObj[keys[iter]];
            if (value === null || value === undefined) {
                if (cleanedObj.constructor === Array) {
                    cleanedObj.splice(keys[iter], 1);
                }
                else
                    delete cleanedObj[keys[iter]];
            }
            else if (Object.prototype.toString.call(value) === '[object Object]') {
                this.CleanObject(value);
            }
            else if (value.constructor === Array) {
                this.CleanObject(value);
            }
        }
        return cleanedObj;
    }
}
exports.FlowRouteAPI = FlowRouteAPI;
/**
 * @Access_key = username
 * @Secret_key = password
 */
FlowRouteAPI.username = '';
FlowRouteAPI.password = '';
FlowRouteAPI.phone_number = '';
FlowRouteAPI.endpoint = 'https://api.flowroute.com';
//# sourceMappingURL=message.js.map