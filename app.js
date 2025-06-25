require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { connectToDatabase, closeConnection } = require("./config/db");

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

// Test database connection
app.get("/test-db", async (req, res) => {
	try {
		const db = await connectToDatabase();
		await db.command({ ping: 1 });
		res.json({ success: true, message: "MongoDB connection successful" });
	} catch (err) {
		console.error(err);
		res
			.status(500)
			.json({ success: false, error: "Database connection failed" });
	}
});

const priorityTasksRouter = require("./routes/priorityTasks");
const highPriorityProjectsRouter = require("./routes/highPriorityProjects");
const warRoomRouter = require("./routes/warRoom");

app.use("/api/priority-tasks", priorityTasksRouter);
app.use("/api/high-priority-projects", highPriorityProjectsRouter);
app.use("/api/war-room", warRoomRouter);

app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).json({ error: "Something went wrong!" });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});

process.on("SIGINT", async () => {
	await closeConnection();
	server.close(() => {
		console.log("Server closed");
		process.exit(0);
	});
});

module.exports = app;
