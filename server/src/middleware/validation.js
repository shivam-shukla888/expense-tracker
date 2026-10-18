import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name cannot exceed 100 characters'),
  email: z.string().trim().email('Invalid email address').toLowerCase().max(255),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password cannot exceed 128 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
});

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required')
});

export const transactionCreateSchema = z.object({
  type: z.enum(['income', 'expense'], {
    errorMap: () => ({ message: "Type must be either 'income' or 'expense'" })
  }),
  category: z.string().trim().min(1, 'Category is required').max(50),
  amount: z.coerce
    .number({ invalid_type_error: 'Amount must be a valid number' })
    .positive('Amount must be greater than zero')
    .max(1000000000, 'Amount cannot exceed ₹1,000,000,000'),
  description: z.string().trim().min(1, 'Description is required').max(255, 'Description cannot exceed 255 characters'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
});

export const transactionUpdateSchema = transactionCreateSchema.partial().refine(
  data => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
);

export const transactionQuerySchema = z.object({
  type: z.enum(['income', 'expense']).optional(),
  category: z.string().trim().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD').optional(),
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(15),
  sortBy: z.enum(['date', 'amount', 'category', 'created_at']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

export function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      const dataToValidate = req[source];
      const parsed = schema.parse(dataToValidate);
      req[source] = parsed;
      next();
    } catch (err) {
      next(err);
    }
  };
}
