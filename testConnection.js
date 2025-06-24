const { MongoClient } = require("mongodb");
require("dotenv").config();

(async () => {
	const uri = process.env.DB_CONNECTION_STRING;
	console.log("Connecting to MongoDB Atlas...");

	const client = new MongoClient(uri, {
		tls: true,
		serverSelectionTimeoutMS: 5000,
	});

	try {
		await client.connect();
		await client.db().command({ ping: 1 });
		console.log("✅ Successfully connected to MongoDB!");
	} catch (err) {
		console.error("❌ Connection failed:", err);
	} finally {
		await client.close();
		process.exit();
	}
})();
