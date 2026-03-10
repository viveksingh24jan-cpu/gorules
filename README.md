# Zen BRMS (Business Rules Management System)

A local Business Rules Management System powered by the [GoRules ZEN Engine](https://github.com/gorules/zen). This setup allows you to model, deploy, and evaluate Business Rules (DRDs) using a Camunda-like workflow.

## 🚀 Features

- **Local Rule Repository**: Deploy decision models (JDM JSON) to a local storage.
- **REST API**: Standard endpoints for deployment and evaluation.
- **Node.js Native Bindings**: High-performance execution using the Rust-based ZEN engine.
- **Web Interface**: A simple built-in UI for testing your rules.

## 🛠️ Installation & Setup

### Prerequisites
- **Node.js** (v18 or higher recommended)
- **Rust** (to build the native bindings)

### Step 1: Install Dependencies
```bash
cd bindings/nodejs
npm install
```

### Step 2: Build the Engine
Build the native Rust bindings for your platform:
```bash
npm run build:debug
```

### Step 3: Start the Server
```bash
node server.js
```
The server will be running at **`http://localhost:3000`**.

## 📖 Workflow (Model -> Deploy -> Evaluate)

### 1. Model (Design DRD)
Use the **[GoRules JDM Editor (Online)](https://editor.gorules.io)** to design your decision graphs visually.
1. Create your Decision Tables, Functions, or Switch nodes.
2. Click **Download JSON** once your model is ready.

### 2. Deploy (Save Locally)
To "deploy" your rule so it can be called by name, send a POST request to the local server.

**Endpoint:** `POST http://localhost:3000/deploy/{rule_name}`  
**Body:** The JSON content of your JDM file.

**Example (cURL):**
```bash
curl -X POST http://localhost:3000/deploy/discount_calc \
-H "Content-Type: application/json" \
-d @your_decision_model.json
```

### 3. Evaluate (Test in Postman)
Evaluate your deployed rules by name with a context object.

**Endpoint:** `POST http://localhost:3000/evaluate/discount_calc`  
**Headers:** `Content-Type: application/json`  
**Body:**
```json
{
  "context": {
    "input": 12
  }
}
```

## 🔍 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/decisions` | List all deployed rules. |
| `POST` | `/deploy/:name` | Deploy/Save a JDM JSON model. |
| `POST` | `/evaluate/:name` | Evaluate a deployed rule by name. |
| `POST` | `/evaluate` | Ad-hoc evaluation (send model + context in body). |

## 📂 Project Structure
- `bindings/nodejs/server.js`: The Express server handling deployments and evaluation.
- `bindings/nodejs/deployments/`: Directory where your deployed rules are stored.
- `bindings/nodejs/public/`: Simple web interface for testing.

---
*Built with [GoRules Zen Engine](https://github.com/gorules/zen)*
