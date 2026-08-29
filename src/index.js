class EjazatiScriptsInjector {
  element(element) {
    element.append(
      '<script src="/auth-hotfix.js?v=1.2.9"></script>' +
      '<script src="/ui-v1.2.0.js?v=1.2.9"></script>' +
      '<script src="/ui-v1.2.1.js?v=1.2.9"></script>' +
      '<script src="/ui-v1.2.2.js?v=1.2.9"></script>' +
      '<script src="/ui-v1.2.3.js?v=1.2.9"></script>' +
      '<script src="/ui-v1.2.4.js?v=1.2.9"></script>' +
      '<script src="/ui-v1.2.5.js?v=1.2.9"></script>' +
      '<script src="/ui-v1.2.8.js?v=1.2.9"></script>' +
      '<script src="/ui-v1.2.9.js?v=1.2.9"></script>',
      { html: true }
    );
  }
}
export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) return response;
    return new HTMLRewriter().on("body", new EjazatiScriptsInjector()).transform(response);
  }
};