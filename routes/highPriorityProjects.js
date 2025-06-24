const express = require("express");
const router = express.Router();
const {
	getAllProjects,
	createProject,
	updateProject,
	deleteProject,
} = require("../controllers/highPriorityProjects");

router.get("/", getAllProjects);
router.post("/", createProject);
router.put("/:id", updateProject);
router.delete("/:id", deleteProject);

module.exports = router;
