const express = require('express');
const { Server } = require('ws');
const { Client } = require('pg');
const bodyParser = require('body-parser');
const path = require('path');

// Inisialisasi Express dan WebSocket
const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());

// PostgreSQL Client
const dbClient = new Client({
  connectionString: 'postgres://postgres:candra88@localhost:5432/tes',
});
dbClient.connect();

// WebSocket Server
const wss = new Server({ noServer: true });
wss.on('connection', (ws) => {
  console.log('Client connected');
  ws.on('close', () => console.log('Client disconnected'));
});

// PostgreSQL Notification Listener
dbClient.query('LISTEN task_change');
dbClient.on('notification', (msg) => {
  console.log('Notification received:', msg.payload);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(msg.payload);
    }
  });
});

// API Routes
app.get('/tasks', async (req, res) => {
  try {
    const result = await dbClient.query('SELECT * FROM task ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching tasks');
  }
});

app.post('/tasks', async (req, res) => {
  const { name, description } = req.body;
  try {
    await dbClient.query('INSERT INTO task (name, description) VALUES ($1, $2)', [name, description]);
    res.sendStatus(201);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error adding task');
  }
});

app.put('/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { column, value } = req.body;
  try {
    await dbClient.query(`UPDATE task SET ${column} = $1 WHERE id = $2`, [value, id]);
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating task');
  }
});

app.delete('/tasks/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await dbClient.query('DELETE FROM task WHERE id = $1', [id]);
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error deleting task');
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'task-manager.html'));
});

// Start the server
const server = app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

// Upgrade HTTP server for WebSocket
server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});
