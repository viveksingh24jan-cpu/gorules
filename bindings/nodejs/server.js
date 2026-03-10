const express = require('express');
const { ZenEngine } = require('./index');
const fs = require('fs/promises');
const path = require('path');
const app = express();
const port = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const engine = new ZenEngine();
const DEPLOY_DIR = path.join(__dirname, 'deployments');

// 1. Deploy (Save) a decision
app.post('/deploy/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const content = req.body;
    if (!content.nodes) return res.status(400).json({ error: 'Invalid JDM content' });
    
    const metadata = {
      name,
      updatedAt: new Date().toISOString(),
      nodeCount: content.nodes.length
    };
    
    await fs.mkdir(DEPLOY_DIR, { recursive: true });
    await fs.writeFile(path.join(DEPLOY_DIR, `${name}.json`), JSON.stringify(content, null, 2));
    await fs.writeFile(path.join(DEPLOY_DIR, `${name}.meta.json`), JSON.stringify(metadata, null, 2));
    
    res.json({ message: `Decision '${name}' deployed successfully.`, metadata });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 1b. Get a deployed decision
app.get('/deploy/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const content = await fs.readFile(path.join(DEPLOY_DIR, `${name}.json`), 'utf-8');
    res.json(JSON.parse(content));
  } catch (err) {
    res.status(404).json({ error: `Decision '${name}' not found.` });
  }
});

// 2. List deployed decisions
app.get('/decisions', async (req, res) => {
  try {
    const files = await fs.readdir(DEPLOY_DIR);
    res.json(files.filter(f => f.endsWith('.json')).map(f => f.replace('.json', '')));
  } catch (err) {
    res.json([]);
  }
});

// 2b. Delete a decision
app.delete('/deploy/:name', async (req, res) => {
  try {
    const { name } = req.params;
    await fs.unlink(path.join(DEPLOY_DIR, `${name}.json`));
    res.json({ message: `Decision '${name}' deleted.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Evaluate a deployed decision by name
app.post('/evaluate/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const { context, opts } = req.body;
    
    const content = await fs.readFile(path.join(DEPLOY_DIR, `${name}.json`));
    const decision = engine.createDecision(content);
    const result = await decision.evaluate(context || {}, opts || {});
    res.json(result);
  } catch (err) {
    res.status(404).json({ error: `Decision '${name}' not found or evaluation failed: ${err.message}` });
  }
});

// Original endpoint for ad-hoc evaluation
app.post('/evaluate', async (req, res) => {
  try {
    const { decision, context, opts } = req.body;
    const d = engine.createDecision(decision);
    const result = await d.evaluate(context || {}, opts || {});
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`ZEN BRMS running at http://localhost:${port}`);
  console.log(`- GET  /decisions        : List deployed rules`);
  console.log(`- POST /deploy/:name     : Deploy a new rule`);
  console.log(`- POST /evaluate/:name   : Test via Postman`);
});
