"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("./configs/database");
const logger_1 = require("./configs/logger");
const database_2 = require("./databases/database");
const defaultmodel_1 = require("./models/defaultmodel");
const messages_1 = require("./models/messages");
const flow_channels_1 = require("./models/flow-channels");
const http_1 = require("./server/http");
const logger_2 = require("./server/logger");
const message_serrvice_1 = require("./slack/message-serrvice");
const rmq_1 = require("./server/rmq");
class Application {
    constructor() { }
    async INIT(conf) {
        process.on('unhandledRejection', (ex) => {
            // console.log("Unhandled Execption", ex);
            logger_2.Logger.Log('Unhandled Exception !!!!!', 'critical');
            logger_2.Logger.Log(ex, "critical");
        });
        process.on('uncaughtException', (ex) => {
            // console.log("Unhandled Execption", ex);
            logger_2.Logger.Log('Uncaught Exception !!!!!', 'critical');
            logger_2.Logger.Log(ex, "critical");
        });
        if (conf.GracefullShutdown) {
            //Gracefull Reload on Non-Windows Environment
            //Check The documentation on following link
            //https://nodejs.org/api/process.html
            /**
             * @Note :
             * 'SIGTERM' and 'SIGINT' have default handlers on non-Windows platforms that reset the terminal mode before exiting with code 128 + signal number.
             * If one of these signals has a listener installed, its default behavior will be removed (Node.js will no longer exit).
             */
            process.on('SIGINT', async (code) => {
                try {
                    // Stops the server from accepting new connections and finishes existing connections.
                    let result = await http_1.HTTPServer.StopServer();
                    if (result.status == 'closed') {
                        //Kill All Database Connections or any other pending Finalizers Like Disconnecting the queue and all
                        await database_2.DefaultDatabase.Disconnect();
                    }
                    await rmq_1.RMQ.Dispose();
                    //Kill The Process so that It will be restarted by PM2 or any other process manager
                    process.exit(1);
                }
                catch (error) {
                    logger_2.Logger.Log(error, 'critical');
                    process.exit(1);
                }
            });
        }
        // process.on('SIGTERM', () => {
        //     // Stops the server from accepting new connections and finishes existing connections.
        //     HTTPServer.StopServer();
        //     //Kill The Process so that It will be restarted by PM2 or any other process manager
        //     process.exit(1);
        // })
        try {
            await logger_2.Logger.CreateLogger(logger_1.LoggerConf.colors);
            await database_2.DefaultDatabase.Connect(database_1.DBConfig.dbconf.default);
            await defaultmodel_1.DefaultModel.INIT();
            await flow_channels_1.FlowRouteChannelsModel.INIT();
            await messages_1.Messages.INIT();
            await message_serrvice_1.SlackWebAPI.INIT();
            this.httpServer = http_1.HTTPServer.INIT(conf);
            await rmq_1.RMQ.INIT({ host: 'localhost', user: 'slack_user', password: 'Tyler@sms', protocol: 'amqp', port: 5672 });
            Object.seal(this.httpServer);
            logger_2.Logger.Console('Server Started : ', 'info');
        }
        catch (error) {
            logger_2.Logger.Console(error, 'error');
            logger_2.Logger.Console('error in Initialising Application');
        }
    }
}
let application = new Application();
application.INIT({ PORT: 9000, AllowCors: false, GracefullShutdown: true });
//# sourceMappingURL=index.js.map