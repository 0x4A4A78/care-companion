import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Brand } from "../components/brand";

describe("Brand", () => {
  it("renders the name without the old brand icon", () => {
    const markup = renderToStaticMarkup(<Brand />);

    expect(markup).toContain("Care Companion");
    expect(markup).not.toContain("brand-mark");
    expect(markup).not.toContain("<svg");
  });
});
