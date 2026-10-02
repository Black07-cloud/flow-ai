import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "../data");
const DB_FILE = path.join(DATA_DIR, "db.json");

fs.mkdirSync(DATA_DIR, { recursive: true });

const initialDb = {
  tasks: [
    { id: 1, title: "Send quotation to ABC Industries", description: "Quotation requested by customer.", priority: "High", status: "In Progress", assignee: "Arun", dueDate: "2026-10-03", source: "Email" },
    { id: 2, title: "Follow up with Ravi about proposal", description: "Customer has not replied to the proposal.", priority: "Medium", status: "Pending", assignee: "Priya", dueDate: "2026-10-04", source: "Email" },
    { id: 3, title: "Prepare weekly sales report", description: "Prepare and share the weekly report.", priority: "Low", status: "Pending", assignee: "Karthik", dueDate: "2026-10-05", source: "Manual" }
  ],
  followups: [
    { id: 1, customer: "ABC Industries", contact: "sales@abc.example", lastContact: "2026-09-30", nextFollowup: "2026-10-03", status: "Pending" },
    { id: 2, customer: "Ravi Kumar", contact: "ravi@example.com", lastContact: "2026-09-29", nextFollowup: "2026-10-04", status: "Pending" }
  ],
  meetings: [
    { id: 1, title: "ABC Industries Demo", date: "2026-10-03", time: "10:30", owner: "Arun" },
    { id: 2, title: "Weekly Team Sync", date: "2026-10-04", time: "09:30", owner: "Priya" }
  ],
  inbox: [
    { id: 1, sender: "ABC Industries", subject: "Quotation needed before Friday", body: "Please send the updated quotation before Friday. Arun can handle this.", received: "Today 08:40", urgent: true },
    { id: 2, sender: "Ravi Kumar", subject: "Following up on our proposal", body: "Just checking whether there is any update on the proposal.", received: "Yesterday 17:20", urgent: false },
    { id: 3, sender: "Meena from Nova", subject: "Meeting request for next week", body: "Can we schedule a product discussion next week?", received: "Yesterday 14:10", urgent: false }
  ]
};

function readDb() {
  if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2));
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}
function writeDb(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_, res) => res.json({ ok: true, service: "FlowAI API" }));

app.get("/api/dashboard", (_, res) => {
  const db = readDb();
  res.json({
    stats: {
      totalTasks: db.tasks.length,
      overdue: db.tasks.filter(t => new Date(t.dueDate) < new Date("2026-10-02") && t.status !== "Completed").length,
      highPriority: db.tasks.filter(t => t.priority === "High" && t.status !== "Completed").length,
      pendingFollowups: db.followups.filter(f => f.status === "Pending").length
    },
    tasks: db.tasks,
    followups: db.followups,
    meetings: db.meetings
  });
});

app.get("/api/tasks", (_, res) => res.json(readDb().tasks));

app.post("/api/tasks", (req, res) => {
  const db = readDb();
  const task = {
    id: Date.now(),
    title: req.body.title || "Untitled task",
    description: req.body.description || "",
    priority: req.body.priority || "Medium",
    status: req.body.status || "Pending",
    assignee: req.body.assignee || "Unassigned",
    dueDate: req.body.dueDate || "2026-10-05",
    source: req.body.source || "AI"
  };
  db.tasks.unshift(task);
  writeDb(db);
  res.status(201).json(task);
});

app.patch("/api/tasks/:id", (req, res) => {
  const db = readDb();
  const task = db.tasks.find(t => t.id === Number(req.params.id));
  if (!task) return res.status(404).json({ error: "Task not found" });
  Object.assign(task, req.body);
  writeDb(db);
  res.json(task);
});

app.get("/api/inbox", (_, res) => res.json(readDb().inbox));

app.post("/api/ai/analyze", (req, res) => {
  const text = String(req.body.text || "");
  const lower = text.toLowerCase();
  const urgent = /urgent|asap|immediately|before friday|today|tomorrow/.test(lower);
  const priority = urgent ? "High" : /soon|follow.?up|update/.test(lower) ? "Medium" : "Low";
  const assignee = /arun/.test(lower) ? "Arun" : /priya/.test(lower) ? "Priya" : "Unassigned";
  const date = lower.includes("friday") ? "2026-10-03" : lower.includes("tomorrow") ? "2026-10-03" : "2026-10-05";
  const action = /quotation|quote/.test(lower) ? "Prepare and send quotation" :
                 /meeting|schedule/.test(lower) ? "Schedule customer meeting" :
                 /proposal/.test(lower) ? "Follow up on proposal" : "Review and respond";
  res.json({
    action,
    priority,
    assignee,
    dueDate: date,
    reasoning: `Detected ${priority.toLowerCase()} urgency from the message and extracted an actionable work item.`
  });
});

app.listen(4000, () => console.log("FlowAI API running on http://localhost:4000"));