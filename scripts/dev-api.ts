import { config } from "dotenv";
config({ path: ".env.local" });

import express from "express";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const apiDir = path.resolve(__dirname, "../api");
const PORT = 3001;

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use((req, _res, next) => {
  console.log(`[${req.method}] ${req.url}`);
  next();
});

const files = (await readdir(apiDir)).filter((f) => f.endsWith(".ts"));

if (files.length === 0) {
  console.warn("⚠️  Không tìm thấy file .ts nào trong api/");
}

for (const file of files) {
  const routeName = file.replace(/\.ts$/, "");
  const fileUrl = pathToFileURL(path.join(apiDir, file)).href;
  const mod = await import(fileUrl);
  const handler = mod.default;

  if (typeof handler !== "function") {
    console.warn(`⚠️  ${file} không export default function`);
    continue;
  }

  app.all(`/api/${routeName}`, async (req, res) => {
    try {
      Object.defineProperty(req, "query", {
        configurable: true,
        value: req.query ?? {},
      });
      await handler(req, res as never);
    } catch (err) {
      console.error(`[${routeName}] error:`, err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  });

  console.log(`✓ /api/${routeName}`);
}

app.listen(PORT, () => {
  console.log(`\n🚀 API dev server ready at http://localhost:${PORT}\n`);
});
