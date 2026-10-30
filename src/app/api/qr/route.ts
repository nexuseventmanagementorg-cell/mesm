import { NextResponse } from "next/server";
import { generateQRCodeDataUrl, generateQRCodeSVG, getProductPublicUrl } from "@/lib/qr";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const explicitUrl = searchParams.get("url");
    const format = searchParams.get("format") || "json"; // 'json' (returns dataUrl), 'svg', 'png'

    const targetUrl = explicitUrl || (slug ? getProductPublicUrl(slug) : null);
    if (!targetUrl) {
      return NextResponse.json({ error: "Missing url or slug parameter" }, { status: 400 });
    }

    if (format === "svg") {
      const svg = await generateQRCodeSVG(targetUrl);
      return new NextResponse(svg, {
        headers: {
          "Content-Type": "image/svg+xml",
          "Content-Disposition": `attachment; filename="meems-gems-qr-${slug || "product"}.svg"`,
        },
      });
    }

    const dataUrl = await generateQRCodeDataUrl(targetUrl);

    if (format === "png") {
      // Decode base64 PNG
      const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "image/png",
          "Content-Disposition": `attachment; filename="meems-gems-qr-${slug || "product"}.png"`,
        },
      });
    }

    return NextResponse.json({
      targetUrl,
      dataUrl,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
