class AuthHotfixInjector {
  element(element) {
    element.append(
      '<script src="/auth-hotfix.js?v=1.1.1"></script>',
      { html: true }
    );
  }
}

export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    const contentType = response.headers.get("content-type") || "";

    if (!contentType.includes("text/html")) {
      return response;
    }

    return new HTMLRewriter()
      .on("body", new AuthHotfixInjector())
      .transform(response);
  }
};
