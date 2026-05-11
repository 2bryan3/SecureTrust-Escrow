type NominatimResult = {
  lat: string;
  lon: string;
  address?: {
    road?: string;
    pedestrian?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
  };
};

const stateAbbreviations: Record<string, string> = {
  "Alabama": "AL",
  "Alaska": "AK",
  "Arizona": "AZ",
  "Arkansas": "AR",
  "California": "CA",
  "Colorado": "CO",
  "Connecticut": "CT",
  "Delaware": "DE",
  "Florida": "FL",
  "Georgia": "GA",
  "Hawaii": "HI",
  "Idaho": "ID",
  "Illinois": "IL",
  "Indiana": "IN",
  "Iowa": "IA",
  "Kansas": "KS",
  "Kentucky": "KY",
  "Louisiana": "LA",
  "Maine": "ME",
  "Maryland": "MD",
  "Massachusetts": "MA",
  "Michigan": "MI",
  "Minnesota": "MN",
  "Mississippi": "MS",
  "Missouri": "MO",
  "Montana": "MT",
  "Nebraska": "NE",
  "Nevada": "NV",
  "New Hampshire": "NH",
  "New Jersey": "NJ",
  "New Mexico": "NM",
  "New York": "NY",
  "North Carolina": "NC",
  "North Dakota": "ND",
  "Ohio": "OH",
  "Oklahoma": "OK",
  "Oregon": "OR",
  "Pennsylvania": "PA",
  "Rhode Island": "RI",
  "South Carolina": "SC",
  "South Dakota": "SD",
  "Tennessee": "TN",
  "Texas": "TX",
  "Utah": "UT",
  "Vermont": "VT",
  "Virginia": "VA",
  "Washington": "WA",
  "West Virginia": "WV",
  "Wisconsin": "WI",
  "Wyoming": "WY",
};

export { stateAbbreviations };

export async function geocodeAddress(address: string) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(address)}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "securetrust-app",
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

    street:
      data[0].address?.road ||
      data[0].address?.pedestrian ||
      "",

    city:
      data[0].address?.city ||
      data[0].address?.town ||
      data[0].address?.village ||
      "",

    state: data[0].address?.state || "",
  };
}