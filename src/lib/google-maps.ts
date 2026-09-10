// Carga dinámica de Google Maps JavaScript API
let loaded = false;
let loadingPromise: Promise<void> | null = null;

export function loadGoogleMaps(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("SSR: no window"));
  }
  if (loaded && (window as any).google?.maps) return Promise.resolve();
  if (loadingPromise) return loadingPromise;

  loadingPromise = new Promise<void>((resolve, reject) => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key) {
      reject(new Error("Falta NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"));
      return;
    }

    // Si ya existe el objeto google.maps, usarlo
    if ((window as any).google?.maps) {
      loaded = true;
      resolve();
      return;
    }

    // Evitar cargar el script múltiples veces
    const existing = document.querySelector('script[data-google-maps]');
    if (existing) {
      // Ya se está cargando, esperar
      existing.addEventListener("load", () => {
        loaded = true;
        resolve();
      });
      existing.addEventListener("error", () => reject(new Error("Error al cargar Google Maps")));
      return;
    }

    // Callback global con nombre único (Google Maps requiere callback)
    const callbackName = `__gmapsInit_${Date.now()}`;
    (window as any)[callbackName] = () => {
      loaded = true;
      delete (window as any)[callbackName];
      resolve();
    };

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&callback=${callbackName}&v=weekly`;
    script.async = true;
    script.defer = true;
    script.setAttribute("data-google-maps", "true");
    script.onerror = () => {
      reject(new Error("Error al cargar Google Maps"));
      delete (window as any)[callbackName];
    };
    document.head.appendChild(script);
  });

  return loadingPromise;
}
