import mongodb, { Db, MongoClient, MongoClientOptions } from "mongodb";
import { DBConfigMongo } from "../configs/database";
import { BehaviorSubject, Subscription } from "rxjs";
import { auditTime, debounceTime } from "rxjs/operators";
import { Logger } from "../server/logger";

export abstract class DefaultDatabase {

    private static subscriptions: Subscription[] = [];
    private static mongClient: MongoClient;
    private static conf: DBConfigMongo;

    public static db: BehaviorSubject<Db | any> = new BehaviorSubject(undefined);


    public static async Connect(dbconf: DBConfigMongo) {
        try {

            DefaultDatabase.conf = dbconf;
            DefaultDatabase.db.pipe(auditTime(5000)).subscribe(val => {
                //For Upcoming Mongo Drivers non-unified Topology will be doscontinued.
                /** 
                 * @Note : When Using unified Topology in Mongo Driver it manages the underlying
                    connection management itself. In Such case listening following events
                    won't be working
                **/
                if (val && !DefaultDatabase.conf.dbOptions.useUnifiedTopology) {
                    (this.db.getValue() as Db).once('close', (err: any, db: any) => {
                        //Write reconnection logic as required.
                        console.log('DB Disconnected');
                        this.db.next(undefined);
                    });

                    (this.db.getValue() as Db).once('reconnect', (event: any) => {
                        console.log('reconnected Default Database');
                        this.db.next(this.mongClient.db(DefaultDatabase.conf.dbName));

                    })
                }
            })

            if (!this.mongClient || !this.mongClient.isConnected() || !this.db) {
                this.mongClient = await MongoClient.connect(`mongodb://${dbconf.serverName}:${dbconf.port}`, dbconf.dbOptions)
                this.db.next(this.mongClient.db(dbconf.dbName));
                if (!this.db) this.mongClient.close();
            }
            return this.db.getValue();

        } catch (error) {
            console.log(error);
            console.log('error in Connecting Database');
        }


    }


    public static async Disconnect() {
        try {

            if (this.mongClient && this.mongClient.isConnected()) this.mongClient.close();
        } catch (error) {
            Logger.Log(error, 'critical')
        }
    }

}