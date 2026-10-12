import { describe, expect, it } from "vitest";
import { handleApiError } from "../src/lib/api";

describe("API error responses", () => {
  it("returns an actionable conflict for duplicate database writes", async () => {
    const response = handleApiError(Object.assign(new Error("duplicate"), { code: "P2002" }));
    const body = await response.json() as { error: string; code: string; requestId: string };

    expect(response.status).toBe(409);
    expect(body.code).toBe("DUPLICATE_RECORD");
    expect(body.error).toContain("Ya existe");
    expect(response.headers.get("x-request-id")).toBe(body.requestId);
  });

  it("identifies a database outage without exposing its raw error", async () => {
    const response = handleApiError(Object.assign(new Error("postgres://user:secret@example.invalid/db"), { code: "P1001" }));
    const body = await response.json() as { error: string; code: string; requestId: string };

    expect(response.status).toBe(503);
    expect(body.code).toBe("DATABASE_UNAVAILABLE");
    expect(body.error).not.toContain("postgres://");
    expect(response.headers.get("retry-after")).toBe("3");
  });

  it("adds a support code to unknown failures", async () => {
    const response = handleApiError(new Error("private internal detail"));
    const body = await response.json() as { error: string; code: string; requestId: string };

    expect(response.status).toBe(500);
    expect(body.code).toBe("INTERNAL_ERROR");
    expect(body.error).toContain(body.requestId.slice(0, 8));
    expect(body.error).not.toContain("private internal detail");
  });
});
