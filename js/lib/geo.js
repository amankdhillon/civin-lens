// Address to jurisdiction, in the browser.
// The address goes to the U.S. Census Bureau's geocoder to get a map point. It is never sent to Supabase or stored.
// Then the point is checked against each jurisdiction's boundary file in data/boundaries/.

const GEOCODER = 'https://geocoding.geo.census.gov/geocoder/locations/onelineaddress';

// Returns { x: longitude, y: latitude }, or null if the address wasn't found. Throws if the service can't be reached.
export async function geocode(address) {
  const url = `${GEOCODER}?address=${encodeURIComponent(address)}&benchmark=Public_AR_Current&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('The address lookup did not respond.');
  const data = await res.json();
  const match = data?.result?.addressMatches?.[0];
  return match ? { x: match.coordinates.x, y: match.coordinates.y } : null;
}

// Ray casting: counts how many polygon edges a horizontal line from the point crosses.
function inRing(point, ring) {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function inPolygon(point, rings) {
  if (!inRing(point, rings[0])) return false;
  return !rings.slice(1).some(hole => inRing(point, hole));
}

export function containsPoint(geojson, point) {
  const p = [point.x, point.y];
  const features = geojson.type === 'FeatureCollection' ? geojson.features
    : geojson.type === 'Feature' ? [geojson] : [{ geometry: geojson }];
  return features.some(({ geometry }) => {
    if (geometry?.type === 'Polygon') return inPolygon(p, geometry.coordinates);
    if (geometry?.type === 'MultiPolygon') return geometry.coordinates.some(poly => inPolygon(p, poly));
    return false;
  });
}

// Returns the id of the jurisdiction whose boundary contains the point, or null.
// Jurisdictions without a boundary file are skipped, not treated as errors.
export async function jurisdictionFor(point, jurisdictions) {
  for (const j of jurisdictions) {
    const res = await fetch(`data/boundaries/${encodeURIComponent(j.id)}.geojson`);
    if (!res.ok) continue;
    if (containsPoint(await res.json(), point)) return j.id;
  }
  return null;
}

// Returns the ids of every body whose boundary contains the point. A point can sit in several bodies at once
// (a city, a county, a school district), so this returns all of them.
export async function bodiesContaining(point, bodies) {
  const found = [];
  for (const body of bodies) {
    const res = await fetch(`data/boundaries/${encodeURIComponent(body.id)}.geojson`);
    if (!res.ok) continue;
    if (containsPoint(await res.json(), point)) found.push(body.id);
  }
  return found;
}
