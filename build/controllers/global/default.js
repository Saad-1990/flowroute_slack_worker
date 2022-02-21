"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = __importDefault(require("express"));
const routes = express_1.default.Router();
//Comment If we Don't want to Entertain All routes and generate Error
routes.use('/', (req, res) => { console.log('Default : '); res.send('Hello World'); });
routes.use('*', (req, res) => { res.status(401).send('Uknown Router Default Handled'); });
exports.router = routes;
//# sourceMappingURL=default.js.map