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
            await SlackWebAPI.INIT();

            this.httpServer = HTTPServer.INIT(conf);
            await RMQ.INIT({ host : 'localhost', user : 'slack_user', password : 'Tyler@sms' , protocol : 'amqp', port : 5672 });
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

