export function HeroVideo() {
  return (
    <div className="overflow-hidden rounded-3xl border-4 border-brand-warm/80 bg-brand-mocha shadow-2xl">
      <video
        className="block aspect-video w-full object-cover"
        controls
        playsInline
        preload="metadata"
        aria-label="MESM original handicrafts video"
      >
        <source src="/images/kashif%20bhai/MESM.mp4" type="video/mp4" />
        Your browser does not support embedded videos.
      </video>
    </div>
  );
}
