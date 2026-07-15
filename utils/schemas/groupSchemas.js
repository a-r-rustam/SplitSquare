const { z } = require("zod");

const createGroupSchema = z.object({
  name: z.string().trim().min(2, "Group name must be at least 2 characters"),
  description: z.string().trim().optional(),
});

const addMemberSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
});

module.exports = { createGroupSchema, addMemberSchema };
