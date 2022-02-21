import express from "express";
// import cors from "cors";

//Config Imports
import { HTTPCONF } from "../configs/http";
import { CorsConfig } from "../configs/cors";

//Global Router Imports
import * as Middleware from "../controllers/global/middleware"
import * as AssetRouter from "../controllers/global/assets";
import * as DefaultRouter from "../controllers/global/default";


//API Router Imports
import * as FlowrouteRouter from "../controllers/api/flowroute";
import * as TestRouter from "../controllers/api/test";

import { Server } from "http";

export class HTTPServer {

    public static server: HTTPServer;
    public static conf: HTTPCONF;
    private app;
    private httpServer!: Server

    private constructor(conf: HTTPCONF) {
        this.app = express();
    }

    static INIT(conf: HTTPCONF): HTTPServer {
        if (!HTTPServer.server) {
            HTTPServer.conf = conf;
            HTTPServer.server = new HTTPServer(conf);
            HTTPServer.RegisterRouter();
            HTTPServer.StartServer(conf.PORT);
            return HTTPServer.server;
        } else return HTTPServer.server;
    }

    static RegisterRouter() {

        //Allow Cors For All
        // if (HTTPServer.conf.AllowCors) this.server.app.use(cors(CorsConfig.confs.default));

        // parse application/x-www-form-urlencoded
        this.server.app.use(express.urlencoded({ extended: false }));

        // parse application/json
        this.server.app.use(express.json());

        //Middleware route must be stayed at the beginning.
        this.server.app.use(Middleware.router);

        this.server.app.use('/assets', AssetRouter.router);

        //Register API routes Here
        this.server.app.use('/api/test', TestRouter.router);

        this.server.app.use('/api/flowroute', FlowrouteRouter.router);


        //Default Route Must be added at end.
        // this.server.app.use('/', DefaultRouter.router); 
    }

    static StartServer(port: number) {
        this.server.httpServer = this.server.app.listen(port, () => { console.log(`Server Started on Port : ${port}`); })
    }

    static async StopServer() {
        console.log('Stopping Server');
        return new Promise((resolve: any, reject: any) => {

            try {

                this.server.httpServer.close(() => {
                    console.log('Server Closed!!');
                    resolve({ status: 'closed' });
                })

            } catch (error) {
                reject(error);
            }
        })
    }
}