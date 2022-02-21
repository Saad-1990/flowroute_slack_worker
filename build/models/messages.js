"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Messages = void 0;
const mongodb_1 = require("mongodb");
const database_1 = require("../databases/database");
class Messages {
    static async INIT() {
        database_1.DefaultDatabase.db.subscribe(async (val) => {
            this.db = val;
            if (val) {
                try {
                    this.collection = await this.db.createCollection('Inboundmessages');
                    console.log('GOT DB');
                    console.log(this.collection.collectionName);
                }
                catch (error) {
                    if (error.code == 48) {
                        this.collection = await this.db.collection('Inboundmessages');
                    }
                    else {
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
    static async InsertMessage(msg) {
        try {
            let doc = await this.collection.insertOne(msg);
            return doc.insertedId;
        }
        catch (error) {
            console.log(error);
            console.log('Error in inserting Failed MSG');
            throw error;
        }
    }
    static async UpdateMessage(id, obj) {
        try {
            let doc = await this.collection.update({ _id: new mongodb_1.ObjectID(id) }, { $set: obj });
            return doc;
        }
        catch (error) {
            console.log(error);
            console.log('Error in inserting Failed MSG');
            throw error;
        }
    }
}
exports.Messages = Messages;
//# sourceMappingURL=messages.js.map