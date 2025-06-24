const Incident = require("../models/incident");

exports.getAllIncidents = async (req, res) => {
	try {
		const incidents = await Incident.getAll();
		res.json(incidents);
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Failed to fetch incidents" });
	}
};

exports.getIncidentById = async (req, res) => {
	try {
		const incident = await Incident.getById(req.params.id);
		if (!incident) {
			return res.status(404).json({ error: "Incident not found" });
		}
		res.json(incident);
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Failed to fetch incident" });
	}
};

exports.createIncident = async (req, res) => {
	try {
		const { title, description, status, due_date, priority, assignees } =
			req.body;
		if (!title || !description || !priority) {
			return res
				.status(400)
				.json({ error: "Title, description and priority are required" });
		}
		const timestamp = new Date().toISOString();
		const newIncident = await Incident.create({
			title,
			description,
			status: status || "New",
			due_date,
			priority,
			assignees: assignees || ["Unassigned"],
			timestamp,
		});
		res.status(201).json(newIncident);
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Failed to create incident" });
	}
};

exports.updateIncident = async (req, res) => {
	try {
		const { title, description, status, due_date, priority, assignees } =
			req.body;
		const updatedIncident = await Incident.update(req.params.id, {
			title,
			description,
			status,
			due_date,
			priority,
			assignees,
		});
		if (!updatedIncident) {
			return res.status(404).json({ error: "Incident not found" });
		}
		res.json(updatedIncident);
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Failed to update incident" });
	}
};

exports.deleteIncident = async (req, res) => {
	try {
		const deletedIncident = await Incident.delete(req.params.id);
		if (!deletedIncident) {
			return res.status(404).json({ error: "Incident not found" });
		}
		res.json({ message: "Incident deleted successfully" });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Failed to delete incident" });
	}
};
