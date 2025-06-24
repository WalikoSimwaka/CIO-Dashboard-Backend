const { MongoClient } = require("mongodb");
require("dotenv").config();

let client;
let db;

async function connectToDatabase() {
	if (db) return db;

	try {
		client = new MongoClient(process.env.DB_CONNECTION_STRING, {
			serverApi: {
				version: "1",
				strict: true,
				deprecationErrors: true,
			},
		});

		await client.connect();
		db = client.db("CIODashboard");

		await db.command({ ping: 1 });
		console.log("Successfully connected to MongoDB!");

		return db;
	} catch (err) {
		console.error("MongoDB connection error:", err);
		throw err;
	}
}

async function closeConnection() {
	if (client) {
		await client.close();
		client = null;
		db = null;
	}
}

module.exports = {
	connectToDatabase,
	closeConnection,
	getDb: () => db,
};
