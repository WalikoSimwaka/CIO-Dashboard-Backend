require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { connectToDatabase, closeConnection } = require("./config/db");

// Debugging setup
console.log("Starting server initialization...");
console.log("Environment variables loaded:", {
	NODE_ENV: process.env.NODE_ENV,
	PORT: process.env.PORT,
	MONGODB_URI: process.env.MONGODB_URI ? "*****" : "MISSING",
});

const app = express();

// Enhanced middleware setup
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Environment-specific middleware
if (process.env.NODE_ENV === "production") {
	app.use(helmet());
	app.use(morgan("combined"));
	console.log("Production security middleware enabled");
} else {
	app.use(morgan("dev"));
	console.log("Development logging enabled");
}

// Routes
const priorityTasksRouter = require("./routes/priorityTasks");
const highPriorityProjectsRouter = require("./routes/highPriorityProjects");
const warRoomRouter = require("./routes/warRoom");

app.use("/api/priority-tasks", priorityTasksRouter);
app.use("/api/high-priority-projects", highPriorityProjectsRouter);
app.use("/api/war-room", warRoomRouter);
console.log("Routes initialized");

// Enhanced health check endpoint
app.get("/health", async (req, res) => {
	try {
		const db = await connectToDatabase();
		await db.command({ ping: 1 });

		res.status(200).json({
			status: "healthy",
			timestamp: new Date().toISOString(),
			environment: process.env.NODE_ENV,
			uptime: process.uptime(),
			database: "connected",
		});
	} catch (err) {
		console.error("Health check failed:", err);
		res.status(503).json({
			status: "unhealthy",
			error: "Database connection failed",
			details: process.env.NODE_ENV === "development" ? err.message : undefined,
		});
	}
});

// 404 Handler
app.use((req, res) => {
	res.status(404).json({ error: "Not Found" });
});

// Enhanced Error handling
app.use((err, req, res, next) => {
	console.error("Unhandled error:", err.stack);
	res.status(500).json({
		error: "Internal Server Error",
		message: process.env.NODE_ENV === "development" ? err.message : undefined,
		timestamp: new Date().toISOString(),
	});
});

// Server startup with enhanced stability
const startServer = async () => {
	try {
		console.log("Attempting database connection...");
		const db = await connectToDatabase();
		await db.command({ ping: 1 });
		console.log("Successfully connected to MongoDB!");

		const PORT = process.env.PORT || 5000;
		const server = app.listen(PORT, () => {
			console.log(`Server running on port ${PORT}`);
			console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
			console.log("Server startup complete - ready for connections");
		});

		// Enhanced graceful shutdown
		const shutdown = async (signal) => {
			console.log(`Received ${signal}, starting graceful shutdown...`);
			try {
				await closeConnection();
				console.log("Database connection closed");

				server.close(() => {
					console.log("HTTP server closed");
					process.exit(0);
				});

				// Force shutdown if it takes too long
				setTimeout(() => {
					console.error(
						"Could not close connections in time, forcefully shutting down"
					);
					process.exit(1);
				}, 5000);
			} catch (err) {
				console.error("Error during shutdown:", err);
				process.exit(1);
			}
		};

		// Process handlers
		process.on("SIGTERM", () => shutdown("SIGTERM")); // Railway's stop signal
		process.on("SIGINT", () => shutdown("SIGINT")); // Ctrl-C
		process.on("uncaughtException", (err) => {
			console.error("Uncaught Exception:", err);
			shutdown("uncaughtException");
		});
		process.on("unhandledRejection", (reason, promise) => {
			console.error("Unhandled Rejection at:", promise, "reason:", reason);
			shutdown("unhandledRejection");
		});

		// Keep-alive handler for Railway
		setInterval(() => {
			console.log("Keep-alive ping", new Date().toISOString());
		}, 30000); // Every 30 seconds
	} catch (err) {
		console.error("Fatal startup error:", err);
		process.exit(1);
	}
};

startServer();

module.exports = app;
