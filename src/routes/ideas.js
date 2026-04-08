const express = require("express");
const router = express.Router();
const ideasController = require("../controllers/ideasController");

router.post("/", ideasController.createIdea);
router.get("/", ideasController.listIdeas);
router.get("/:id", ideasController.getIdea);
router.delete("/:id", ideasController.deleteIdea);
router.post("/:id/retry", ideasController.retryAnalysis);

module.exports = router;
