"use client";

import { useState } from "react";
import { Play } from "lucide-react";

const HERO_VIDEO_URL =
  "https://media.githubusercontent.com/media/nexuseventmanagementorg-cell/mesm/main/public/images/kashif%20bhai/MESM-mobile.mp4";

export function HeroVideo() {
  const [videoRequested, setVideoRequested] = useState(false);
  const [videoError, setVideoError] = useState(false);

  return (
    <div className="relative overflow-hidden rounded-3xl border-4 border-brand-warm/80 bg-brand-mocha shadow-2xl">
      <video
        className="block aspect-video w-full object-cover"
        src={videoRequested ? HERO_VIDEO_URL : undefined}
        controls={videoRequested}
        autoPlay={videoRequested}
        playsInline
        preload={videoRequested ? "auto" : "none"}
        poster="/images/mesm-logo.png"
        onError={() => setVideoError(true)}
        aria-label="MESM original handicrafts video"
      />
      {!videoRequested && !videoError && (
        <button
          type="button"
          onClick={() => setVideoRequested(true)}
          className="absolute inset-0 flex items-center justify-center gap-3 bg-brand-mocha/35 font-semibold text-brand-ivory transition-colors hover:bg-brand-mocha/50"
          aria-label="Play MESM original handicrafts video"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-gold text-brand-mocha shadow-card">
            <Play className="h-6 w-6 fill-current" />
          </span>
          <span className="text-sm font-semibold">Play video</span>
        </button>
      )}
      {videoError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-brand-mocha/90 px-4 text-center text-sm text-brand-ivory">
          <p role="alert">The video could not be loaded. Please check your connection.</p>
          <button
            type="button"
            onClick={() => {
              setVideoError(false);
              setVideoRequested(false);
            }}
            className="rounded-full bg-brand-gold px-4 py-2 font-semibold text-brand-mocha"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
