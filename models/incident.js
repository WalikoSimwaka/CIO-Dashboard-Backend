const { connectToDatabase } = require("../config/db");

class Incident {
	static async getCollection() {
		const db = await connectToDatabase();
		return db.collection("incidents");
	}

	static async getAll() {
		const collection = await this.getCollection();
		return collection.find().sort({ timestamp: -1 }).toArray();
	}

	static async getById(id) {
		const collection = await this.getCollection();
		return collection.findOne({ _id: id });
	}

	static async create({
		title,
		description,
		status = "New",
		due_date,
		priority,
		assignees = ["Unassigned"],
		timestamp = new Date(),
	}) {
		const collection = await this.getCollection();
		const result = await collection.insertOne({
			title,
			description,
			status,
			due_date: due_date ? new Date(due_date) : null,
			priority,
			assignees,
			timestamp: new Date(timestamp),
			created_at: new Date(),
		});
		return collection.findOne({ _id: result.insertedId });
	}

	static async update(
		id,
		{ title, description, status, due_date, priority, assignees }
	) {
		const collection = await this.getCollection();
		await collection.updateOne(
			{ _id: id },
			{
				$set: {
					title,
					description,
					status,
					due_date: due_date ? new Date(due_date) : null,
					priority,
					assignees,
				},
			}
		);
		return collection.findOne({ _id: id });
	}

	static async delete(id) {
		const collection = await this.getCollection();
		const incident = await collection.findOne({ _id: id });
		if (incident) {
			await collection.deleteOne({ _id: id });
		}
		return incident;
	}
}

module.exports = Incident;
