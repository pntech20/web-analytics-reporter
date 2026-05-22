const fs = require("fs");
const path = require("path");

const SITE_DIR = path.join(__dirname, "..", "site");
const BASE_URL = "https://analyticsreporter.xyz";

function walkHtmlFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walkHtmlFiles(fullPath);
    return entry.isFile() && entry.name.endsWith(".html") ? [fullPath] : [];
  });
}

function publicUrlFor(filePath) {
  const rel = path.relative(SITE_DIR, filePath).split(path.sep).join("/");
  if (rel === "index.html") return `${BASE_URL}/`;
  return `${BASE_URL}/${rel.replace(/\/index\.html$/, "")}`;
}

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function checkPage(filePath, sitemap) {
  const html = fs.readFileSync(filePath, "utf8");
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1] || "";
  const description = html.match(/<meta name="description" content="([^"]+)"/)?.[1] || "";
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1] || "";
  const h1Count = (html.match(/<h1[\s>]/g) || []).length;
  const images = [...html.matchAll(/<img\b([^>]*)>/g)];
  const missingAlt = images.filter((match) => !/\salt=/.test(match[1]));
  const jsonLdBlocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  const expectedUrl = publicUrlFor(filePath);

  if (title.length < 35 || title.length > 70) fail(`${filePath}: title should be 35-70 characters.`);
  if (description.length < 120 || description.length > 160) fail(`${filePath}: description should be 120-160 characters.`);
  if (canonical !== expectedUrl) fail(`${filePath}: canonical should be ${expectedUrl}.`);
  if (!sitemap.includes(expectedUrl)) fail(`${filePath}: missing from sitemap.`);
  if (h1Count !== 1) fail(`${filePath}: expected exactly one h1.`);
  if (missingAlt.length) fail(`${filePath}: every image needs alt text.`);
  if (!jsonLdBlocks.length) fail(`${filePath}: expected JSON-LD structured data.`);

  for (const block of jsonLdBlocks) {
    JSON.parse(block[1]);
  }

  console.log(`${path.relative(process.cwd(), filePath)} ok`);
}

function main() {
  const sitemap = fs.readFileSync(path.join(SITE_DIR, "sitemap.xml"), "utf8");
  const robots = fs.readFileSync(path.join(SITE_DIR, "robots.txt"), "utf8");
  const pages = walkHtmlFiles(SITE_DIR).sort();

  if (!robots.includes(`${BASE_URL}/sitemap.xml`)) fail("robots.txt must point to the canonical sitemap.");

  for (const page of pages) checkPage(page, sitemap);
}

main();
