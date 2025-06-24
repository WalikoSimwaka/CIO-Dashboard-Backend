const HighPriorityProject = require("../models/highPriorityProject");
const { ObjectId } = require("mongodb");

exports.getAllProjects = async (req, res) => {
	try {
		const projects = await HighPriorityProject.getAll();
		res.json(projects);
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Failed to fetch high priority projects" });
	}
};

exports.createProject = async (req, res) => {
	try {
		const { name, start_date, due_date, status, responsible } = req.body;
		if (!name || !start_date || !due_date || !status || !responsible) {
			return res.status(400).json({ error: "All fields are required" });
		}
		const newProject = await HighPriorityProject.create({
			name,
			start_date,
			due_date,
			status,
			responsible,
		});
		res.status(201).json(newProject);
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Failed to create project" });
	}
};

exports.updateProject = async (req, res) => {
	try {
		const { name, start_date, due_date, status, responsible } = req.body;
		const updatedProject = await HighPriorityProject.update(req.params.id, {
			name,
			start_date,
			due_date,
			status,
			responsible,
		});
		if (!updatedProject) {
			return res.status(404).json({ error: "Project not found" });
		}
		res.json(updatedProject);
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Failed to update project" });
	}
};

exports.deleteProject = async (req, res) => {
	try {
		const deletedProject = await HighPriorityProject.delete(req.params.id);
		if (!deletedProject) {
			return res.status(404).json({ error: "Project not found" });
		}
		res.json({ message: "Project deleted successfully" });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Failed to delete project" });
	}
};
