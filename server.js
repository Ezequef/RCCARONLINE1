import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { WebSocketServer } from "ws";
import http from "http";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Servir os arquivos do mesmo diretório
app.use(express.static(__dirname));

// Criar servidor HTTP (Render cuida do HTTPS automaticamente)
const server = http.createServer(app);

// Criar servidor WebSocket atrelado ao HTTP
const wss = new WebSocketServer({ server });

let esp32Socket = null;

wss.on("connection", (ws) => {
  console.log("🔌 Novo cliente conectado!");

  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg);

      // Identifica ESP32
      if (data.type === "esp32") {
        esp32Socket = ws;
        console.log("✅ ESP32 conectada!");
      }

      // Controle vindo do site
      if (data.type === "controle" && esp32Socket) {
        esp32Socket.send(JSON.stringify(data.comando));
        console.log("➡️ Comando enviado para ESP32:", data.comando);
      }
    } catch (e) {
      console.error("Erro ao processar mensagem:", e);
    }
  });

  ws.on("close", () => {
    console.log("❌ Cliente desconectado.");
    if (ws === esp32Socket) esp32Socket = null;
  });
});

// Serve o index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Render injeta automaticamente a PORT
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
