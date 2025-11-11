import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { WebSocketServer } from "ws";
import http from "http";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

let esp32Socket = null;

// --- Corrige __dirname para módulos ES ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve arquivos estáticos (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, "public"))); // coloque index.html dentro da pasta 'public'

// Rota raiz
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

// WebSocket
wss.on("connection", (ws) => {
  ws.on("message", (msg) => {
    let data;
    try {
      data = JSON.parse(msg);
    } catch {
      if (esp32Socket) esp32Socket.send(msg);
      return;
    }

    if (data.type === "esp32") {
      esp32Socket = ws;
      console.log("✅ ESP32 conectada!");
      return;
    }

    if (data.type === "controle" && esp32Socket) {
      esp32Socket.send(data.comando);
    }

    if (data.type === "ping" && ws.readyState === 1) {
      ws.send(JSON.stringify({ type: "pong" }));
    }
  });

  ws.on("close", () => {
    if (ws === esp32Socket) esp32Socket = null;
  });
});

// Inicia servidor
server.listen(process.env.PORT || 10000, () => {
  console.log(`Servidor rodando na porta ${process.env.PORT || 10000}`);
});
