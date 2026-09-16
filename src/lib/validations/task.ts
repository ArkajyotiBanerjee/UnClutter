import { z } from "zod";

export const PriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH"]);

const isoOrDateString = z
  .string()
  .refine(
    (val) => {
      const parsed = Date.parse(val);
      return !isNaN(parsed);
    },
    { message: "Invalid date string for dueDate" }
  )
  .transform((val) => new Date(val));

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255, "Title is too long"),
  description: z.string().trim().max(5000, "Description is too long").nullable().optional(),
  completed: z.boolean().optional(),
  priority: PriorityEnum.optional().default("MEDIUM"),
  dueDate: z.union([isoOrDateString, z.null()]).optional(),
});

export const updateTaskSchema = z
  .object({
    title: z.string().trim().min(1, "Title cannot be empty").max(255, "Title is too long").optional(),
    description: z.string().trim().max(5000, "Description is too long").nullable().optional(),
    completed: z.boolean().optional(),
    priority: PriorityEnum.optional(),
    dueDate: z.union([isoOrDateString, z.null()]).optional(),
  })
  .strict();

export type CreateTaskInput = z.output<typeof createTaskSchema>;
export type UpdateTaskInput = z.output<typeof updateTaskSchema>;
