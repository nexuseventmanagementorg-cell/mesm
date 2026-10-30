"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const DEFAULT_LOGO = "/images/mesm-logo.png";

interface SiteLogoProps {
  logoUrl?: string;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
}

export function SiteLogo({
  logoUrl,
  alt,
  sizes,
  className,
  priority = false,
}: SiteLogoProps) {
  const [storedLogoUrl, setStoredLogoUrl] = useState(DEFAULT_LOGO);

  useEffect(() => {
    if (logoUrl) return;

    let active = true;
    const loadLogo = async () => {
      try {
        const response = await fetch("/api/settings");
        if (!response.ok) {
          throw new Error(`Store logo request failed (${response.status})`);
        }

        const settings: unknown = await response.json();
        if (
          active &&
          typeof settings === "object" &&
          settings !== null &&
          "logoUrl" in settings &&
          typeof settings.logoUrl === "string" &&
          settings.logoUrl
        ) {
          setStoredLogoUrl(settings.logoUrl);
        }
      } catch (error) {
        console.error("Unable to load store logo:", error);
      }
    };

    void loadLogo();
    return () => {
      active = false;
    };
  }, [logoUrl]);

  return (
    <Image
      src={logoUrl || storedLogoUrl}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={className}
    />
  );
}
