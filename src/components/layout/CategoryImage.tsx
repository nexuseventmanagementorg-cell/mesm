"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80";

interface CategoryImageProps {
  src?: string;
  videoUrl?: string;
  alt: string;
}

export function CategoryImage({ src, videoUrl, alt }: CategoryImageProps) {
  const [imageSrc, setImageSrc] = useState(src || FALLBACK_IMAGE);

  useEffect(() => {
    setImageSrc(src || FALLBACK_IMAGE);
  }, [src]);

  if (videoUrl) {
    return (
      <video
        src={videoUrl}
        poster={imageSrc}
        aria-label={`${alt} category video`}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 h-full w-full object-contain transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:transition-none"
      />
    );
  }

  return (
    <Image
      src={imageSrc}
      alt={alt}
      fill
      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
      className="object-contain transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:transition-none"
      onError={() => {
        if (imageSrc !== FALLBACK_IMAGE) setImageSrc(FALLBACK_IMAGE);
      }}
    />
  );
}
