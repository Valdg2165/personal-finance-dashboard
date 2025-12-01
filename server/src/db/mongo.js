import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const client = new MongoClient (process.env.MONGO_URI);
let db;
console.log("MONGO_URI:", process.env.MONGO_URI);

export async function connectToDb(){
    await client.connect();
    db = client.db();
    console.log("Connected to MongoDB :", db.databaseName);
}
export function getDb() {
    return db;
}