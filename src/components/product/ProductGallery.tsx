"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ZoomIn, Play, X, ChevronLeft, ChevronRight } from "lucide-react";

interface ProductGalleryProps {
  images: string[];
  productName: string;
  videoUrl?: string;
}

export function ProductGallery({ images, productName, videoUrl }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  const displayImages = images.length > 0 ? images : ["/images/mesm-logo.png"];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : displayImages.length - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIndex((prev) => (prev < displayImages.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="flex flex-col-reverse md:flex-row gap-4">
      {/* Thumbnails */}
      <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto max-h-[500px] scrollbar-none py-1">
        {displayImages.map((img, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setSelectedIndex(idx);
              setShowVideo(false);
            }}
            className={`relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
              selectedIndex === idx && !showVideo
                ? "border-brand-gold shadow-gold scale-102"
                : "border-brand-mocha/10 hover:border-brand-gold/50 opacity-80"
            }`}
          >
            <Image
              src={img}
              alt={`${productName} thumbnail ${idx + 1}`}
              fill
              sizes="80px"
              className="object-cover"
            />
          </button>
        ))}

        {videoUrl && (
          <button
            type="button"
            onClick={() => setShowVideo(true)}
            className={`relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 bg-brand-mocha/5 flex flex-col items-center justify-center gap-1 transition-all ${
              showVideo ? "border-brand-gold shadow-gold" : "border-brand-mocha/10"
            }`}
          >
            <Play className="w-5 h-5 text-brand-gold fill-brand-gold" />
            <span className="text-[10px] font-bold text-brand-mocha">Video</span>
          </button>
        )}
      </div>

      {/* Main Showcase */}
      <div className="relative flex-1 aspect-square rounded-3xl overflow-hidden bg-brand-cream/40 border border-brand-mocha/10 group">
        {showVideo && videoUrl ? (
          <div className="w-full h-full flex items-center justify-center bg-black">
            <video
              src={videoUrl}
              controls
              autoPlay
              className="w-full h-full object-contain"
            />
          </div>
        ) : (
          <div
            onClick={() => setIsZoomOpen(true)}
            className="w-full h-full cursor-zoom-in relative"
          >
            <Image
              src={displayImages[selectedIndex]}
              alt={productName}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transition-transform duration-500 group-hover:scale-102"
            />

            {/* Zoom Icon Button */}
            <button
              onClick={() => setIsZoomOpen(true)}
              className="absolute top-4 right-4 p-2.5 rounded-full bg-brand-warm/80 backdrop-blur-md text-brand-mocha hover:bg-brand-warm shadow-soft opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Enlarge image"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            {/* Navigation Arrows for Mobile & Desktop */}
            {displayImages.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-brand-warm/80 backdrop-blur-md text-brand-mocha hover:bg-brand-warm shadow-soft opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-brand-warm/80 backdrop-blur-md text-brand-mocha hover:bg-brand-warm shadow-soft opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Next photo"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Lightbox Zoom Modal */}
      {isZoomOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setIsZoomOpen(false)}
        >
          <button
            onClick={() => setIsZoomOpen(false)}
            className="absolute top-6 right-6 p-3 text-white hover:text-brand-gold bg-white/10 rounded-full transition-colors"
            aria-label="Close zoom modal"
          >
            <X className="w-6 h-6" />
          </button>

          <div
            className="relative max-w-4xl max-h-[85vh] w-full h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={displayImages[selectedIndex]}
              alt={productName}
              fill
              className="object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
