import { describe, expect, it } from "vitest";
import { assertJsonContentType, assertSameOrigin } from "../src/lib/request-security";

describe("API request protections", () => {
  it("accepts a same-origin JSON mutation", async () => {
    const request = new Request("https://rinconcito.example/api/test", {
      method: "POST",
      headers: { origin: "https://rinconcito.example", "content-type": "application/json", "sec-fetch-site": "same-origin" },
      body: JSON.stringify({ value: 1 })
    });
    expect(() => assertSameOrigin(request)).not.toThrow();
    expect(() => assertJsonContentType(request)).not.toThrow();
  });

  it("rejects cross-site mutations", () => {
    const request = new Request("https://rinconcito.example/api/test", {
      method: "POST",
      headers: { origin: "https://attacker.example", "content-type": "application/json", "sec-fetch-site": "cross-site" },
      body: "{}"
    });
    expect(() => assertSameOrigin(request)).toThrow("La solicitud no es válida");
  });

  it("rejects requests with neither a trusted origin nor the AJAX header", () => {
    const request = new Request("https://rinconcito.example/api/test", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
    expect(() => assertSameOrigin(request)).toThrow("La solicitud no es válida");
  });

  it("rejects simple content types on JSON endpoints", () => {
    const request = new Request("https://rinconcito.example/api/test", {
      method: "POST",
      headers: { origin: "https://rinconcito.example", "content-type": "text/plain" },
      body: "{}"
    });
    expect(() => assertJsonContentType(request)).toThrow("El contenido debe enviarse como JSON");
  });
});
