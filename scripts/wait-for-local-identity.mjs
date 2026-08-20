const discoveryUrl =
  "http://localhost:9000/application/o/kimono-portal/.well-known/openid-configuration";
const deadline = Date.now() + 120_000;

process.stdout.write("Waiting for the Kimono Authentik application");

while (Date.now() < deadline) {
  try {
    const response = await fetch(discoveryUrl, { redirect: "manual" });
    if (response.ok) {
      process.stdout.write(" ready.\n");
      process.exit(0);
    }
  } catch {
    // Authentik is still booting or migrating its fresh database.
  }

  process.stdout.write(".");
  await new Promise((resolve) => setTimeout(resolve, 2_000));
}

console.error(
  "\nKimono's Authentik application was not provisioned within 120 seconds. " +
    "Run `pnpm local:logs` and inspect the Kimono Portal managed blueprint.",
);
process.exit(1);
