"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTTPServer = void 0;
const express_1 = __importDefault(require("express"));
//Global Router Imports
const Middleware = __importStar(require("../controllers/global/middleware"));
const AssetRouter = __importStar(require("../controllers/global/assets"));
const TestRouter = __importStar(require("../controllers/api/test"));
class HTTPServer {
    constructor(conf) {
        this.app = express_1.default();
    }
    static INIT(conf) {
        if (!HTTPServer.server) {
            HTTPServer.conf = conf;
            HTTPServer.server = new HTTPServer(conf);
            HTTPServer.RegisterRouter();
            HTTPServer.StartServer(conf.PORT);
            return HTTPServer.server;
        }
        else
            return HTTPServer.server;
    }
    static RegisterRouter() {
        //Allow Cors For All
        // if (HTTPServer.conf.AllowCors) this.server.app.use(cors(CorsConfig.confs.default));
        // parse application/x-www-form-urlencoded
        this.server.app.use(express_1.default.urlencoded({ extended: false }));
        // parse application/json
        this.server.app.use(express_1.default.json());
        //Middleware route must be stayed at the beginning.
        this.server.app.use(Middleware.router);
        this.server.app.use('/assets', AssetRouter.router);
        //Register API routes Here
        this.server.app.use('/api/test', TestRouter.router);
        // this.server.app.use('/api/flowroute', FlowrouteRouter.router);
        //Default Route Must be added at end.
        // this.server.app.use('/', DefaultRouter.router); 
    }
    static StartServer(port) {
        this.server.httpServer = this.server.app.listen(port, () => { console.log(`Server Started on Port : ${port}`); });
    }
    static async StopServer() {
        console.log('Stopping Server');
        return new Promise((resolve, reject) => {
            try {
                this.server.httpServer.close(() => {
                    console.log('Server Closed!!');
                    resolve({ status: 'closed' });
                });
            }
            catch (error) {
                reject(error);
            }
        });
    }
}
exports.HTTPServer = HTTPServer;
//# sourceMappingURL=http.js.map