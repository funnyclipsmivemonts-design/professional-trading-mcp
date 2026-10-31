
const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store"
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: JSON_HEADERS
  });
}

function safeEqual(a, b) {
  const encoder = new TextEncoder();
  const x = encoder.encode(a);
  const y = encoder.encode(b);

  let difference = x.length ^ y.length;
  const length = Math.max(x.length, y.length);

  for (let i = 0; i < length; i++) {
    difference |= (x[i] || 0) ^ (y[i] || 0);
  }

  return difference === 0;
}

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);

      if (request.method !== "GET") {
        return jsonResponse({
          error: "Method not allowed"
        }, 405);
      }

      const expectedToken = env.MCP_AUTH_TOKEN;

      if (!expectedToken) {
        return jsonResponse({
          error: "Server authentication is not configured"
        }, 503);
      }

      const authorization =
        request.headers.get("Authorization") || "";

      const suppliedToken = authorization.startsWith("Bearer ")
        ? authorization.slice(7)
        : "";

      if (!safeEqual(suppliedToken, expectedToken)) {
        return jsonResponse({
          error: "Unauthorized"
        }, 401);
      }

      if (url.pathname === "/health") {
        return jsonResponse({
          ok: true,
          service: "professional-trading-data",
          mode: "read-only",
          timestamp: new Date().toISOString(),
          provider: "not-configured"
        });
      }

      return jsonResponse({
        error: "Endpoint not found"
      }, 404);

    } catch {
      return jsonResponse({
        error: "Internal server error"
      }, 500);
    }
  }
};
