require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { connectToDatabase, closeConnection } = require("./config/db");

// Debugging setup
console.log("\n=== Starting Server Initialization ===");
console.log("Environment:", {
	NODE_ENV: process.env.NODE_ENV || "development",
	PORT: process.env.PORT || "5000 (default)",
	MONGODB_URI: process.env.MONGODB_URI ? "*****" : "MISSING - REQUIRED",
});

const app = express();
let server; // Declare server variable at the top level
let isShuttingDown = false;

// Enhanced middleware setup
app.use(
	cors({
		origin:
			process.env.NODE_ENV === "production"
				? process.env.CORS_ORIGIN || "https://*.up.railway.app"
				: "*",
	})
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Security headers for production
if (process.env.NODE_ENV === "production") {
	app.use(
		helmet({
			contentSecurityPolicy: {
				directives: {
					defaultSrc: ["'self'"],
					scriptSrc: ["'self'", "'unsafe-inline'"],
					styleSrc: ["'self'", "'unsafe-inline'"],
					imgSrc: ["'self'", "data:", "https://*.railway.app"],
				},
			},
			hsts: {
				maxAge: 63072000, // 2 years in seconds
				includeSubDomains: true,
				preload: true,
			},
		})
	);
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

// Enhanced Railway-compatible health check
app.get("/health", async (req, res) => {
	if (isShuttingDown) {
		return res.status(503).json({
			status: "shutting_down",
			message: "Service is shutting down",
			timestamp: new Date().toISOString(),
		});
	}

	try {
		// Verify database connection
		const db = await connectToDatabase();
		await db.command({ ping: 1 });

		res.status(200).json({
			status: "healthy",
			timestamp: new Date().toISOString(),
			uptime: process.uptime(),
			database: "connected",
			environment: process.env.NODE_ENV || "development",
		});
	} catch (err) {
		console.error("Health check failed:", err);
		res.status(503).json({
			status: "unhealthy",
			error: "Database connection failed",
			timestamp: new Date().toISOString(),
		});
	}
});

// 404 Handler
app.use((req, res) => {
	res.status(404).json({
		error: "Not Found",
		path: req.path,
		method: req.method,
		timestamp: new Date().toISOString(),
	});
});

// Error handling middleware
app.use((err, req, res, next) => {
	console.error("Error:", {
		message: err.message,
		stack: err.stack,
		path: req.path,
		method: req.method,
	});

	res.status(500).json({
		error: "Internal Server Error",
		message: process.env.NODE_ENV === "development" ? err.message : undefined,
		timestamp: new Date().toISOString(),
	});
});

// Enhanced graceful shutdown handler
const gracefulShutdown = async (signal) => {
	if (isShuttingDown) return;
	isShuttingDown = true;

	console.log(`\nReceived ${signal}, initiating graceful shutdown...`);
	console.log(`Current uptime: ${process.uptime()} seconds`);

	try {
		// Close database connection if available
		if (typeof closeConnection === "function") {
			console.log("Closing database connection...");
			await closeConnection();
			console.log("Database connection closed successfully");
		}

		// Close HTTP server if available
		if (server) {
			console.log("Closing HTTP server...");
			server.close(() => {
				console.log("HTTP server closed successfully");
				process.exit(0);
			});

			// Force shutdown after timeout
			setTimeout(() => {
				console.error(
					"Could not close gracefully within 10 seconds, forcing shutdown"
				);
				process.exit(1);
			}, 10000);
		} else {
			console.log("No HTTP server instance found");
			process.exit(0);
		}
	} catch (err) {
		console.error("Error during shutdown:", err);
		process.exit(1);
	}
};

// Process event handlers
process.on("SIGTERM", () => gracefulShutdown("SIGTERM")); // Railway's stop signal
process.on("SIGINT", () => gracefulShutdown("SIGINT")); // Ctrl-C
process.on("uncaughtException", (err) => {
	console.error("Uncaught Exception:", err);
	gracefulShutdown("uncaughtException");
});
process.on("unhandledRejection", (reason, promise) => {
	console.error("Unhandled Rejection at:", promise, "reason:", reason);
	gracefulShutdown("unhandledRejection");
});

// Server initialization
const startServer = async () => {
	try {
		console.log("\nConnecting to MongoDB...");
		const db = await connectToDatabase();
		await db.command({ ping: 1 });
		console.log("✓ MongoDB connected successfully");

		const PORT = process.env.PORT || 5000;
		server = app.listen(PORT, () => {
			console.log(`\n✓ Server running on port ${PORT}`);
			console.log(`✓ Environment: ${process.env.NODE_ENV || "development"}`);
			console.log("✓ Ready to accept connections");
			console.log(`→ Health check: http://localhost:${PORT}/health`);

			// Railway-specific keep-alive logging
			if (process.env.NODE_ENV === "production") {
				setInterval(() => {
					console.log(
						"[Keep-alive] Server heartbeat",
						new Date().toISOString()
					);
				}, 30000); // Every 30 seconds
			}
		});

		// Railway-specific server timeouts
		server.keepAliveTimeout = 60000; // 60 seconds
		server.headersTimeout = 65000; // 65 seconds
	} catch (err) {
		console.error("\n!!! Failed to start server !!!");
		console.error(err);
		process.exit(1);
	}
};

// Start the server
startServer();

module.exports = app;
