import { z } from 'zod'

export const TaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  rawText: z.string().min(1),
  dueDate: z.string().datetime().nullable(),
  tags: z.array(z.string()).default([]),
  priority: z.number().min(1).max(5).default(3),
  status: z.enum(['todo', 'doing', 'completed']).default('todo'),
  createdAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
  scheduledFor: z.enum(['today', 'tomorrow']).optional()
}) 