"use client";

import { useEffect, useRef } from "react";

/**
 * Prévia muda do vídeo: toca em laço enquanto está na tela e pausa fora dela
 * (economiza dados e bateria). Com "reduzir movimento" fica só a capa.
 */
export function VideoAuto({
  src,
  poster,
  className = "",
}: {
  src: string;
  poster: string;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) void v.play().catch(() => undefined);
        else v.pause();
      },
      { threshold: 0.35 }
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      muted
      loop
      playsInline
      preload="none"
      poster={poster}
      aria-hidden
      tabIndex={-1}
      className={className}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
