export function buildOpenStreetMapUrl(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
) {
  if (
    typeof latitude !== "number"
    || typeof longitude !== "number"
    || !Number.isFinite(latitude)
    || !Number.isFinite(longitude)
    || latitude < -90
    || latitude > 90
    || longitude < -180
    || longitude > 180
  ) {
    return null;
  }

  const lat = encodeURIComponent(String(latitude));
  const lon = encodeURIComponent(String(longitude));
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=17/${lat}/${lon}`;
}
