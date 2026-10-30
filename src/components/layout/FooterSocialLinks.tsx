"use client";

import { useEffect, useState } from "react";
import { StoreSettings } from "@/types";

type SocialLinks = Pick<
  StoreSettings,
  "instagramUrl" | "facebookUrl" | "tiktokUrl"
>;

const DEFAULT_FACEBOOK_URL = "https://www.facebook.com/share/19p9ppZop5/";

function safeSocialUrl(value?: string) {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

export function FooterSocialLinks({ settings }: { settings?: SocialLinks }) {
  const [links, setLinks] = useState<SocialLinks | undefined>(settings);

  useEffect(() => {
    if (settings) return;

    const loadSettings = async () => {
      try {
        const response = await fetch("/api/settings");
        if (!response.ok) {
          throw new Error(`Social profile settings request failed (${response.status})`);
        }

        const data = (await response.json()) as SocialLinks;
        setLinks(data);
      } catch (error) {
        console.error("Unable to load social profile links:", error);
      }
    };

    void loadSettings();
  }, [settings]);

  const socials = [
    {
      name: "Instagram",
      href: safeSocialUrl(links?.instagramUrl),
      icon: (
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="18" cy="6" r="1" fill="currentColor" stroke="none" />
        </svg>
      ),
      className: "hover:bg-[#E1306C] hover:text-white",
    },
    {
      name: "Facebook",
      href: safeSocialUrl(links?.facebookUrl) || DEFAULT_FACEBOOK_URL,
      icon: (
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M13.5 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.5 1.6-1.5h1.7V3.9c-.3 0-1.4-.1-2.6-.1-2.6 0-4.4 1.6-4.4 4.5V10H7v3h2.8v8h3.7Z" />
        </svg>
      ),
      className: "hover:bg-[#1877F2] hover:text-white",
    },
    {
      name: "TikTok",
      href: safeSocialUrl(links?.tiktokUrl),
      icon: (
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M19.6 7.2a6.8 6.8 0 0 1-4.1-1.4v8.1a6.4 6.4 0 1 1-5.5-6.3v3.5a2.9 2.9 0 1 0 2 2.8V2.5h3.5c.2 2.2 1.8 4 4.1 4.4v.3Z" />
        </svg>
      ),
      className: "hover:bg-[#111111] hover:text-white",
    },
  ].filter((social) => social.href);

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-bold uppercase tracking-wider text-brand-mocha">
        Follow MESM
      </h4>
      {socials.length > 0 && (
        <div className="flex items-center gap-2">
          {socials.map((social) => (
            <a
              key={social.name}
              href={social.href!}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Follow MESM on ${social.name}`}
              title={`Follow MESM on ${social.name}`}
              className={`flex h-9 w-9 items-center justify-center rounded-full border border-brand-mocha/10 bg-brand-ivory text-brand-mocha transition-colors ${social.className}`}
            >
              {social.icon}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
