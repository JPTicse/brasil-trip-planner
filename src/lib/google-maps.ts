// Carga dinámica de Google Maps JavaScript API
let loaded = false;
let loadingPromise: Promise<void> | null = null;
const CALLBACK_NAME = "__gmapsInit__";

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

    (window as any)[CALLBACK_NAME] = () => {
      loaded = true;
      resolve();
    };

    // Si ya existe el objeto google.maps, resolver inmediatamente
    if ((window as any).google?.maps) {
      loaded = true;
      resolve();
      return;
    }

    // Si ya se está cargando el script, esperar al callback global
    const existing = document.querySelector('script[data-google-maps]');
    if (existing) {
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&callback=${CALLBACK_NAME}&v=weekly`;
    script.async = true;
    script.defer = true;
    script.setAttribute("data-google-maps", "true");
    script.onerror = () => {
      reject(new Error("Error al cargar Google Maps"));
      delete (window as any)[CALLBACK_NAME];
    };
    document.head.appendChild(script);
  });

  return loadingPromise;
}
