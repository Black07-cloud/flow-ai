import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  LayoutDashboard, Inbox, CheckSquare, Clock3, CalendarDays, Users,
  BarChart3, Plug, Settings, Sparkles, Plus, Search, Bell, ArrowUpRight,
  CheckCircle2, AlertTriangle, Bot, Send, RefreshCw
} from "lucide-react";
import "./styles.css";

const API = "http://localhost:4000/api";

function App() {
  const [page, setPage] = useState("Dashboard");
  const [dashboard, setDashboard] = useState(null);
  const [inbox, setInbox] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [query, setQuery] = useState("");
  const [aiText, setAiText] = useState("");
  const [aiResult, setAiResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    const [d, i, t] = await Promise.all([
      fetch(`${API}/dashboard`).then(r => r.json()),
      fetch(`${API}/inbox`).then(r => r.json()),
      fetch(`${API}/tasks`).then(r => r.json())
    ]);
    setDashboard(d); setInbox(i); setTasks(t); setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function analyze(text) {
    setAiText(text);
    const r = await fetch(`${API}/ai/analyze`, {
      method: "POST", headers: {"Content-Type":"application/json"},
      body: JSON.stringify({text})
    });
    setAiResult(await r.json());
  }

  async function createFromAI() {
    if (!aiResult) return;
    await fetch(`${API}/tasks`, {
      method: "POST", headers: {"Content-Type":"application/json"},
      body: JSON.stringify({
        title: aiResult.action, priority: aiResult.priority,
        assignee: aiResult.assignee, dueDate: aiResult.dueDate,
        description: aiText, source: "AI Inbox"
      })
    });
    setAiResult(null); setAiText(""); await load(); setPage("Tasks");
  }

  async function toggleTask(task) {
    await fetch(`${API}/tasks/${task.id}`, {
      method: "PATCH", headers: {"Content-Type":"application/json"},
      body: JSON.stringify({status: task.status === "Completed" ? "Pending" : "Completed"})
    });
    load();
  }

  const nav = [
    ["Dashboard", LayoutDashboard], ["AI Inbox", Inbox], ["Tasks", CheckSquare],
    ["Follow-ups", Clock3], ["Meetings", CalendarDays], ["Customers", Users],
    ["Reports", BarChart3], ["Integrations", Plug], ["Settings", Settings]
  ];

  if (!dashboard) return <div className="loading">Starting FlowAI…</div>;

  return (
    <div className="app">
      <aside>
        <div className="brand"><div className="brandIcon"><Sparkles size={18}/></div><span>Flow<span>AI</span></span></div>
        <div className="workspace">ACME WORKSPACE <span>⌄</span></div>
        <nav>{nav.map(([name, Icon]) =>
          <button key={name} className={page===name?"active":""} onClick={()=>setPage(name)}>
            <Icon size={18}/>{name}
          </button>)}</nav>
        <div className="aiMini"><Sparkles size={18}/><b>AI Assistant</b><p>Turn business communication into actionable work.</p><button onClick={()=>setPage("AI Inbox")}>Open assistant →</button></div>
        <div className="profile"><div className="avatar">JP</div><div><b>Jagadeesh</b><small>Admin</small></div><Settings size={16}/></div>
      </aside>

      <main>
        <header>
          <div><h1>{page}</h1><p>{page==="Dashboard" ? "Good morning. Here is what needs attention today." : "Manage your business operations with FlowAI."}</p></div>
          <div className="headerActions"><div className="search"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search..." /></div><button className="iconBtn"><Bell size={18}/></button><button className="primary" onClick={()=>setPage("Tasks")}><Plus size={17}/> New task</button></div>
        </header>

        {page==="Dashboard" && <Dashboard dashboard={dashboard} onRefresh={load} />}
        {page==="AI Inbox" && <InboxView inbox={inbox} analyze={analyze} aiResult={aiResult} createFromAI={createFromAI} aiText={aiText} setAiText={setAiText}/>}
        {page==="Tasks" && <Tasks tasks={tasks.filter(t=>!query || JSON.stringify(t).toLowerCase().includes(query.toLowerCase()))} toggleTask={toggleTask}/>}
        {page==="Follow-ups" && <Followups data={dashboard.followups}/>}
        {page==="Meetings" && <Meetings data={dashboard.meetings}/>}
        {page==="Customers" && <Customers/>}
        {page==="Reports" && <Reports dashboard={dashboard}/>}
        {page==="Integrations" && <Integrations/>}
        {page==="Settings" && <SettingsPage/>}
      </main>
    </div>
  );
}

function Dashboard({dashboard,onRefresh}) {
  const s=dashboard.stats;
  return <section>
    <div className="statGrid">
      <Stat title="Open tasks" value={s.totalTasks} icon={CheckSquare} meta="Across your team"/>
      <Stat title="Overdue" value={s.overdue} icon={AlertTriangle} meta="Needs attention"/>
      <Stat title="High priority" value={s.highPriority} icon={ArrowUpRight} meta="Active now"/>
      <Stat title="Pending follow-ups" value={s.pendingFollowups} icon={Clock3} meta="Customer actions"/>
    </div>
    <div className="grid2">
      <Panel title="Priority tasks" action="View all">
        {dashboard.tasks.slice(0,4).map(t=><TaskRow key={t.id} task={t}/>)}
      </Panel>
      <Panel title="Upcoming meetings" action="Calendar">
        {dashboard.meetings.map(m=><div className="meeting" key={m.id}><div className="dateBox"><b>{new Date(m.date).getDate()}</b><small>OCT</small></div><div><b>{m.title}</b><small>{m.time} · {m.owner}</small></div></div>)}
      </Panel>
    </div>
    <div className="grid2">
      <Panel title="AI activity" action="Refresh" onAction={onRefresh}>
        <Activity text="Created task from customer email" time="2 min ago"/>
        <Activity text="Detected 1 high-priority message" time="18 min ago"/>
        <Activity text="Prepared follow-up reminder for Ravi Kumar" time="42 min ago"/>
      </Panel>
      <Panel title="Workflow" action="View">
        <div className="flow"><span>Email</span><i>→</i><span>Information</span><i>→</i><span>Task</span><i>→</i><span>Priority</span><i>→</i><span>Reminder</span><i>→</i><span>Follow-up</span></div>
      </Panel>
    </div>
  </section>
}

function Stat({title,value,icon:Icon,meta}) { return <div className="stat"><div className="statIcon"><Icon size={19}/></div><div><small>{title}</small><strong>{value}</strong><span>{meta}</span></div></div> }
function Panel({title,action,children,onAction}) { return <div className="panel"><div className="panelHead"><h3>{title}</h3><button onClick={onAction}>{action} →</button></div>{children}</div> }
function TaskRow({task,toggleTask}) { return <div className="taskRow"><div className="check" onClick={()=>toggleTask?.(task)}>{task.status==="Completed"?<CheckCircle2 size={18}/>:<span/>}</div><div className="taskMain"><b>{task.title}</b><small>{task.assignee} · Due {task.dueDate} · {task.source}</small></div><Badge text={task.priority}/><Badge text={task.status}/></div> }
function Badge({text}) { return <span className={`badge ${String(text).toLowerCase().replaceAll(" ","-")}`}>{text}</span> }
function Activity({text,time}) { return <div className="activity"><div className="dot"><Bot size={14}/></div><div><b>{text}</b><small>{time}</small></div></div> }

function InboxView({inbox,analyze,aiResult,createFromAI,aiText,setAiText}) {
  return <section><div className="inboxLayout"><div className="panel inboxList"><div className="panelHead"><h3>AI Inbox</h3><button><RefreshCw size={15}/> Sync</button></div>{inbox.map(m=><div className="mail" key={m.id} onClick={()=>analyze(m.body)}><div className="mailTop"><b>{m.sender}</b>{m.urgent&&<Badge text="High priority"/>}<small>{m.received}</small></div><strong>{m.subject}</strong><p>{m.body}</p><button className="ghost">Analyze with AI</button></div>)}</div>
  <div className="panel aiPanel"><div className="aiTitle"><div className="aiLogo"><Sparkles size={19}/></div><div><h3>AI Work Assistant</h3><small>Extract tasks, priority and next actions</small></div></div>
  <textarea value={aiText} onChange={e=>setAiText(e.target.value)} placeholder="Paste an email or customer request here..."/>
  <button className="primary full" onClick={()=>analyze(aiText)} disabled={!aiText.trim()}><Sparkles size={17}/> Analyze request</button>
  {aiResult&&<div className="aiResult"><h4>AI extraction</h4><div className="resultRow"><span>Action</span><b>{aiResult.action}</b></div><div className="resultRow"><span>Priority</span><Badge text={aiResult.priority}/></div><div className="resultRow"><span>Assignee</span><b>{aiResult.assignee}</b></div><div className="resultRow"><span>Due date</span><b>{aiResult.dueDate}</b></div><p className="reason"><Bot size={15}/> {aiResult.reasoning}</p><button className="primary full" onClick={createFromAI}><Plus size={17}/> Create task</button></div>}
  </div></div></section>
}

function Tasks({tasks,toggleTask}) { return <section><div className="taskToolbar"><div><b>{tasks.length} tasks</b><span> Prioritized automatically by FlowAI</span></div><button className="primary"><Plus size={17}/> Create task</button></div><div className="panel"><table><thead><tr><th>Task</th><th>Priority</th><th>Status</th><th>Assignee</th><th>Due</th><th>Source</th></tr></thead><tbody>{tasks.map(t=><tr key={t.id}><td><div className="tableTask"><div className="check" onClick={()=>toggleTask(t)}>{t.status==="Completed"?<CheckCircle2 size={17}/>:<span/>}</div><b>{t.title}</b></div></td><td><Badge text={t.priority}/></td><td><Badge text={t.status}/></td><td>{t.assignee}</td><td>{t.dueDate}</td><td>{t.source}</td></tr>)}</tbody></table></div></section> }

function Followups({data}) { return <section><div className="panel"><table><thead><tr><th>Customer</th><th>Contact</th><th>Last contact</th><th>Next follow-up</th><th>Status</th></tr></thead><tbody>{data.map(x=><tr key={x.id}><td><b>{x.customer}</b></td><td>{x.contact}</td><td>{x.lastContact}</td><td><b>{x.nextFollowup}</b></td><td><Badge text={x.status}/></td></tr>)}</tbody></table></div></section> }
function Meetings({data}) { return <section><div className="statGrid"><Stat title="Upcoming" value={data.length} icon={CalendarDays} meta="Scheduled meetings"/><Stat title="This week" value={data.length} icon={Clock3} meta="Planned"/></div><div className="panel"><table><thead><tr><th>Meeting</th><th>Date</th><th>Time</th><th>Owner</th></tr></thead><tbody>{data.map(x=><tr key={x.id}><td><b>{x.title}</b></td><td>{x.date}</td><td>{x.time}</td><td>{x.owner}</td></tr>)}</tbody></table></div></section> }
function Customers() { return <section><div className="panel empty"><Users size={34}/><h3>Customer workspace</h3><p>Customer profiles, communication history and follow-up status will live here.</p><button className="primary">Add customer</button></div></section> }
function Reports({dashboard}) { return <section><div className="statGrid"><Stat title="Open work" value={dashboard.stats.totalTasks} icon={BarChart3} meta="Current tasks"/><Stat title="High priority" value={dashboard.stats.highPriority} icon={ArrowUpRight} meta="Active"/><Stat title="Follow-ups" value={dashboard.stats.pendingFollowups} icon={Clock3} meta="Pending"/></div><div className="panel"><h3>Operational summary</h3><div className="bars"><div style={{width:"82%"}}><span>Tasks processed</span><b>82%</b></div><div style={{width:"64%"}}><span>Follow-ups completed</span><b>64%</b></div><div style={{width:"74%"}}><span>On-time work</span><b>74%</b></div></div></div></section> }
function Integrations() { return <section><div className="integrationGrid">{["Google Gmail","Google Calendar","Google Drive","Google Sheets","WhatsApp Business","SAP"].map((x,i)=><div className="integration" key={x}><div className="integrationIcon">{i<4?"G":i===4?"W":"S"}</div><div><h3>{x}</h3><p>{i<4?"Connect with OAuth and scoped API access":"Connector configuration required"}</p></div><span className="statusDot">{i<4?"Ready":"Setup"}</span></div>)}</div></section> }
function SettingsPage() { return <section><div className="panel settings"><h3>Workspace settings</h3><label>Workspace name<input defaultValue="ACME Workspace"/></label><label>Default task priority<select defaultValue="Medium"><option>Low</option><option>Medium</option><option>High</option></select></label><label><input type="checkbox" defaultChecked/> Require approval for sensitive WRITE actions</label><label><input type="checkbox" defaultChecked/> Keep audit logs for important actions</label><button className="primary">Save settings</button></div></section> }

createRoot(document.getElementById("root")).render(<App/>);