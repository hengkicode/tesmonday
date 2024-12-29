const express = require('express');
const { Client } = require('pg');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// Middleware
app.use(express.static('public'));
app.use(bodyParser.json());

// PostgreSQL Client
const dbClient = new Client({
  connectionString: 'postgres://postgres:candra88@localhost:5432/tes',
});
dbClient.connect();

// API: Get all tasks
app.get('/tasks', async (req, res) => {
  try {
    const result = await dbClient.query('SELECT * FROM task ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching tasks');
  }
});

// API: Update a task
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

// API: Add a new task
app.post('/tasks', async (req, res) => {
  const { name, description } = req.body;
  try {
    await dbClient.query('INSERT INTO task (name, description) VALUES ($1, $2)', [name, description]);
    res.status(201).send('Task added');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error adding task');
  }
});

// API: Delete a task
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

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
