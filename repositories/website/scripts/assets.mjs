import sharp from "sharp";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
await mkdir("public/brand/optimized", { recursive: true });
const variants = {
  horizontal: "IBIS-HORIZONTAL-VERSION.png",
  stacked: "IBIS-STACKED-VERSION.png",
  white: "IBIS-WHITE-MONOCHROME.png",
  black: "IBIS-BLACK-&-WHITE.png",
  icon: "IBIS-ICON.png",
};
const records = [];
for (const [name, file] of Object.entries(variants)) {
  const data = await readFile(`public/brand/${file}`);
  const metadata = await sharp(data).metadata();
  await sharp(data)
    .resize({
      width: name === "horizontal" ? 640 : 400,
      withoutEnlargement: true,
    })
    .webp({ quality: 90 })
    .toFile(`public/brand/optimized/${name}.webp`);
  records.push({
    file,
    width: metadata.width,
    height: metadata.height,
    sha256: createHash("sha256").update(data).digest("hex"),
    derivative: `optimized/${name}.webp`,
    operation:
      "Proportional resize and WebP encoding only; opaque backgrounds and original geometry retained",
  });
}
await sharp("public/brand/IBIS-ICON.png")
  .resize(64, 64)
  .png()
  .toFile("public/brand/favicon.png");
await sharp("public/brand/IBIS-HORIZONTAL-VERSION.png")
  .resize(1200, 630, { fit: "contain", background: "#031426" })
  .png()
  .toFile("public/brand/social.png");
await writeFile(
  "public/brand/asset-manifest.json",
  JSON.stringify(records, null, 2) + "\n",
);
console.log(
  "Preserved five originals; encoded proportional web assets, favicon and social image.",
);
