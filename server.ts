import express from "express";
import path from "path";
import fs from "fs/promises";
import { createServer as createViteServer } from "vite";
import { INITIAL_CLIENTS, INITIAL_SESSIONS } from "./src/mockData";

const DATA_FILE = path.join(process.cwd(), "data.json");

async function loadData() {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err: any) {
    if (err.code === "ENOENT") {
      // Initialize with mock data
      const defaultData = {
        clients: INITIAL_CLIENTS,
        sessions: INITIAL_SESSIONS,
      };
      await fs.writeFile(DATA_FILE, JSON.stringify(defaultData, null, 2), "utf-8");
      return defaultData;
    }
    console.error("Failed to read data.json, returning defaults", err);
    return {
      clients: INITIAL_CLIENTS,
      sessions: INITIAL_SESSIONS,
    };
  }
}

async function saveData(data: { clients: any[]; sessions: any[] }) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Support JSON request bodies with generous limits
  app.use(express.json({ limit: "50mb" }));

  // API endpoints FIRST
  app.get("/api/data", async (req, res) => {
    try {
      const data = await loadData();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to load data", details: err.message });
    }
  });

  app.post("/api/data", async (req, res) => {
    try {
      const { clients, sessions } = req.body;
      if (!Array.isArray(clients) || !Array.isArray(sessions)) {
        res.status(400).json({ error: "Invalid body format: clients and sessions arrays are required" });
        return;
      }
      await saveData({ clients, sessions });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to save data", details: err.message });
    }
  });

  app.post("/api/reset", async (req, res) => {
    try {
      const defaultData = {
        clients: INITIAL_CLIENTS,
        sessions: INITIAL_SESSIONS,
      };
      await saveData(defaultData);
      res.json({ success: true, ...defaultData });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to reset data", details: err.message });
    }
  });

  // Vite middleware for development or serving compiled files in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server", err);
});
