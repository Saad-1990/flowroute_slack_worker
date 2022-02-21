import { BrokerAsPromised, BrokerConfig, PublicationSession, SubscriberSessionAsPromised } from 'rascal';
import { Channel } from "@slack/web-api/dist/response/ChannelsCreateResponse";
import { FlowRouteChannelsModel } from '../models/flow-channels';
import { SlackWebAPI } from '../slack/message-serrvice';
import { Messages } from '../models/messages';
import { FlowRouteAPI } from '../flowroute-service.ts/message';

export interface RabbitMQ {
    host: string;
    port?: number;
    protocol: 'amqp' | 'stomp';
    user: string;
    password: string;
}

export abstract class RMQ {


    private static broker: BrokerAsPromised;

    private static publishTimeout = 10000;
    private static channels: { [key: string]: SubscriberSessionAsPromised } = {};

    private static conf: BrokerConfig;

    private static GenerateConfig(conf: RabbitMQ): BrokerConfig {
        return {
            vhosts: {
                '/': {
                    connection: {
                        slashes: true,
                        protocol: conf.protocol,        /** We're using amqp protocl but others protocols are also supported like STOMP | Websockets etc. Please take a look at rabbitmq official guide. */
                        hostname: conf.host,   /** ServerIP/Domain When RabbitMQ is deployed */
                        user: conf.user,            /** User which we've created with previliges after installing RabbitMQ */
                        password: conf.password,
                        port: conf.port || 5672,              /** Port where RAbbitMQ server is Running. @NOTE If RabbitMQ is not directly exposed on its port then leave it blank and proxying server will take care of rest */
                        options: {
                            heartbeat: 5         /** Pinging Interval in seconds */
                        },
                        socketOptions: {
                            timeout: 10000       /** Disconnect Channel After constantly ping fail for n milliseconds */
                        },
                        retry: {
                            min: 1000,           /** Minimum Retry Interval After Disconnection */
                            max: 60000,          /** Maximum Retry Interval After Disconnection */
                            factor: 2,           /** Randomization Factor for resolving retry interval */
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
                    queues: { /** Following Section Will have Queue Configuration if any. Note Keyname doesn't have in impact but it is useful when subcribing to them then keyname will be used to acquire the configurations */
                        "flowrouteworker": {
                            assert: true, /** Will Insert the queue if not exist */
                            check: true, /** Will check if queue exist or not. @NOTE It has no impact when assert is true */
                            options: {
                                durable: true, /** It ensures that queue is persistent  */
                                deadLetterExchange: "deadletter_e", /** In case of too many failure or any other case for which we don't want to receive event any further that event will be published to this Exchange for manual use or any other action/monitoring etc  */
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
                    exchanges: { /** Exchanges are front-end router of queues. When Queue is bounded behind exchange the routing strategies can be configured on Exchange for appropriate queue routing */
                        'deadletter_e': {
                            assert: true, /** Create Exchange if not exist */
                            check: true, /** Check if Exchange exisit or not. It doesn't have any impact when assert is true */
                            options: {
                                durable: true, /** Persistent Exchange */
                                autoDelete: false /** Prevent Exchange Deletion */
                            },
                            type: "direct", /** See other type at Rabbit MQ Guide. for eg fanout | topic etc */
                        }
                    },
                    bindings: { /** Binding works as glue between Exchange and queue. Rules between exchange and queues will be configured here  */
                        'deadletter_e': {
                            source: "deadletter_e",
                            destination: "deadletter",
                            destinationType: 'queue',
                            bindingKey: '#'
                        }
                    },
                    subscriptions: {
                        "flowrouteworker": {
                            queue: "flowrouteworker", /** Queuname for which we can to open Events */
                            autoCreated: true, /** It Will queue if not exist */
                            prefetch: 5, /** Max Events it can consume to balance the workload */
                            contentType: "application/json", /** Check other contentTypes as well. It will serialize the event data as per informed contentType. @NOTE Invalid content event will occure if provided payload doesn't math the content type */
                            options: {
                                noAck: false, /** Disable the auto-acknowledgment for the event for gaurenteed delivery and processing */
                            },
                            retry: {
                                min: 1000, /** Minimum delay for which the event will be available for consumption again in case of Nack */
                                max: 60000, /** Maximum delay for which the event will be available for consumption again in case of Nack */
                                factor: 2, /** Randomizing delay for which the event will be available for consumption again in case of Nack between min and max */
                                strategy: 'exponential' /** See other strategies for which the event will be available for consumption again in case of Nack */
                            }
                        }
                    }
                }
            }
        } as BrokerConfig
    }


    public static async INIT(conf: RabbitMQ) {
        try {

            this.conf = this.GenerateConfig(conf);
            this.broker = await BrokerAsPromised.create(this.conf);
            this.broker.on('error', async (error: any, msgID: any) => {
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

        } catch (error) {
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

    public static async SubscribeChannel(queueName: string) {

        try {
            let session = await this.broker.subscribe(queueName);
            session.on('invalid_content', (message, content, ackorNak) => {
                console.log('Invalid Content :', message);
                console.log('content : ', content);
                ackorNak(new Error(JSON.stringify(content)), [{ immediateNack: true, requeue: false, xDeathFix: true, strategy: 'nack' }]);
            })

            session.on('redeliveries_exceeded', async (message, content, ackorNak) => {
                //DO Work
                console.log('Redeliveries Exceeded :', message);
                console.log('content : ', content);
                ackorNak(new Error(JSON.stringify(content)), [{ immediateNack: true, requeue: false, xDeathFix: true, strategy: 'nack' }]);
            });

            session.on('error', async (error: any) => {
                //DO Work
                console.log('error : ', error);
            });

            session.on('message', async (message, payload, ackOrNackFn) => {
                try {
                    if (!payload.msg) {
                        ackOrNackFn(new Error(JSON.stringify(payload)), [{ immediateNack: true, requeue: false, xDeathFix: true, strategy: 'nack' }]);
                    }
                    let channel: Channel | undefined
                    switch (payload.msg) {
                        case 'msg_recieved':

                            let attributes = payload.data.attributes
                            let attachments = payload.data.included;
                            let channelName = payload.data.channelName;

                            channel = await FlowRouteChannelsModel.FindChannel(channelName);
                            if (!channel) {
                                channel = await SlackWebAPI.CreateChannel(channelName);
                                await FlowRouteChannelsModel.InsertChannel(channel);
                            }
                            if (channel && channel.id) {
                                let msgResponse = await SlackWebAPI.SendMessage(channelName, channel.id, attributes.body, attachments);
                                ackOrNackFn();
                            } else throw new Error('Unknown Error');
                            break;
                        case 'msg_send':
                            // console.log('Payload Data : ', payload.data);
                            let result = await FlowRouteAPI.SendSMS(payload.data);
                            ackOrNackFn();
                            break;
                        case 'channel_created':
                            channel = await FlowRouteChannelsModel.FindChannel(payload.data.channelName);
                            if (!channel) {
                                channel = await SlackWebAPI.CreateChannel(payload.data.channelName);
                                await FlowRouteChannelsModel.InsertChannel(channel);
                            }
                            ackOrNackFn();
                            break;
                        case 'channel_deleted':
                            await FlowRouteChannelsModel.DeleteChannel(payload.data.id);
                            ackOrNackFn();
                            break;
                        default:
                            ackOrNackFn(new Error(JSON.stringify(payload)), [{ immediateNack: true, requeue: false, xDeathFix: true, strategy: 'nack' }]);
                            break;

                    }

                } catch (error: any) {
                    // console.log(error);
                    ackOrNackFn(new Error(JSON.stringify(payload)), [
                        { strategy: 'republish', defer: 5000, attempts: 10 },
                        { immediateNack: true, requeue: false, xDeathFix: true, strategy: 'nack' }
                    ]);
                }
            });

        } catch (error: any) {

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
    public static async Dispose() {
        try {
            if (this.broker) await this.broker.shutdown()
            else return;
        } catch (error: any) {
            console.log('Error in Disposing Rabbit MQ');
            throw error;
        }
    }


















}