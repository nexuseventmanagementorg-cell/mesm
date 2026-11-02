import type { Order } from "../types";

export interface CustomerMessagePlan {
  category: "order_received" | "order_status" | "payment_status" | "payment_receipt";
  cycleStart: string;
  key: string;
  label: string;
  message: string;
  dueAt: string | null;
  canSend: boolean;
  reason: string;
}

export const MAX_CUSTOMER_MESSAGES_PER_24_HOURS: number;
export function getCustomerMessageOptions(
  order: Order,
  now?: number,
  orderManageUrl?: string
): CustomerMessagePlan[];
export function buildCustomerMessage(order: Order, templateKey: string, orderManageUrl?: string): string;
