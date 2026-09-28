import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();

function readProjectFile(path: string) {
  return readFileSync(join(projectRoot, path), "utf8");
}

describe("customer navigation", () => {
  it("does not show the welcome card on the customer dashboard", () => {
    const dashboard = readProjectFile("app/(portal)/customer/page.tsx");

    expect(dashboard).not.toContain('className="welcome"');
  });

  it("does not expose the companion directory in the customer experience", () => {
    const portalShell = readProjectFile("components/portal-shell.tsx");
    const dashboard = readProjectFile("app/(portal)/customer/page.tsx");
    const jobDetails = readProjectFile("app/(portal)/customer/jobs/[id]/page.tsx");

    expect(portalShell).not.toContain('"/companions"');
    expect(dashboard).not.toContain('"/companions"');
    expect(jobDetails).not.toContain('"/companions"');
    expect(existsSync(join(projectRoot, "app/(portal)/companions/page.tsx"))).toBe(false);
    expect(existsSync(join(projectRoot, "app/(portal)/companions/[id]/page.tsx"))).toBe(false);
  });
});
