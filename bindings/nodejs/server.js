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
const DB_FILE = path.join(__dirname, 'deployments', 'registry.json');

// --- Enterprise Persistence Layer (Registry) ---
async function getRegistry() {
  try {
    const data = await fs.readFile(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return { decisions: {}, auditLog: [] };
  }
}

async function saveRegistry(registry) {
  await fs.mkdir(path.dirname(DB_FILE), { recursive: true });
  await fs.writeFile(DB_FILE, JSON.stringify(registry, null, 2));
}

// 1. Deploy with Versioning & Tagging
app.post('/deploy/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const { content, tag = 'LATEST', author = 'system' } = req.body;
    
    if (!content.nodes) return res.status(400).json({ error: 'Invalid JDM content' });
    
    const registry = await getRegistry();
    if (!registry.decisions[name]) registry.decisions[name] = { versions: [], activeTags: {} };
    
    const versionId = `v${registry.decisions[name].versions.length + 1}`;
    const newVersion = {
      id: versionId,
      content,
      createdAt: new Date().toISOString(),
      author,
      tag
    };
    
    registry.decisions[name].versions.push(newVersion);
    registry.decisions[name].activeTags[tag] = versionId;
    
    registry.auditLog.push({
      action: 'DEPLOY',
      name,
      versionId,
      timestamp: new Date().toISOString(),
      author
    });
    
    await saveRegistry(registry);
    res.json({ message: `Deployed ${name} ${versionId}`, version: newVersion });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. List all decisions (Enterprise View)
app.get('/decisions', async (req, res) => {
  const registry = await getRegistry();
  const summary = Object.keys(registry.decisions).map(name => ({
    name,
    latestVersion: registry.decisions[name].activeTags['LATEST'],
    productionVersion: registry.decisions[name].activeTags['PRODUCTION'],
    updatedAt: registry.decisions[name].versions.slice(-1)[0]?.createdAt
  }));
  res.json(summary);
});

// 3. Get specific version or tagged version
app.get('/deploy/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const { tag = 'LATEST', version } = req.query;
    const registry = await getRegistry();
    
    const decision = registry.decisions[name];
    if (!decision) return res.status(404).json({ error: 'Not found' });
    
    let targetVersionId = version || decision.activeTags[tag];
    const vContent = decision.versions.find(v => v.id === targetVersionId);
    
    if (!vContent) return res.status(404).json({ error: 'Version not found' });
    res.json(vContent.content);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Promote a version to PRODUCTION (Enterprise Delivery)
app.post('/promote/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const { versionId, tag = 'PRODUCTION' } = req.body;
    const registry = await getRegistry();
    
    if (!registry.decisions[name]) return res.status(404).json({ error: 'Decision not found' });
    
    registry.decisions[name].activeTags[tag] = versionId;
    registry.auditLog.push({
      action: 'PROMOTE',
      name,
      versionId,
      tag,
      timestamp: new Date().toISOString()
    });
    
    await saveRegistry(registry);
    res.json({ message: `Promoted ${name} ${versionId} to ${tag}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Delete whole decision
app.delete('/deploy/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const registry = await getRegistry();
    delete registry.decisions[name];
    await saveRegistry(registry);
    res.json({ message: `Decision '${name}' removed from registry.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Evaluate (Ad-hoc)
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

// 7. Evaluate Deployed (Production-grade Endpoint)
app.post('/evaluate/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const { context, opts, tag = 'PRODUCTION' } = req.body;
    
    const registry = await getRegistry();
    const decisionData = registry.decisions[name];
    if (!decisionData) return res.status(404).json({ error: `Decision '${name}' not found.` });
    
    const versionId = decisionData.activeTags[tag];
    const version = decisionData.versions.find(v => v.id === versionId);
    
    const decision = engine.createDecision(version.content);
    const result = await decision.evaluate(context || {}, opts || {});
    res.json({ ...result, _metadata: { name, version: versionId, tag } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`ZEN Enterprise BRMS running at http://localhost:${port}`);
});
