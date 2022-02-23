import { DBConfig } from "./configs/database";
import { HTTPCONF } from "./configs/http";
import { LoggerConf } from "./configs/logger";
import { DefaultDatabase } from "./databases/database";
import { DefaultModel } from "./models/defaultmodel";
import { Messages } from "./models/messages";
import { FlowRouteChannelsModel } from "./models/flow-channels";
import { HTTPServer } from "./server/http";
import { Logger } from "./server/logger";
import { SlackWebAPI } from "./slack/message-serrvice";
import { RMQ } from "./server/rmq";
import { FlowRouteAPI } from "./flowroute-service.ts/message";


class Application {

    private httpServer!: HTTPServer;
    constructor() { }
    public async INIT(conf: HTTPCONF) {

        process.on('unhandledRejection', (ex) => {
            // console.log("Unhandled Execption", ex);
            Logger.Log('Unhandled Exception !!!!!', 'critical');

            Logger.Log(ex, "critical");

        })

        process.on('uncaughtException', (ex) => {
            // console.log("Unhandled Execption", ex);
            Logger.Log('Uncaught Exception !!!!!', 'critical');
            Logger.Log(ex, "critical");
        })

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
                    let result: any = await HTTPServer.StopServer();

                    if (result.status == 'closed') {
                        //Kill All Database Connections or any other pending Finalizers Like Disconnecting the queue and all
                        await DefaultDatabase.Disconnect();
                    }
                    await RMQ.Dispose();

                    //Kill The Process so that It will be restarted by PM2 or any other process manager
                    process.exit(1);

                } catch (error) {
                    Logger.Log(error, 'critical');
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

            await Logger.CreateLogger(LoggerConf.colors)
            await DefaultDatabase.Connect(DBConfig.dbconf.default);

            await DefaultModel.INIT();
            await FlowRouteChannelsModel.INIT();
            await Messages.INIT();

            FlowRouteAPI.INIT(process.env.FLOWROUTE_USERNAME || 'ab05f456', process.env.FLOWROUTE_PASSWORD || 'c412e2bb859540378a2c80bb34727384', process.env.FLOWROUTE_NUMBER || '16085612999');

            await SlackWebAPI.INIT(process.env.SLACK_TOKEN || '');

            this.httpServer = HTTPServer.INIT(conf);
            await RMQ.INIT({
                host: process.env.RMQ_HOST || 'localhost',
                user: process.env.RMQ_USER || 'slack_user',
                password: process.env.RMQ_PASSWORD || 'Tyler@sms',
                protocol: process.env.RMQ_PROTOCOL as any || 'amqp',
                port: process.env.RMQ_PORT as any || 5672
            });


            Object.seal(this.httpServer);
            Logger.Console('Server Started : ', 'info');

        } catch (error) {
            Logger.Console(error, 'error');
            Logger.Console('error in Initialising Application');
        }

    }
}


let application = new Application();
application.INIT({ PORT: 9000, AllowCors: false, GracefullShutdown: true });

