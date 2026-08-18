const fs = require("fs");

const OUTPUT_FILE = "data/codes.json";

function extractCodes(text) {
  if (!text) return [];

  const matches = text.toUpperCase().match(/\b[A-Z0-9]{12}\b/g);

  if (!matches) return [];

  return [...new Set(matches)];
}

function saveCodes(codes) {
  fs.mkdirSync("data", { recursive: true });

  const data = {
    updatedAt: new Date().toISOString(),
    codes: codes.map(code => ({
      code,
      source: "Public source",
      detectedAt: new Date().toISOString()
    }))
  };

  fs.writeFileSync(
    OUTPUT_FILE,
    JSON.stringify(data, null, 2)
  );

  console.log(`Saved ${codes.length} code(s).`);
}

async function main() {
  console.log("🔥 FF Code Radar collector started.");

  /*
   * YouTube and other public sources will be connected here.
   *
   * We will NOT put API keys directly in this file.
   * GitHub Actions secrets will handle those later.
   */

  const exampleText = "";

  const codes = extractCodes(exampleText);

  saveCodes(codes);

  console.log("Collector finished.");
}

main().catch(error => {
  console.error("Collector failed:", error);
  process.exit(1);
});
