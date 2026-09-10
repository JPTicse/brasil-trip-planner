import { NextRequest, NextResponse } from "next/server";

// Endpoint que busca un lugar y devuelve sugerencias completas
// (ubicación, foto, horario típico, etc) usando Google Places
export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");
  if (!query) {
    return NextResponse.json({ error: "Falta query" }, { status: 400 });
  }

  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "Falta API key" }, { status: 500 });
  }

  try {
    // 1. Buscar el lugar con Places API (Text Search) - server side
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&language=es&key=${key}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (searchData.status !== "OK" || !searchData.results?.length) {
      return NextResponse.json({ error: "No se encontró el lugar" }, { status: 404 });
    }

    // Tomar los primeros 3 resultados como sugerencias
    const suggestions = await Promise.all(
      searchData.results.slice(0, 3).map(async (place: any) => {
        // 2. Obtener detalles del lugar (horarios, fotos, etc)
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,geometry,photos,opening_hours,website,formatted_phone_number,price_level,rating,types&language=es&key=${key}`;
        const detailsRes = await fetch(detailsUrl);
        const details = await detailsRes.json();

        if (details.status !== "OK") {
          return {
            place_id: place.place_id,
            name: place.name,
            address: place.formatted_address,
            lat: place.geometry?.location?.lat,
            lng: place.geometry?.location?.lng,
            photo_url: null,
            rating: null,
            price_level: null,
            opening_hours: null,
            types: [],
          };
        }

        const p = details.result;
        // 3. Obtener URL de la primera foto si existe
        let photoUrl: string | null = null;
        if (p.photos?.[0]?.photo_reference) {
          photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${p.photos[0].photo_reference}&key=${key}`;
        }

        // Mapear tipos de Google a nuestro tipo de actividad
        const types = p.types ?? [];
        let suggestedType = "visit";
        if (types.includes("restaurant") || types.includes("food") || types.includes("cafe")) {
          suggestedType = "meal";
        } else if (types.includes("transit_station") || types.includes("airport") || types.includes("bus_station")) {
          suggestedType = "transport";
        } else if (types.includes("tourist_attraction") || types.includes("amusement_park")) {
          suggestedType = "tour";
        } else if (types.includes("night_club") || types.includes("stadium")) {
          suggestedType = "event";
        }

        // Horario típico: si tiene opening_hours, sugerir hora de apertura
        let suggestedTime: string | null = null;
        if (p.opening_hours?.weekday_text) {
          // Por defecto sugerimos las 10:00 como hora de inicio
          suggestedTime = "10:00";
        }

        // Estimar coste basado en price_level (0-4)
        let suggestedCost: number | null = null;
        let suggestedCurrency = "BRL";
        if (p.price_level != null) {
          // price_level: 0=gratis, 1=barato, 2=medio, 3=caro, 4=muy caro
          const costMap = [0, 30, 80, 200, 500];
          suggestedCost = costMap[p.price_level] ?? null;
        }

        return {
          place_id: p.place_id ?? place.place_id,
          name: p.name ?? place.name,
          address: p.formatted_address ?? place.formatted_address,
          lat: p.geometry?.location?.lat ?? place.geometry?.location?.lat,
          lng: p.geometry?.location?.lng ?? place.geometry?.location?.lng,
          photo_url: photoUrl,
          rating: p.rating ?? null,
          price_level: p.price_level ?? null,
          suggested_type: suggestedType,
          suggested_time: suggestedTime,
          suggested_cost: suggestedCost,
          suggested_currency: suggestedCurrency,
          opening_hours: p.opening_hours?.weekday_text?.[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1] ?? null,
          website: p.website ?? null,
          phone: p.formatted_phone_number ?? null,
          types: types,
        };
      }),
    );

    return NextResponse.json({ suggestions });
  } catch (e) {
    console.error("Error en /api/suggest-place:", e);
    return NextResponse.json({ error: "Error al buscar" }, { status: 500 });
  }
}
