require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { connectToDatabase, closeConnection } = require("./config/db");

const app = express();

// Enhanced middleware setup
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Environment-specific middleware
if (process.env.NODE_ENV === "production") {
	app.use(helmet());
	app.use(morgan("combined"));
} else {
	app.use(morgan("dev"));
}

// Routes
const priorityTasksRouter = require("./routes/priorityTasks");
const highPriorityProjectsRouter = require("./routes/highPriorityProjects");
const warRoomRouter = require("./routes/warRoom");

app.use("/api/priority-tasks", priorityTasksRouter);
app.use("/api/high-priority-projects", highPriorityProjectsRouter);
app.use("/api/war-room", warRoomRouter);

// Health check endpoint (required for Railway)
app.get("/health", (req, res) => {
	res.status(200).json({
		status: "healthy",
		timestamp: new Date().toISOString(),
		environment: process.env.NODE_ENV,
	});
});

// Error handling
app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).json({
		error: "Internal Server Error",
		message: process.env.NODE_ENV === "development" ? err.message : undefined,
	});
});

// Server startup
const startServer = async () => {
	try {
		await connectToDatabase();
		console.log("Successfully connected to MongoDB!");

		const PORT = process.env.PORT || 5000;
		const server = app.listen(PORT, () => {
			console.log(`Server running on port ${PORT}`);
			console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
		});

		// Graceful shutdown
		const shutdown = async () => {
			console.log("Shutting down gracefully...");
			await closeConnection();
			server.close(() => {
				console.log("Server closed");
				process.exit(0);
			});
		};

		process.on("SIGTERM", shutdown);
		process.on("SIGINT", shutdown);
	} catch (err) {
		console.error("Failed to start server:", err);
		process.exit(1);
	}
};

startServer();

module.exports = app;
