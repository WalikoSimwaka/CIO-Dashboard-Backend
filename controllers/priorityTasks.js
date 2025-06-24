const PriorityTask = require("../models/priorityTask");

exports.getAllTasks = async (req, res) => {
	try {
		const tasks = await PriorityTask.getAll();
		res.json(tasks);
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Failed to fetch priority tasks" });
	}
};

exports.getTaskById = async (req, res) => {
	try {
		const task = await PriorityTask.getById(req.params.id);
		if (!task) {
			return res.status(404).json({ error: "Task not found" });
		}
		res.json(task);
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Failed to fetch task" });
	}
};

exports.createTask = async (req, res) => {
	try {
		const { title, priority, due_date, completed } = req.body;
		if (!title || !priority) {
			return res.status(400).json({ error: "Title and priority are required" });
		}
		const newTask = await PriorityTask.create({
			title,
			priority,
			due_date,
			completed,
		});
		res.status(201).json(newTask);
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Failed to create task" });
	}
};

exports.updateTask = async (req, res) => {
	try {
		const { title, priority, due_date, completed } = req.body;
		const updatedTask = await PriorityTask.update(req.params.id, {
			title,
			priority,
			due_date,
			completed,
		});
		if (!updatedTask) {
			return res.status(404).json({ error: "Task not found" });
		}
		res.json(updatedTask);
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Failed to update task" });
	}
};

exports.deleteTask = async (req, res) => {
	try {
		const deletedTask = await PriorityTask.delete(req.params.id);
		if (!deletedTask) {
			return res.status(404).json({ error: "Task not found" });
		}
		res.json({ message: "Task deleted successfully" });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Failed to delete task" });
	}
};
