import mongodb, { Db } from "mongodb";
import { DefaultDatabase } from "../databases/database";


export abstract class FlowRouteChannelsModel {

    static db: Db;
    static collection: mongodb.Collection;

    public static async INIT() {
        DefaultDatabase.db.subscribe(async val => {
            this.db = val;
            if (val) {
                try {
                    this.collection = await this.db.createCollection('channels');
                    this.collection.createIndex('name', { unique: true })
                    console.log('GOT DB');
                    console.log(this.collection.collectionName);

                } catch (error: any) {
                    if (error.code == 48) {
                        this.collection = await this.db.collection('channels');
                    } else {

                        console.log(error);
                        console.log('error in Creating Collection');
                    }
                }
            }
        });
    }

    public static async FindChannel(name: string) {
        try {

            let doc = await this.collection.find({ name: name }).limit(1).toArray();
            return (doc && doc.length) ? doc[0] : undefined;


        } catch (error) {
            console.log(error);
            console.log('error in checking CHannel');
            throw error;
        }
    }

    public static async FindChannelByID(id: string) {
        try {

            let doc = await this.collection.find({ id: id }).limit(1).toArray();
            return (doc && doc.length) ? doc[0] : undefined;


        } catch (error) {
            console.log(error);
            console.log('error in checking CHannel');
            throw error;
        }
    }

    public static async InsertChannel(channel: any) {

        try {

            let doc = await this.collection.insertOne(channel);

        } catch (error) {
            console.log(error);
            console.log('Error in inserting');
            throw error
        }
    }

    public static async UpdateChannel(name: string, channel: any) {

        try {
            delete channel.name
            let doc = await this.collection.updateOne({ name: name }, { $set: channel });

        } catch (error) {
            console.log(error);
            console.log('Error in inserting');
            throw error
        }
    }

    public static async DeleteChannel(channel: any) {

        try {
            delete channel.name
            let doc = await this.collection.deleteOne({ id: channel });

        } catch (error) {
            console.log(error);
            console.log('Error in inserting');
            throw error
        }
    }
}