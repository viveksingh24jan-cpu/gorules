# ZEN Decision Studio

A professional, Camunda-style workbench for building, testing, and deploying business rules using the ZEN Engine.

## Features

- **Interactive DRD**: Drag-and-drop nodes to visualize your decision flow. Shift-click to connect them.
- **Advanced DMN Table**: Edit rules in a clean, professional grid with hit policy selection (First/Collect).
- **JavaScript Functions**: Write custom JS logic directly in the browser for complex data transformations.
- **Real-time Simulation**: Test your rules instantly with row highlighting and execution traces.
- **Deployment Management**: Save, load, and delete decisions from your local server.

## Getting Started

1. **Install Dependencies**:
   ```bash
   cd bindings/nodejs
   npm install
   ```

2. **Start the Studio**:
   ```bash
   node server.js
   ```

3. **Access the UI**:
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Modeling Workflow

1. **Model**: Use the toolbar to add **Input**, **Decision Table**, **Function**, and **Output** nodes.
2. **Connect**: Hold **Shift** and click one node then another to create a link.
3. **Configure**: Double-click a node (or select it and click the Edit icon) to define its logic.
4. **Simulate**: Enter test JSON in the bottom-left panel and click **RUN**. Watch matching rows highlight in green.
5. **Deploy**: Give your rule a name and click **Deploy** to save it to the server.

## API Endpoints

- `GET /decisions`: List all deployed rules.
- `GET /deploy/:name`: Fetch a specific rule.
- `POST /deploy/:name`: Save/Deploy a rule.
- `DELETE /deploy/:name`: Remove a rule.
- `POST /evaluate`: Run a simulation (passes JDM and context).
- `POST /evaluate/:name`: Evaluate a deployed rule by name.
