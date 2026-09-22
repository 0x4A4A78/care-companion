import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("Companion open request feed migration", () => {
  const sql = readFileSync(
    join(process.cwd(), "supabase", "migration_open_request_feed.sql"),
    "utf8",
  ).toLowerCase();

  it("only exposes the feed through an authenticated companion RPC", () => {
    expect(sql).toContain("security definer");
    expect(sql).toContain("role = 'companion'");
    expect(sql).toContain("auth.uid()");
    expect(sql).toContain("revoke all on function public.list_open_requests_for_companion");
    expect(sql).toContain("grant execute on function public.list_open_requests_for_companion");
  });

  it("returns only unassigned requested jobs", () => {
    expect(sql).toContain("r.status = 'requested'");
    expect(sql).toContain("r.companion_id is null");
  });
});
