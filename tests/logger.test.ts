import { afterEach, describe, expect, it, vi } from "vitest";
import { logger } from "../src/lib/logger";

describe("structured logger", () => {
  afterEach(() => vi.restoreAllMocks());

  it("redacts secret fields and credentials embedded in error text", () => {
    const write = vi.spyOn(console, "error").mockImplementation(() => undefined);

    logger.error("Database failure", {
      authorization: "Bearer visible-token",
      stack: "Error at postgresql://db-user:db-password@db.example.com/app?token=query-secret"
    });

    const output = String(write.mock.calls[0]?.[0]);
    expect(output).toContain("[REDACTED]");
    expect(output).not.toContain("visible-token");
    expect(output).not.toContain("db-password");
    expect(output).not.toContain("query-secret");
  });
});
