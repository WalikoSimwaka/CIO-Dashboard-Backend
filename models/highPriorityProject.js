const { connectToDatabase } = require("../config/db");

class HighPriorityProject {
	static async getCollection() {
		const db = await connectToDatabase();
		return db.collection("highPriorityProjects");
	}

	static async getAll() {
		const collection = await this.getCollection();
		return collection.find().sort({ start_date: -1 }).toArray();
	}

	static async getById(id) {
		const collection = await this.getCollection();
		return collection.findOne({ _id: id });
	}

	static async create({ name, start_date, due_date, status, responsible }) {
		const collection = await this.getCollection();
		const result = await collection.insertOne({
			name,
			start_date: new Date(start_date),
			due_date: new Date(due_date),
			status,
			responsible,
			created_at: new Date(),
		});
		return collection.findOne({ _id: result.insertedId });
	}

	static async update(id, { name, start_date, due_date, status, responsible }) {
		const collection = await this.getCollection();
		await collection.updateOne(
			{ _id: id },
			{
				$set: {
					name,
					start_date: new Date(start_date),
					due_date: new Date(due_date),
					status,
					responsible,
				},
			}
		);
		return collection.findOne({ _id: id });
	}

	static async delete(id) {
		const collection = await this.getCollection();
		const project = await collection.findOne({ _id: id });
		if (project) {
			await collection.deleteOne({ _id: id });
		}
		return project;
	}
}

module.exports = HighPriorityProject;
