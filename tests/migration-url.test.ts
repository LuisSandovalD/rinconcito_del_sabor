import { describe, expect, it } from "vitest";
import { resolveMigrationUrl } from "../scripts/lib/migration-url.mjs";

describe("migration connection selection", () => {
  it("converts a Neon pooled hostname into its direct endpoint", () => {
    const result = resolveMigrationUrl({
      DIRECT_URL: "postgresql://user:secret@ep-example-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
    });
    expect(result.derivedDirectUrl).toBe(true);
    expect(new URL(result.url).hostname).toBe("ep-example.c-2.us-east-1.aws.neon.tech");
  });

  it("preserves a real direct URL", () => {
    const direct = "postgresql://user:secret@ep-example.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require";
    expect(resolveMigrationUrl({ DIRECT_URL: direct })).toEqual({ url: direct, derivedDirectUrl: false });
  });

  it("falls back to DATABASE_URL when DIRECT_URL is absent", () => {
    const database = "postgresql://user:secret@database.example.com/app";
    expect(resolveMigrationUrl({ DATABASE_URL: database })).toEqual({ url: database, derivedDirectUrl: false });
  });
});
