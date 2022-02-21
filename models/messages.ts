import mongodb, { Db, ObjectID } from "mongodb";
import { DefaultDatabase } from "../databases/database";


export abstract class Messages {

    static db: Db;
    static collection: mongodb.Collection;

    public static async INIT() {
        DefaultDatabase.db.subscribe(async val => {
            this.db = val;
            if (val) {
                try {
                    this.collection = await this.db.createCollection('Inboundmessages');
                    console.log('GOT DB');
                    console.log(this.collection.collectionName);

                } catch (error: any) {
                    if (error.code == 48) {
                        this.collection = await this.db.collection('Inboundmessages');
                    } else {

                        console.log(error);
                        console.log('error in Creating Collection');
                    }
                }
            }
        });
    }

    // public static async FindChannel(name: string) {
    //     try {

    //         let doc = await this.collection.find({ name: name }).limit(1).toArray();
    //         return (doc && doc.length) ? doc[1] : undefined;


    //     } catch (error) {
    //         console.log(error);
    //         console.log('error in checking CHannel');
    //         throw error;
    //     }
    // }

    public static async InsertMessage(msg: any) {

        try {

            let doc = await this.collection.insertOne(msg);
            return doc.insertedId;
        } catch (error) {
            console.log(error);
            console.log('Error in inserting Failed MSG');
            throw error
        }
    }

    public static async UpdateMessage(id: any, obj: any) {

        try {

            let doc = await this.collection.update({ _id: new ObjectID(id) }, { $set: obj });
            return doc;
        } catch (error) {
            console.log(error);
            console.log('Error in inserting Failed MSG');
            throw error
        }
    }
}