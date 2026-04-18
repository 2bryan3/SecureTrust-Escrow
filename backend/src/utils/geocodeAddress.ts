type NominatimResult = {
  lat: string;
  lon: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
  };
};

export async function geocodeAddress(address: string) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(address)}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "securetrust-app", // REQUIRED
    },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Geocode failed:", text);
    return null;
  }

  const data = (await res.json()) as NominatimResult[];

  if (!data || data.length === 0) {
    throw new Error("No geocoding results found");
  }

  return {
    lat: parseFloat(data[0].lat),
    lon: parseFloat(data[0].lon),

    city:
      data[0].address?.city ||
      data[0].address?.town ||
      data[0].address?.village ||
      "",

    state: data[0].address?.state || "",
  };
}