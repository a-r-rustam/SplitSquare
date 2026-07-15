const express = require("express");
const router = express.Router();
const {
  createGroup,
  getMyGroups,
  getGroupById,
  addMember,
  removeMember,
  deleteGroup,
} = require("../controllers/groupController");
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { createGroupSchema, addMemberSchema } = require("../utils/schemas/groupSchemas");

// every route below requires a logged-in user
router.use(protect);

router.post("/", validate(createGroupSchema), createGroup);
router.get("/", getMyGroups);
router.get("/:id", getGroupById);
router.post("/:id/members", validate(addMemberSchema), addMember);
router.delete("/:id/members/:userId", removeMember);
router.delete("/:id", deleteGroup);

module.exports = router;