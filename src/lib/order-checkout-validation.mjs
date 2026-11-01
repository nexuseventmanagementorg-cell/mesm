import { z } from "zod";

export const checkoutOrderSchema = z
  .object({
    customerName: z.string().trim().min(1).max(100),
    customerPhone: z
      .string()
      .trim()
      .max(32)
      .refine((phone) => phone.replace(/\D/g, "").length >= 10),
    customerEmail: z.string().trim().email().max(254).optional(),
    customerCity: z.string().trim().min(1).max(100),
    deliveryAddress: z.string().trim().min(1).max(500),
    deliveryInstructions: z.string().trim().max(500).optional(),
    giftMessage: z.string().trim().max(500).optional(),
    paymentProofUrl: z.string().max(2048).optional(),
    items: z
      .array(
        z
          .object({
            productId: z.string().trim().min(1).max(128),
            variationText: z.string().trim().max(300).optional(),
            quantity: z.number().int().min(1).max(99),
          })
          .strict()
      )
      .min(1)
      .max(50),
    paymentMethod: z.enum(["easypaisa", "jazzcash", "cod", "bank_transfer"]),
  })
  .strict();
