const express = require('express');
const path = require('path');
const WebSocket = require('ws');

const app = express();

// Servir todos os arquivos da mesma pasta do server.js
app.use(express.static(__dirname));

const server = app.listen(process.env.PORT || 3000, () => {
  console.log('Servidor rodando...');
});

const wss = new WebSocket.Server({ server });

let esp32Socket = null;

wss.on('connection', (ws) => {
  console.log('Novo cliente conectado');

  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg);

      // Identifica ESP32
      if(data.type === 'esp32') {
        esp32Socket = ws;
        console.log('ESP32 conectada!');
      }

      // Comando vindo do site
      if(data.type === 'controle' && esp32Socket) {
        esp32Socket.send(JSON.stringify(data.comando));
        console.log("Comando enviado para ESP32:", data.comando);
      }
    } catch(e) {
      console.error('Erro:', e);
    }
  });

  ws.on('close', () => {
    console.log('Cliente desconectou');
    if(ws === esp32Socket) esp32Socket = null;
  });
});

// Serve o index.html quando acessar '/'
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
