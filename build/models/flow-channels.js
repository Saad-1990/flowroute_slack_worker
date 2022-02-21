"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlowRouteChannelsModel = void 0;
const database_1 = require("../databases/database");
class FlowRouteChannelsModel {
    static async INIT() {
        database_1.DefaultDatabase.db.subscribe(async (val) => {
            this.db = val;
            if (val) {
                try {
                    this.collection = await this.db.createCollection('channels');
                    this.collection.createIndex('name', { unique: true });
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
    static async FindChannel(name) {
        try {
            let doc = await this.collection.find({ name: name }).limit(1).toArray();
            return (doc && doc.length) ? doc[0] : undefined;
        }
        catch (error) {
            console.log(error);
            console.log('error in checking CHannel');
            throw error;
        }
    }
    static async FindChannelByID(id) {
        try {
            let doc = await this.collection.find({ id: id }).limit(1).toArray();
            return (doc && doc.length) ? doc[0] : undefined;
        }
        catch (error) {
            console.log(error);
            console.log('error in checking CHannel');
            throw error;
        }
    }
    static async InsertChannel(channel) {
        try {
            let doc = await this.collection.insertOne(channel);
        }
        catch (error) {
            console.log(error);
            console.log('Error in inserting');
            throw error;
        }
    }
    static async UpdateChannel(name, channel) {
        try {
            delete channel.name;
            let doc = await this.collection.updateOne({ name: name }, { $set: channel });
        }
        catch (error) {
            console.log(error);
            console.log('Error in inserting');
            throw error;
        }
    }
    static async DeleteChannel(channel) {
        try {
            delete channel.name;
            let doc = await this.collection.deleteOne({ id: channel });
        }
        catch (error) {
            console.log(error);
            console.log('Error in inserting');
            throw error;
        }
    }
}
exports.FlowRouteChannelsModel = FlowRouteChannelsModel;
//# sourceMappingURL=flow-channels.js.map