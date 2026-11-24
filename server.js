require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();

const origins = (process.env.CLIENT_ORIGINS || "")
  .split(",").map(s => s.trim()).filter(Boolean);

app.use(cors({ origin: origins }));
app.use(express.json());

app.get("/", (req, res) => {
  res.type("html").send(`
  <!DOCTYPE html><html><head><meta charset="utf-8">
  <title>IT Support Desk API</title>
  <style>
    body{font-family:system-ui,sans-serif;max-width:780px;margin:2rem auto;padding:0 1rem;line-height:1.5}
    table{border-collapse:collapse;width:100%;margin:1rem 0}
    th,td{border:1px solid #ccc;padding:6px 8px;text-align:left}
    code,pre{background:#f3f3f3;padding:2px 6px;border-radius:4px}
    pre{padding:12px;overflow:auto}
    h1{border-bottom:2px solid #1456a0;padding-bottom:.4rem}
  </style></head><body>
  <h1>IT Support Desk API</h1>
  <p><strong>Project:</strong> IT Support Desk<br>
     <strong>Student number:</strong> YOUR-STUDENT-NUMBER<br>
     <strong>Description:</strong> Backend for recording IT support requests
     (Network, Software, Hardware).</p>

  <h2>Live base URL</h2>
  <p><code>${req.protocol}://${req.get("host")}</code></p>
  <p>Health: <a href="/health">/health</a> &middot;
     Records: <a href="/api/records">/api/records</a></p>

  <h2>Routes</h2>
  <table>
    <tr><th>Method</th><th>Route</th><th>Purpose</th></tr>
    <tr><td>GET</td><td>/</td><td>This guide</td></tr>
    <tr><td>GET</td><td>/health</td><td>Server + DB check</td></tr>
    <tr><td>GET</td><td>/api/records</td><td>All records</td></tr>
    <tr><td>GET</td><td>/api/records/:id</td><td>One record</td></tr>
    <tr><td>POST</td><td>/api/records</td><td>Create</td></tr>
    <tr><td>PUT</td><td>/api/records/:id</td><td>Replace</td></tr>
    <tr><td>DELETE</td><td>/api/records/:id</td><td>Delete</td></tr>
  </table>

  <h2>Input fields</h2>
  <ul>
    <li><code>title</code> — 3 to 80 characters</li>
    <li><code>category</code> — 2 to 40 characters</li>
    <li><code>description</code> — 5 to 300 characters</li>
    <li><code>status</code> — Pending | In progress | Completed</li>
  </ul>

  <h2>Example POST / PUT body</h2>
  <pre>{
  "title": "Broken keyboard",
  "category": "Hardware",
  "description": "Keyboard on desk 7 has missing keys.",
  "status": "Pending"
}</pre>

  <h2>Status codes</h2>
  <p>200 OK &middot; 201 Created &middot; 400 Invalid input &middot;
     404 Not found &middot; 500 Server error &middot; 503 Database unavailable</p>
  <p><em>Note: an idle free service may take ~30s to wake up.</em></p>
  </body></html>`);
});

app.get("/health", (req, res) => {
  try {
    const db = require("./db");
    db.prepare("SELECT 1").get();
    res.status(200).json({ status: "ok", database: "ok" });
  } catch (e) {
    res.status(503).json({ status: "error", message: "Database unavailable." });
  }
});

app.use("/api/records", require("./routes/records"));

app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

app.use((err, req, res, next) => {
  console.error(err);
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Malformed JSON body." });
  }
  res.status(500).json({ message: "Unexpected server error." });
});

const port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", () => {
  console.log(`Server listening on port ${port}`);
});