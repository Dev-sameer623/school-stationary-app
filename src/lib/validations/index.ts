import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(80),
  description: z.string().trim().max(300).optional().or(z.literal("")),
});

const sizeSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  size: z.string().trim().min(1, "Size is required.").max(20),
  price: z.coerce.number().min(0, "Price must be 0 or more."),
  discountPercent: z.coerce
    .number()
    .int("Discount must be a whole number.")
    .min(0, "Discount must be 0 or more.")
    .max(100, "Discount cannot be more than 100."),
  stockQuantity: z.coerce.number().int().min(0, "Stock must be 0 or more."),
  minimumStock: z.coerce.number().int().min(0, "Minimum stock must be 0 or more."),
});

export const productSchema = z
  .object({
    sku: z.string().trim().min(1, "SKU is required.").max(40),
    name: z.string().trim().min(1, "Name is required.").max(120),
    description: z.string().trim().max(1000).optional().or(z.literal("")),
    categoryId: z.string().uuid("Choose a category."),
    kind: z.enum(["STATIONERY", "UNIFORM"]),
    price: z.coerce.number().min(0, "Price must be 0 or more."),
    discountPercent: z.coerce
      .number()
      .int("Discount must be a whole number.")
      .min(0, "Discount must be 0 or more.")
      .max(100, "Discount cannot be more than 100."),
    stockQuantity: z.coerce.number().int().min(0, "Stock must be 0 or more."),
    minimumStock: z.coerce.number().int().min(0, "Minimum stock must be 0 or more."),
    status: z.enum(["ACTIVE", "INACTIVE"]),
    sizes: z.array(sizeSchema).default([]),
  })
  .superRefine((value, ctx) => {
    if (value.kind === "STATIONERY") return;
    if (value.sizes.length === 0) {
      ctx.addIssue({ code: "custom", path: ["sizes"], message: "Add at least one size." });
    }
    const seen = new Set<string>();
    value.sizes.forEach((size, index) => {
      const key = size.size.toLowerCase();
      if (seen.has(key)) {
        ctx.addIssue({
          code: "custom",
          path: ["sizes", index, "size"],
          message: "Each size can only be added once.",
        });
      }
      seen.add(key);
    });
  });

export const productUpdateSchema = productSchema;

export const customerSignupSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(120),
  phone: z.string().trim().min(6, "Enter a phone number.").max(20),
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export const customerSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(120),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address.")
    .optional()
    .or(z.literal("")),
  address: z.string().trim().max(300).optional().or(z.literal("")),
});

export const userSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(120),
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  role: z.enum(["ADMIN", "MANAGER"]),
});

export const userUpdateSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(120),
  role: z.enum(["ADMIN", "MANAGER"]),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .optional()
    .or(z.literal("")),
});

export const stockChangeSchema = z
  .object({
    productId: z.string().uuid(),
    productSizeId: z.string().uuid().optional().or(z.literal("")),
    type: z.enum(["IN", "OUT", "ADJUSTMENT"]),
    quantity: z.coerce.number().int("Quantity must be a whole number."),
    reason: z.string().trim().min(1, "A reason is required.").max(200),
  })
  .superRefine((value, ctx) => {
    if (value.type === "ADJUSTMENT" && value.quantity < 0) {
      ctx.addIssue({
        code: "custom",
        path: ["quantity"],
        message: "Stock cannot go below zero.",
      });
    }
    if (value.type !== "ADJUSTMENT" && value.quantity < 1) {
      ctx.addIssue({
        code: "custom",
        path: ["quantity"],
        message: "Quantity must be at least 1.",
      });
    }
  });

export const couponSchema = z
  .object({
    code: z.string().trim().min(1, "Code is required.").max(40),
    percent: z.coerce
      .number()
      .int("Percentage must be a whole number.")
      .min(1, "Percentage must be at least 1.")
      .max(100, "Percentage cannot be more than 100."),
    status: z.enum(["ACTIVE", "INACTIVE"]),
    startsAt: z.string().optional().or(z.literal("")),
    endsAt: z.string().optional().or(z.literal("")),
  })
  .superRefine((value, ctx) => {
    if (value.startsAt && value.endsAt && value.endsAt < value.startsAt) {
      ctx.addIssue({
        code: "custom",
        path: ["endsAt"],
        message: "End date must be on or after the start date.",
      });
    }
  });

const orderItemList = z
  .array(
    z.object({
      productId: z.string().uuid("Choose a product."),
      productSizeId: z.string().uuid().optional().or(z.literal("")),
      quantity: z.coerce.number().int("Quantity must be a whole number.").min(1, "Quantity must be at least 1."),
    }),
  )
  .min(1, "Add at least one product.");

export const orderSchema = z.object({
  customerId: z.string().uuid("Choose a customer."),
  couponCode: z.string().trim().max(40).optional().or(z.literal("")),
  items: orderItemList,
});

export const onlineOrderSchema = z.object({
  pickupNote: z.string().trim().max(300).optional().or(z.literal("")),
  couponCode: z.string().trim().max(40).optional().or(z.literal("")),
  items: orderItemList,
});

export const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(1, "Confirm the new password."),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export const profileSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(120),
});

export function fieldErrors(error: z.ZodError) {
  const errors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    errors[key] = [...(errors[key] ?? []), issue.message];
  }
  return errors;
}

export type ProductInput = z.infer<typeof productSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type CustomerInput = z.infer<typeof customerSchema>;
export type CustomerSignupInput = z.infer<typeof customerSignupSchema>;
export type OnlineOrderInput = z.infer<typeof onlineOrderSchema>;
export type UserInput = z.infer<typeof userSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
export type StockChangeInput = z.infer<typeof stockChangeSchema>;
export type OrderInput = z.infer<typeof orderSchema>;
export type CouponInput = z.infer<typeof couponSchema>;
