import QRCode from "qrcode";

export interface QRCodeOptions {
  width?: number;
  margin?: number;
  color?: {
    dark: string;
    light: string;
  };
}

export const defaultQROptions: QRCodeOptions = {
  width: 400,
  margin: 2,
  color: {
    dark: "#42100F",
    light: "#F8F2E9",
  },
};

export async function generateQRCodeDataUrl(
  url: string,
  options: QRCodeOptions = defaultQROptions
): Promise<string> {
  try {
    return await QRCode.toDataURL(url, {
      width: options.width || 400,
      margin: options.margin || 2,
      color: options.color || defaultQROptions.color,
      errorCorrectionLevel: "M",
    });
  } catch (error) {
    console.error("Failed to generate QR code data URL", error);
    throw error;
  }
}

export async function generateQRCodeSVG(
  url: string,
  options: QRCodeOptions = defaultQROptions
): Promise<string> {
  try {
    return await QRCode.toString(url, {
      type: "svg",
      width: options.width || 400,
      margin: options.margin || 2,
      color: options.color || defaultQROptions.color,
      errorCorrectionLevel: "M",
    });
  } catch (error) {
    console.error("Failed to generate QR code SVG", error);
    throw error;
  }
}

export function getProductPublicUrl(slug: string, baseUrl?: string): string {
  const host =
    baseUrl ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : "https://meemsgems.com");
  return `${host}/product/${slug}`;
}
