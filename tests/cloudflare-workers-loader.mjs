export async function resolve(specifier, context, nextResolve) {
  if (specifier === "cloudflare:workers") {
    return {
      shortCircuit: true,
      url: "data:text/javascript,export%20const%20env%20%3D%20%7B%20ADMIN_PASSWORD%3A%20%22admin%22%20%7D%3B",
    };
  }
  return nextResolve(specifier, context);
}
