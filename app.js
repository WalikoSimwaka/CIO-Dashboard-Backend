require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { connectToDatabase, closeConnection } = require("./config/db");

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

// Test database connection endpoint
app.get("/test-db", async (req, res) => {
	try {
		const db = await connectToDatabase();
		await db.command({ ping: 1 });
		res.json({ success: true, message: "MongoDB connection successful" });
	} catch (err) {
		console.error("Database connection test failed:", err);
		res.status(500).json({
			success: false,
			error: "Database connection failed",
			details: process.env.NODE_ENV === "development" ? err.message : undefined,
		});
	}
});

// Routes
const priorityTasksRouter = require("./routes/priorityTasks");
const highPriorityProjectsRouter = require("./routes/highPriorityProjects");
const warRoomRouter = require("./routes/warRoom");

app.use("/api/priority-tasks", priorityTasksRouter);
app.use("/api/high-priority-projects", highPriorityProjectsRouter);
app.use("/api/war-room", warRoomRouter);

// Health check endpoint
app.get("/health", (req, res) => {
	res.status(200).json({
		status: "healthy",
		timestamp: new Date().toISOString(),
	});
});

// 404 Handler
app.use((req, res) => {
	res.status(404).json({ error: "Not Found" });
});

// Error Handler
app.use((err, req, res, next) => {
	console.error("Unhandled error:", err.stack);
	res.status(500).json({
		error: "Internal Server Error",
		...(process.env.NODE_ENV === "development" && { details: err.message }),
	});
});

// Graceful shutdown handler
const shutdown = async (server) => {
	console.log("Starting graceful shutdown...");

	try {
		await closeConnection();
		console.log("Database connection closed");

		server.close(() => {
			console.log("HTTP server closed");
			process.exit(0);
		});

		// Force close if shutdown takes too long
		setTimeout(() => {
			console.error("Forcing shutdown after timeout");
			process.exit(1);
		}, 5000);
	} catch (err) {
		console.error("Error during shutdown:", err);
		process.exit(1);
	}
};

// Server initialization
const startServer = async () => {
	try {
		// Test database connection immediately
		await connectToDatabase();
		console.log("Database connection established");

		const PORT = process.env.PORT || 5000;
		const server = app.listen(PORT, () => {
			console.log(`Server running on port ${PORT}`);
			console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
		});

		// Handle shutdown signals
		process.on("SIGINT", () => shutdown(server));
		process.on("SIGTERM", () => shutdown(server));

		// Handle uncaught exceptions and rejections
		process.on("uncaughtException", (err) => {
			console.error("Uncaught Exception:", err);
			shutdown(server);
		});

		process.on("unhandledRejection", (reason, promise) => {
			console.error("Unhandled Rejection at:", promise, "reason:", reason);
			shutdown(server);
		});
	} catch (err) {
		console.error("Failed to start server:", err);
		process.exit(1);
	}
};

// Start the server
startServer();

module.exports = app;
