import { MongoClient, MongoClientOptions } from "mongodb";

//NOTE : Following Config is inline for basic usage. However we can use vault as per our requirement.

export interface DBConfigMongo {
    dbName: string;
    serverName: string;
    port: number;
    dbOptions: MongoClientOptions
}

interface DBConfigSQL {
    //Create Config When Required
}

export class DBConfig {

    public static dbconf = {
        "default": {
            dbName: 'flowroute-sms-mms',
            serverName: 'localhost',
            port: 27017,
            dbOptions: {
                bufferMaxEntries: 0,
                // reconnectInterval: 10000, //Uncomment when unifiedTopology set to false
                // reconnectTries: 120, //Uncomment when unifiedTopology set to false
                useNewUrlParser: true,
                useUnifiedTopology : true
            }
        } as DBConfigMongo
        // "db2": {} as DBConfigMongo

    }
}