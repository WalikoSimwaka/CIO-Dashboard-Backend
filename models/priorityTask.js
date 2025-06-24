const { connectToDatabase } = require("../config/db");

class PriorityTask {
	static async getCollection() {
		const db = await connectToDatabase();
		return db.collection("priorityTasks");
	}

	static async getAll() {
		const collection = await this.getCollection();
		return collection.find().sort({ created_at: -1 }).toArray();
	}

	static async getById(id) {
		const collection = await this.getCollection();
		return collection.findOne({ _id: id });
	}

	static async create({ title, priority, due_date, completed = false }) {
		const collection = await this.getCollection();
		const result = await collection.insertOne({
			title,
			priority,
			due_date: due_date ? new Date(due_date) : null,
			completed,
			created_at: new Date(),
		});
		return collection.findOne({ _id: result.insertedId });
	}

	static async update(id, { title, priority, due_date, completed }) {
		const collection = await this.getCollection();
		await collection.updateOne(
			{ _id: id },
			{
				$set: {
					title,
					priority,
					due_date: due_date ? new Date(due_date) : null,
					completed,
				},
			}
		);
		return collection.findOne({ _id: id });
	}

	static async delete(id) {
		const collection = await this.getCollection();
		const task = await collection.findOne({ _id: id });
		if (task) {
			await collection.deleteOne({ _id: id });
		}
		return task;
	}
}

module.exports = PriorityTask;
