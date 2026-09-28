import { describe, expect, it } from "vitest";

import { buildOpenStreetMapUrl } from "../lib/map-links";

describe("buildOpenStreetMapUrl", () => {
  it("creates a pin URL for valid coordinates", () => {
    expect(buildOpenStreetMapUrl(13.7563, 100.5018)).toBe(
      "https://www.openstreetmap.org/?mlat=13.7563&mlon=100.5018#map=17/13.7563/100.5018",
    );
  });

  it("returns null for missing or out-of-range coordinates", () => {
    expect(buildOpenStreetMapUrl(null, 100.5018)).toBeNull();
    expect(buildOpenStreetMapUrl(91, 100.5018)).toBeNull();
    expect(buildOpenStreetMapUrl(13.7563, 181)).toBeNull();
  });
});
