import stream from 'stream';
import axios from "axios";

export interface FLOWROUT_SMS_TYPE {
    data: {
        type: "message",
        attributes: {
            to: string,
            from: string,
            body: string,
            is_mms: boolean,
            media_urls?: Array<string>
        }
    }
}

export abstract class FlowRouteAPI {

    /**
     * @Access_key = username
     * @Secret_key = password
     */

    static username = 'ab05f456';
    static password = 'c412e2bb859540378a2c80bb34727384';
    public static phone_number = '16085612999';

    static endpoint = 'https://api.flowroute.com';
    public static INIT(username: string, password: string, phone_number: string) {

        this.username = username;
        this.password = password;
        this.phone_number = phone_number
    }


    public static async SendSMS(body: FLOWROUT_SMS_TYPE) {

        try {

            // prepare query string for API call
            const url = this.endpoint + '/v2.1/messages';


            let result = await axios.post(url, JSON.stringify(body), {
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

        } catch (error) {
            console.log(error);
            throw error;

        }

    }


    static jsonSerialize(data: any) {
        return JSON.stringify(data);
    }


    /**
     * Validates and processes the given Url
     * @param  {String}  url  The Url to process
     * @return {String}       Processed url
     */
    static CleanURL(url: string) {
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



    private static CleanObject(input: any) {
        if (!input) {
            return input;
        }
        const cleanedObj = input;
        if (cleanedObj instanceof stream.Stream) {
            return cleanedObj;
        }
        const keys: any = Object.keys(cleanedObj);
        for (let iter = 0; iter < keys.length; iter += 1) {
            const value = cleanedObj[keys[iter]];
            if (value === null || value === undefined) {
                if (cleanedObj.constructor === Array) {
                    cleanedObj.splice(keys[iter], 1);
                } else delete cleanedObj[keys[iter]];
            } else if (Object.prototype.toString.call(value) === '[object Object]') {
                this.CleanObject(value);
            } else if (value.constructor === Array) {
                this.CleanObject(value);
            }
        }
        return cleanedObj;
    }

}