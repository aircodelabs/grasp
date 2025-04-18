import path from "path";
import express from "express";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function register(app) {
  const distPath = path.join(__dirname, "../../web/dist");
  console.log("distPath", distPath);
  app.use(express.static(distPath));
  app.get("{*splat}", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}
