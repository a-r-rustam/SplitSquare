const Group = require("../models/Group");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { AppError } = require("../middleware/errorHandler");

// @route POST /api/groups
// Creates a new group. The creator is automatically added as the first member.
const createGroup = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  const group = await Group.create({
    name,
    description,
    createdBy: req.user._id,
    members: [req.user._id],
  });

  // also track this group on the user's own record for quick lookups
  await User.findByIdAndUpdate(req.user._id, { $addToSet: { groups: group._id } });

  res.status(201).json({ success: true, group });
});

// @route GET /api/groups
// Returns all groups the logged-in user is a member of, with pagination.
const getMyGroups = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = { members: req.user._id };

  // optional search by group name: /api/groups?search=trip
  if (req.query.search) {
    filter.name = { $regex: req.query.search, $options: "i" };
  }

  const [groups, total] = await Promise.all([
    Group.find(filter)
      .populate("members", "name email avatarUrl")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Group.countDocuments(filter),
  ]);

  res.json({
    success: true,
    groups,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    },
  });
});

// @route GET /api/groups/:id
// Returns a single group's details — only if the requester is a member.
const getGroupById = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.id)
    .populate("members", "name email avatarUrl")
    .populate("createdBy", "name email");

  if (!group) throw new AppError("Group not found", 404);

  const isMember = group.members.some((m) => m._id.toString() === req.user._id.toString());
  if (!isMember) throw new AppError("You are not a member of this group", 403);

  res.json({ success: true, group });
});

// @route POST /api/groups/:id/members
// Adds a member to the group by their email. Only existing members can add others.
const addMember = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.id);
  if (!group) throw new AppError("Group not found", 404);

  const isMember = group.members.some((m) => m.toString() === req.user._id.toString());
  if (!isMember) throw new AppError("You are not a member of this group", 403);

  const userToAdd = await User.findOne({ email: req.body.email });
  if (!userToAdd) throw new AppError("No user found with that email", 404);

  const alreadyMember = group.members.some((m) => m.toString() === userToAdd._id.toString());
  if (alreadyMember) throw new AppError("User is already a member of this group", 400);

  group.members.push(userToAdd._id);
  await group.save();
  await User.findByIdAndUpdate(userToAdd._id, { $addToSet: { groups: group._id } });

  const updatedGroup = await Group.findById(group._id).populate("members", "name email avatarUrl");
  res.json({ success: true, group: updatedGroup });
});

// @route DELETE /api/groups/:id/members/:userId
// Removes a member from the group. Only the group creator can remove others;
// anyone can remove themselves (leave the group).
const removeMember = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.id);
  if (!group) throw new AppError("Group not found", 404);

  const isCreator = group.createdBy.toString() === req.user._id.toString();
  const isSelf = req.params.userId === req.user._id.toString();

  if (!isCreator && !isSelf) {
    throw new AppError("Only the group creator can remove other members", 403);
  }

  group.members = group.members.filter((m) => m.toString() !== req.params.userId);
  await group.save();
  await User.findByIdAndUpdate(req.params.userId, { $pull: { groups: group._id } });

  res.json({ success: true, message: "Member removed", group });
});

// @route DELETE /api/groups/:id
// Deletes a group entirely. Only the creator can do this.
const deleteGroup = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.id);
  if (!group) throw new AppError("Group not found", 404);

  if (group.createdBy.toString() !== req.user._id.toString()) {
    throw new AppError("Only the group creator can delete this group", 403);
  }

  await Group.findByIdAndDelete(req.params.id);
  await User.updateMany({ groups: group._id }, { $pull: { groups: group._id } });

  res.json({ success: true, message: "Group deleted" });
});

module.exports = {
  createGroup,
  getMyGroups,
  getGroupById,
  addMember,
  removeMember,
  deleteGroup,
};
