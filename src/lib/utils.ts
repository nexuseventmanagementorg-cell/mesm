import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number, currency = "PKR"): string {
  return `${currency} ${amount.toLocaleString("en-PK")}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function generateSKU(categoryPrefix = "MG", name = ""): string {
  const letters = name
    .replace(/[^a-zA-Z]/g, "")
    .slice(0, 3)
    .toUpperCase() || "GEM";
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${categoryPrefix}-${letters}-${randomNum}`;
}

export function generateOrderNumber(): string {
  const timestamp = Date.now().toString().slice(-4);
  const random = Math.floor(100 + Math.random() * 900);
  return `MG-${timestamp}${random}`;
}

export function formatPakistaniPhone(phone: string): string {
  // Cleans phone and ensures standard format (e.g., 03001234567 or 923001234567)
  let cleaned = phone.replace(/[^0-9+]/g, "");
  if (cleaned.startsWith("+92")) {
    cleaned = "0" + cleaned.slice(3);
  } else if (cleaned.startsWith("92")) {
    cleaned = "0" + cleaned.slice(2);
  }
  return cleaned;
}

export function toWhatsAppPhone(phone: string): string {
  let cleaned = phone.replace(/[^0-9]/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "92" + cleaned.slice(1);
  }
  return cleaned;
}
