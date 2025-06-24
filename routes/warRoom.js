const express = require("express");
const router = express.Router();
const {
	getAllIncidents,
	getIncidentById,
	createIncident,
	updateIncident,
	deleteIncident,
} = require("../controllers/warRoom");

router.get("/", getAllIncidents);
router.get("/:id", getIncidentById);
router.post("/", createIncident);
router.put("/:id", updateIncident);
router.delete("/:id", deleteIncident);

module.exports = router;
