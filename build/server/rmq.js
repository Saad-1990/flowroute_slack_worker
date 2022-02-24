"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RMQ = void 0;
const rascal_1 = require("rascal");
const flow_channels_1 = require("../models/flow-channels");
const message_serrvice_1 = require("../slack/message-serrvice");
const message_1 = require("../flowroute-service.ts/message");
class RMQ {
    static GenerateConfig(conf) {
        return {
            vhosts: {
                '/': {
                    connection: {
                        slashes: true,
                        protocol: conf.protocol,
                        hostname: conf.host,
                        user: conf.user,
                        password: conf.password,
                        port: conf.port || 5672,
                        options: {
                            heartbeat: 5 /** Pinging Interval in seconds */
                        },
                        socketOptions: {
                            timeout: 10000 /** Disconnect Channel After constantly ping fail for n milliseconds */
                        },
                        retry: {
                            min: 1000,
                            max: 60000,
                            factor: 2,
                            strategy: 'exponential' /** Other Strategies like Linear can also be used. Please look at the RabbitMQ official guide for more information  */
                        },
                        // management: { /** If You want application to submit the result to the UI engine then uncomment following Object and configure it appropriately */
                        //     protocol: "http",
                        //     pathname: "/ui",
                        //     user: "guest",
                        //     password: "guest",
                        //     options: {
                        //         "timeout": 1000
                        //     }
                        // },
                    },
                    queues: {
                        "flowrouteworker": {
                            assert: true,
                            check: true,
                            options: {
                                durable: true,
                                deadLetterExchange: "deadletter_e",
                                deadLetterRoutingKey: "#" /** '#' means all the event should be routed to whichever queues this exchange is associated */
                            }
                        },
                        "deadletter": {
                            assert: true,
                            check: true,
                            options: {
                                durable: true
                            }
                        }
                    },
                    exchanges: {
                        'deadletter_e': {
                            assert: true,
                            check: true,
                            options: {
                                durable: true,
                                autoDelete: false /** Prevent Exchange Deletion */
                            },
                            type: "direct", /** See other type at Rabbit MQ Guide. for eg fanout | topic etc */
                        }
                    },
                    bindings: {
                        'deadletter_e': {
                            source: "deadletter_e",
                            destination: "deadletter",
                            destinationType: 'queue',
                            bindingKey: '#'
                        }
                    },
                    subscriptions: {
                        "flowrouteworker": {
                            queue: "flowrouteworker",
                            autoCreated: true,
                            prefetch: 5,
                            contentType: "application/json",
                            options: {
                                noAck: false, /** Disable the auto-acknowledgment for the event for gaurenteed delivery and processing */
                            },
                            retry: {
                                min: 1000,
                                max: 60000,
                                factor: 2,
                                strategy: 'exponential' /** See other strategies for which the event will be available for consumption again in case of Nack */
                            }
                        }
                    }
                }
            }
        };
    }
    static async INIT(conf) {
        try {
            this.conf = this.GenerateConfig(conf);
            this.broker = await rascal_1.BrokerAsPromised.create(this.conf);
            this.broker.on('error', async (error, msgID) => {
                console.log('Broker Error : ', error);
            });
            this.broker.on('vhost_initialised', ({ vhost, connectionUrl }) => {
                console.log(`Vhost: ${vhost} was initialised using connection: ${connectionUrl}`);
            });
            this.broker.on('blocked', (reason, { vhost, connectionUrl }) => {
                console.log(`Vhost: ${vhost} was blocked using connection: ${connectionUrl}. Reason: ${reason}`);
            });
            this.broker.on('unblocked', ({ vhost, connectionUrl }) => {
                console.log(`Vhost: ${vhost} was unblocked using connection: ${connectionUrl}.`);
            });
            await this.SubscribeChannel('flowrouteworker');
            // await this.SubscribeChannel('fcm');
        }
        catch (error) {
            console.log('Error in INIT QUEUE');
            console.log(error);
            throw error;
        }
    }
    /**
     *
     * @param queueName  :string
     *
     * @NOTE : Following function will only open the channel and bind the generic event Handler.
     * Look the in side function named Bind Events that is responsible for Binding Message Process w.r.t Subscription
     */
    static async SubscribeChannel(queueName) {
        try {
            let session = await this.broker.subscribe(queueName);
            session.on('invalid_content', (message, content, ackorNak) => {
                console.log('Invalid Content :', message);
                console.log('content : ', content);
                ackorNak(new Error(JSON.stringify(content)), [{ immediateNack: true, requeue: false, xDeathFix: true, strategy: 'nack' }]);
            });
            session.on('redeliveries_exceeded', async (message, content, ackorNak) => {
                //DO Work
                console.log('Redeliveries Exceeded :', message);
                console.log('content : ', content);
                ackorNak(new Error(JSON.stringify(content)), [{ immediateNack: true, requeue: false, xDeathFix: true, strategy: 'nack' }]);
            });
            session.on('error', async (error) => {
                //DO Work
                console.log('error : ', error);
            });
            session.on('message', async (message, payload, ackOrNackFn) => {
                try {
                    if (!payload.msg) {
                        ackOrNackFn(new Error(JSON.stringify(payload)), [{ immediateNack: true, requeue: false, xDeathFix: true, strategy: 'nack' }]);
                    }
                    let channel;
                    switch (payload.msg) {
                        case 'msg_recieved':
                            let attributes = payload.data.attributes;
                            let attachments = payload.data.included;
                            let channelName = payload.data.channelName;
                            channel = await flow_channels_1.FlowRouteChannelsModel.FindChannel(channelName);
                            if (!channel) {
                                channel = await message_serrvice_1.SlackWebAPI.CreateChannel(channelName);
                                await flow_channels_1.FlowRouteChannelsModel.InsertChannel(channel);
                            }
                            if (channel && channel.id) {
                                let msgResponse = await message_serrvice_1.SlackWebAPI.SendMessage(channelName, channel.id, attributes.body, attachments);
                                console.log('Message Sent to Slack successfully');
                                console.log(msgResponse);
                                ackOrNackFn();
                            }
                            else
                                throw new Error('Unknown Error');
                            break;
                        case 'msg_send':
                            // console.log('Payload Data : ', payload.data);
                            let result = await message_1.FlowRouteAPI.SendSMS(payload.data);
                            ackOrNackFn();
                            break;
                        case 'channel_created':
                            channel = await flow_channels_1.FlowRouteChannelsModel.FindChannel(payload.data.channelName);
                            if (!channel) {
                                channel = await message_serrvice_1.SlackWebAPI.CreateChannel(payload.data.channelName);
                                await flow_channels_1.FlowRouteChannelsModel.InsertChannel(channel);
                            }
                            ackOrNackFn();
                            break;
                        case 'channel_deleted':
                            await flow_channels_1.FlowRouteChannelsModel.DeleteChannel(payload.data.id);
                            ackOrNackFn();
                            break;
                        default:
                            ackOrNackFn(new Error(JSON.stringify(payload)), [{ immediateNack: true, requeue: false, xDeathFix: true, strategy: 'nack' }]);
                            break;
                    }
                }
                catch (error) {
                    console.log(error);
                    ackOrNackFn(new Error(JSON.stringify(payload)), [
                        { strategy: 'republish', defer: 5000, attempts: 10 },
                        { immediateNack: true, requeue: false, xDeathFix: true, strategy: 'nack' }
                    ]);
                }
            });
        }
        catch (error) {
            console.log('error in subscribing Channel : ', queueName);
            throw error;
        }
    }
    /**
     *
     * @returns
     *
     * @NOTE : deferCloseChannel : <defaults to 10 secs>
     * Shutting down the broker will cancel all subscriptions, then wait a short amount of time for inflight messages to be acknowledged
     * (configurable via the deferCloseChannel subscription property), before closing channels and disconnecting.
     *
     */
    static async Dispose() {
        try {
            if (this.broker)
                await this.broker.shutdown();
            else
                return;
        }
        catch (error) {
            console.log('Error in Disposing Rabbit MQ');
            throw error;
        }
    }
}
exports.RMQ = RMQ;
RMQ.publishTimeout = 10000;
RMQ.channels = {};
//# sourceMappingURL=rmq.js.map