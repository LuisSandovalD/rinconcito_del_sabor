import { describe, expect, it } from "vitest";
import { hardenPostgresSslUrl } from "../src/lib/postgres-url";

describe("PostgreSQL runtime URL", () => {
  it("keeps full certificate verification explicit for remote databases", () => {
    const result = hardenPostgresSslUrl("postgresql://user:pass@db.example.com/app?sslmode=require&channel_binding=require");
    const url = new URL(result);

    expect(url.searchParams.get("sslmode")).toBe("verify-full");
    expect(url.searchParams.get("channel_binding")).toBe("require");
  });

  it("does not force TLS on a local development database", () => {
    const input = "postgresql://user:pass@localhost:5432/app";
    expect(hardenPostgresSslUrl(input)).toBe(input);
  });
});
