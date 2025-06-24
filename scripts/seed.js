// scripts/seed.js
const { connectToDatabase } = require("../config/db");
const PriorityTask = require("../models/priorityTask");
const HighPriorityProject = require("../models/highPriorityProject");
const Incident = require("../models/incident");

async function seedDatabase() {
	try {
		await connectToDatabase();

		// Clear existing data
		const db = await connectToDatabase();
		await db.collection("priorityTasks").deleteMany({});
		await db.collection("highPriorityProjects").deleteMany({});
		await db.collection("incidents").deleteMany({});

		// Seed priority tasks
		await PriorityTask.create({
			title: "Review quarterly IT budget",
			priority: "high",
			due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
			completed: false,
		});

		// Seed high priority projects
		await HighPriorityProject.create({
			name: "ERP System Upgrade",
			start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
			due_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
			status: "on track",
			responsible: "Waliko Simwaka",
		});

		// Seed incidents
		await Incident.create({
			title: "Server outage",
			description: "Multiple servers down in the data center",
			status: "New",
			due_date: new Date(Date.now() + 24 * 60 * 60 * 1000),
			priority: "Critical",
			assignees: ["Network Team"],
		});

		console.log("Database seeded successfully");
		process.exit(0);
	} catch (err) {
		console.error("Error seeding database:", err);
		process.exit(1);
	}
}

seedDatabase();
