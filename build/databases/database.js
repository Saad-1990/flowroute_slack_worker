"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultDatabase = void 0;
const mongodb_1 = require("mongodb");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const logger_1 = require("../server/logger");
class DefaultDatabase {
    static async Connect(dbconf) {
        try {
            DefaultDatabase.conf = dbconf;
            DefaultDatabase.db.pipe(operators_1.auditTime(5000)).subscribe(val => {
                //For Upcoming Mongo Drivers non-unified Topology will be doscontinued.
                /**
                 * @Note : When Using unified Topology in Mongo Driver it manages the underlying
                    connection management itself. In Such case listening following events
                    won't be working
                **/
                if (val && !DefaultDatabase.conf.dbOptions.useUnifiedTopology) {
                    this.db.getValue().once('close', (err, db) => {
                        //Write reconnection logic as required.
                        console.log('DB Disconnected');
                        this.db.next(undefined);
                    });
                    this.db.getValue().once('reconnect', (event) => {
                        console.log('reconnected Default Database');
                        this.db.next(this.mongClient.db(DefaultDatabase.conf.dbName));
                    });
                }
            });
            if (!this.mongClient || !this.mongClient.isConnected() || !this.db) {
                this.mongClient = await mongodb_1.MongoClient.connect(`mongodb://${dbconf.serverName}:${dbconf.port}`, dbconf.dbOptions);
                this.db.next(this.mongClient.db(dbconf.dbName));
                if (!this.db)
                    this.mongClient.close();
            }
            return this.db.getValue();
        }
        catch (error) {
            console.log(error);
            console.log('error in Connecting Database');
        }
    }
    static async Disconnect() {
        try {
            if (this.mongClient && this.mongClient.isConnected())
                this.mongClient.close();
        }
        catch (error) {
            logger_1.Logger.Log(error, 'critical');
        }
    }
}
exports.DefaultDatabase = DefaultDatabase;
DefaultDatabase.subscriptions = [];
DefaultDatabase.db = new rxjs_1.BehaviorSubject(undefined);
//# sourceMappingURL=database.js.map