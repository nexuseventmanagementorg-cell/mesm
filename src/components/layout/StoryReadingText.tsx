"use client";

import { useEffect, useRef, useState } from "react";

interface StoryReadingTextProps {
  text: string;
}

export function StoryReadingText({ text }: StoryReadingTextProps) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const [isReading, setIsReading] = useState(false);
  const words = text.split(/\s+/);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const checkVisibility = () => {
      const bounds = (container.parentElement ?? container).getBoundingClientRect();
      if (bounds.top < window.innerHeight && bounds.bottom > 0) {
        setIsReading(true);
        window.removeEventListener("scroll", checkVisibility);
        window.removeEventListener("resize", checkVisibility);
      }
    };

    checkVisibility();
    window.addEventListener("scroll", checkVisibility, { passive: true });
    window.addEventListener("resize", checkVisibility);
    return () => {
      window.removeEventListener("scroll", checkVisibility);
      window.removeEventListener("resize", checkVisibility);
    };
  }, []);

  return (
    <span
      ref={containerRef}
      aria-label={text}
      className={isReading ? "story-reading-active" : undefined}
      role="text"
    >
      {words.map((word, index) => (
        <span key={`${word}-${index}`} aria-hidden="true">
          <span
            className="story-reading-word"
            style={{ animationDelay: `${index * 0.45}s` }}
          >
            {word}
          </span>
          {index < words.length - 1 ? " " : ""}
        </span>
      ))}
    </span>
  );
}
