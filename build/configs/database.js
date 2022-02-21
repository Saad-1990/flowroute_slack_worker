"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DBConfig = void 0;
class DBConfig {
}
exports.DBConfig = DBConfig;
DBConfig.dbconf = {
    "default": {
        dbName: 'flowroute-sms-mms',
        serverName: 'localhost',
        port: 27017,
        dbOptions: {
            bufferMaxEntries: 0,
            // reconnectInterval: 10000, //Uncomment when unifiedTopology set to false
            // reconnectTries: 120, //Uncomment when unifiedTopology set to false
            useNewUrlParser: true,
            useUnifiedTopology: true
        }
    }
    // "db2": {} as DBConfigMongo
};
//# sourceMappingURL=database.js.map