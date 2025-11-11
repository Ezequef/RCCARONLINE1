import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { WebSocketServer } from "ws";
import http from "http";
import fs from "fs";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

let esp32Socket = null;

// --- Corrige __dirname para módulos ES ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Verifica se o index.html existe ---
const indexPath = path.join(__dirname, "index.html");
if (!fs.existsSync(indexPath)) {
  console.error("❌ index.html não encontrado em:", indexPath);
}

// Serve arquivos estáticos
app.use(express.static(__dirname));

// Rota raiz
app.get("/", (req, res) => {
  res.sendFile(indexPath);
});

// WebSocket
wss.on("connection", (ws) => {

  ws.on("message", (msg) => {
    let data;
    try {
      data = JSON.parse(msg);
    } catch {
      // Mensagem não JSON: envia direto para ESP32
      if (esp32Socket) esp32Socket.send(msg);
      return;
    }

    // ESP32 se identifica
    if (data.type === "esp32") {
      esp32Socket = ws;
      console.log("✅ ESP32 conectada!");
      return;
    }

    // Comando do controle → ESP32
    if (data.type === "controle" && esp32Socket) {
      esp32Socket.send(data.comando);
    }

    // Estado vindo do ESP32 → repassa para todos os HTMLs conectados
    if (data.type === "estado") {
      wss.clients.forEach(client => {
        if (client !== esp32Socket && client.readyState === 1) {
          client.send(JSON.stringify(data));
        }
      });
    }

    // Ping/pong
    if (data.type === "ping" && ws.readyState === 1) {
      ws.send(JSON.stringify({ type: "pong" }));
    }
  });

  ws.on("close", () => {
    if (ws === esp32Socket) esp32Socket = null;
  });
});

// Inicia servidor
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
