"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultModel = void 0;
const database_1 = require("../databases/database");
class DefaultModel {
    static async INIT() {
        database_1.DefaultDatabase.db.subscribe(async (val) => {
            this.db = val;
            if (val) {
                try {
                    this.collection = await this.db.createCollection('channels');
                    console.log('GOT DB');
                    console.log(this.collection.collectionName);
                }
                catch (error) {
                    if (error.code == 48) {
                        this.collection = await this.db.collection('channels');
                    }
                    else {
                        console.log(error);
                        console.log('error in Creating Collection');
                    }
                }
            }
        });
    }
    static async InsertTestDoc(data) {
        try {
            let doc = await this.collection.insertOne(data);
            // if (doc && doc.insertedCount) return doc.result;
            // else return doc;
            return doc;
        }
        catch (error) {
            console.log(error);
            console.log('Error in inserting');
            return error;
        }
    }
}
exports.DefaultModel = DefaultModel;
//# sourceMappingURL=defaultmodel.js.map