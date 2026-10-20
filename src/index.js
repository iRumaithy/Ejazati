export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    if (!(response.headers.get("content-type") || "").includes("text/html")) return response;
    const headers = new Headers(response.headers);
    headers.set("Cache-Control", "no-cache");
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    return new Response(response.body, {status: response.status, statusText: response.statusText, headers});
  }
};
