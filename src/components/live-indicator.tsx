"use client";

import { useEffect, useState } from "react";

/**
 * Muestra un punto verde pulsante que indica que la app está
 * sincronizando datos en tiempo real.
 */
export function LiveIndicator() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible((v) => !v);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600">
      <span className={`relative flex h-2 w-2`}>
        {visible && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        )}
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      En vivo
    </span>
  );
}
