import mongodb, { Db } from "mongodb";
import { DefaultDatabase } from "../databases/database";


export abstract class DefaultModel {

    static db: Db;
    static collection: mongodb.Collection;

    public static async INIT() {
        DefaultDatabase.db.subscribe(async val => {
            this.db = val;
            if (val) {
                try {
                    this.collection = await this.db.createCollection('channels');
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

    public static async InsertTestDoc(data: any) {

        try {

            let doc = await this.collection.insertOne(data);
            // if (doc && doc.insertedCount) return doc.result;
            // else return doc;
            return doc;
        } catch (error) {
            console.log(error);
            console.log('Error in inserting');
            return error;
        }
    }
}