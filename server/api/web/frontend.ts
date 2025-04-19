import path from "path";
import express, { Express } from "express";

export default function register(app: Express) {
  const distPath = path.join(process.cwd(), "web/dist");
  console.log("distPath", distPath);
  app.use(express.static(distPath));
  app.get("{*splat}", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}
