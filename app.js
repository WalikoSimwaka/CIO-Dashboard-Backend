require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { connectToDatabase, closeConnection } = require("./config/db");

console.log("\n=== Starting Server Initialization ===");
console.log("Environment:", {
	NODE_ENV: process.env.NODE_ENV || "development",
	PORT: process.env.PORT,
	MONGODB_URI: process.env.MONGODB_URI ? "*****" : "MISSING - REQUIRED",
});

const app = express();
let server;
let isShuttingDown = false;

const allowedOrigins = ["https://cio-dashboard-production-b590.up.railway.app"];

if (process.env.NODE_ENV === "development") {
	allowedOrigins.push("http://localhost:3000");
}

app.use(
	cors({
		origin: function (origin, callback) {
			if (!origin || allowedOrigins.includes(origin)) {
				callback(null, true);
			} else {
				callback(new Error("Not allowed by CORS"));
			}
		},
		methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization"],
		credentials: true,
	})
);
app.options("*", cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

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
				maxAge: 63072000,
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

// Health check
app.get("/health", (req, res) => {
	if (isShuttingDown) {
		return res.status(503).json({
			status: "shutting_down",
			message: "Service is shutting down",
			timestamp: new Date().toISOString(),
		});
	}
	res.status(200).json({
		status: "healthy",
		timestamp: new Date().toISOString(),
		uptime: process.uptime(),
	});
});

// 404 handler
app.use((req, res) => {
	res.status(404).json({
		error: "Not Found",
		path: req.path,
		method: req.method,
		timestamp: new Date().toISOString(),
	});
});

// Error handler
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

const gracefulShutdown = async (signal) => {
	if (isShuttingDown) return;
	isShuttingDown = true;

	console.log(`\nReceived ${signal}, initiating graceful shutdown...`);
	console.log(`Current uptime: ${process.uptime()} seconds`);

	try {
		if (typeof closeConnection === "function") {
			console.log("Closing database connection...");
			await closeConnection();
			console.log("Database connection closed successfully");
		}

		if (server) {
			console.log("Closing HTTP server...");
			server.close(() => {
				console.log("HTTP server closed successfully");
				process.exit(0);
			});
			setTimeout(() => {
				console.error("Forced shutdown after timeout");
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

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("uncaughtException", (err) => {
	console.error("Uncaught Exception:", err);
	gracefulShutdown("uncaughtException");
});
process.on("unhandledRejection", (reason, promise) => {
	console.error("Unhandled Rejection at:", promise, "reason:", reason);
	gracefulShutdown("unhandledRejection");
});

// Start server
const startServer = async () => {
	try {
		console.log("\nConnecting to MongoDB...");
		const db = await connectToDatabase();
		await db.command({ ping: 1 });
		console.log("✓ MongoDB connected successfully");

		const PORT = process.env.PORT;

		if (!PORT) {
			console.error("❌ PORT environment variable is not defined");
			process.exit(1);
		}

		server = app.listen(PORT, () => {
			console.log(`\n✓ Server running on port ${PORT}`);
			console.log(`✓ Environment: ${process.env.NODE_ENV || "development"}`);
			console.log("✓ Ready to accept connections");
			console.log(`→ Health check: http://localhost:${PORT}/health`);
		});

		server.keepAliveTimeout = 60000;
		server.headersTimeout = 65000;

		if (process.env.NODE_ENV === "production") {
			setInterval(() => {
				console.log("[Keep-alive] Server heartbeat", new Date().toISOString());
			}, 30000);
		}
	} catch (err) {
		console.error("\n!!! Failed to start server !!!");
		console.error(err);
		process.exit(1);
	}
};

startServer();

module.exports = app;
