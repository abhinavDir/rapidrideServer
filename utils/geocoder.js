/**
 * Geocodes an address string to { latitude, longitude } using OpenStreetMap Nominatim API.
 * @param {string} address - The street address to geocode.
 * @return {Promise<{latitude: number, longitude: number}>}
 */
export const geocodeAddress = async (address) => {
  if (!address || typeof address !== "string") {
    return { latitude: 0, longitude: 0 };
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (apiKey) {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address.trim()
      )}&components=country:in&key=${apiKey}`;

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.status === "OK" && data.results && data.results.length > 0) {
          const lat = parseFloat(data.results[0].geometry.location.lat);
          const lon = parseFloat(data.results[0].geometry.location.lng);
          return { latitude: lat, longitude: lon };
        }
      }
    } catch (error) {
      console.error("Google Geocoding error, falling back to Nominatim:", error.message);
    }
  }

  // Fallback to OpenStreetMap Nominatim
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      address.trim()
    )}&countrycodes=in`;
    
    const response = await fetch(url, {
      headers: {
        "User-Agent": "LocationFetchApp/1.0 (contact@locationfetch.com)",
      },
    });

    if (!response.ok) {
      console.warn(`Geocoding failed HTTP ${response.status} for address: "${address}"`);
      return { latitude: 0, longitude: 0 };
    }

    const data = await response.json();

    if (Array.isArray(data) && data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lon = parseFloat(data[0].lon);
      return { latitude: lat, longitude: lon };
    }

    console.warn(`No geocoding results found for address: "${address}"`);
    return { latitude: 0, longitude: 0 };
  } catch (error) {
    console.error("Geocoding error:", error.message);
    return { latitude: 0, longitude: 0 };
  }
};
