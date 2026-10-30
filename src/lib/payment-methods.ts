import { PaymentMethod, StoreSettings } from "@/types";

export function isPaymentMethodAvailable(
  method: string,
  settings: StoreSettings | null
): method is PaymentMethod {
  if (!settings) return false;

  switch (method) {
    case "easypaisa":
      return settings.easypaisaEnabled && Boolean(settings.easypaisaNumber.trim());
    case "jazzcash":
      return settings.jazzcashEnabled && Boolean(settings.jazzcashNumber.trim());
    case "bank_transfer":
      return settings.bankTransferEnabled && Boolean(settings.bankDetails.trim());
    case "cod":
      return settings.cashOnDeliveryEnabled;
    default:
      return false;
  }
}

export function getAvailablePaymentMethods(settings: StoreSettings | null): PaymentMethod[] {
  return (["easypaisa", "jazzcash", "bank_transfer", "cod"] as const).filter((method) =>
    isPaymentMethodAvailable(method, settings)
  );
}
