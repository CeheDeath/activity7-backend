const router = require("express").Router();
const db = require("../db");

const STATUSES = ["Pending", "In progress", "Completed"];

function validate(body) {
  if (!body || typeof body !== "object") return "Request body is required.";
  const { title, category, description, status } = body;

  for (const [k, v] of Object.entries({ title, category, description, status })) {
    if (typeof v !== "string") return `${k} must be a string.`;
  }

  const t = title.trim();
  const c = category.trim();
  const d = description.trim();
  const s = status.trim();

  if (t.length < 3 || t.length > 80) return "Title must have 3 to 80 characters.";
  if (c.length < 2 || c.length > 40) return "Category must have 2 to 40 characters.";
  if (d.length < 5 || d.length > 300) return "Description must have 5 to 300 characters.";
  if (!STATUSES.includes(s)) return "Status must be Pending, In progress or Completed.";
  return null;
}

function parseId(raw) {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

router.get("/", (req, res) => {
  const rows = db.prepare(
    "SELECT id, title, category, description, status FROM records ORDER BY id"
  ).all();
  res.status(200).json(rows);
});

router.get("/:id", (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ message: "id must be a positive whole number." });

  const row = db.prepare(
    "SELECT id, title, category, description, status FROM records WHERE id = ?"
  ).get(id);
  if (!row) return res.status(404).json({ message: "Record not found." });
  res.status(200).json(row);
});

router.post("/", (req, res, next) => {
  try {
    const err = validate(req.body);
    if (err) return res.status(400).json({ message: err });

    const { title, category, description, status } = req.body;
    const info = db.prepare(
      "INSERT INTO records (title, category, description, status) VALUES (?, ?, ?, ?)"
    ).run(title.trim(), category.trim(), description.trim(), status.trim());

    const row = db.prepare(
      "SELECT id, title, category, description, status FROM records WHERE id = ?"
    ).get(info.lastInsertRowid);
    res.status(201).json(row);
  } catch (e) { next(e); }
});

router.put("/:id", (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) return res.status(400).json({ message: "id must be a positive whole number." });

    const err = validate(req.body);
    if (err) return res.status(400).json({ message: err });

    const { title, category, description, status } = req.body;
    const info = db.prepare(
      "UPDATE records SET title = ?, category = ?, description = ?, status = ? WHERE id = ?"
    ).run(title.trim(), category.trim(), description.trim(), status.trim(), id);

    if (info.changes === 0) return res.status(404).json({ message: "Record not found." });

    const row = db.prepare(
      "SELECT id, title, category, description, status FROM records WHERE id = ?"
    ).get(id);
    res.status(200).json(row);
  } catch (e) { next(e); }
});

router.delete("/:id", (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) return res.status(400).json({ message: "id must be a positive whole number." });

    const info = db.prepare("DELETE FROM records WHERE id = ?").run(id);
    if (info.changes === 0) return res.status(404).json({ message: "Record not found." });
    res.status(200).json({ message: "Record deleted." });
  } catch (e) { next(e); }
});

module.exports = router;