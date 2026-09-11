"use client";

import { useEffect, useState } from "react";

/**
 * Hook que detecta la dirección del scroll y devuelve si el dock
 * (bottom-nav) debería estar visible.
 * - Scrollea hacia abajo → dock se esconde
 * - Scrollea hacia arriba → dock se muestra
 * - Al inicio de la página → dock visible
 */
export function useDockVisible() {
  const [dockVisible, setDockVisible] = useState(true);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const updateScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < 10) {
        setDockVisible(true);
      } else if (currentScrollY > lastScrollY + 5) {
        setDockVisible(false);
      } else if (currentScrollY < lastScrollY - 5) {
        setDockVisible(true);
      }
      lastScrollY = currentScrollY;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScroll);
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return dockVisible;
}
