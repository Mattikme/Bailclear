// Vidéo de démonstration : lecture automatique (muette) uniquement quand elle est visible.
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
for (const v of document.querySelectorAll('video[data-autoplay]')) {
  if (reduce || !('IntersectionObserver' in window)) { v.controls = true; continue; }
  v.muted = true;
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) v.play().catch(() => { v.controls = true; });
    else v.pause();
  }, { threshold: 0.35 }).observe(v);
}
