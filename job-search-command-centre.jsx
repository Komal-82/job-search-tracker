import { useState, useEffect, useCallback, useRef } from "react";

const WORKSTREAMS = {
  WS1: { label: "No Listing – Network In", color: "#2D6A4F" },
  WS2: { label: "Active Listing – Apply & Connect", color: "#1B4965" },
  WS3: { label: "Referral Pipeline", color: "#7B2D8B" },
  WS4: { label: "Recruiter / Headhunter", color: "#B44215" },
};

const STAGES = {
  WS1: [
    { id: "identify", label: "Identify Contact", icon: "🔍" },
    { id: "connect", label: "Connection Sent", icon: "🔗" },
    { id: "accepted", label: "Accepted", icon: "✅" },
    { id: "message", label: "Message Sent", icon: "💬" },
    { id: "coffee", label: "Coffee Chat Booked", icon: "☕" },
    { id: "chatted", label: "Chat Done", icon: "🤝" },
    { id: "referral", label: "Referral / Lead", icon: "⭐" },
  ],
  WS2: [
    { id: "found", label: "Listing Found", icon: "📋" },
    { id: "researched", label: "Company Researched", icon: "🔎" },
    { id: "applied", label: "Applied", icon: "📨" },
    { id: "connect_ws2", label: "Insider Connected", icon: "🔗" },
    { id: "insight", label: "Got Insight", icon: "💡" },
    { id: "interview", label: "Interview Stage", icon: "🎤" },
    { id: "offer", label: "Offer / Negotiation", icon: "🏆" },
  ],
  WS3: [
    { id: "ref_identify", label: "Referrer Identified", icon: "👤" },
    { id: "ref_reached", label: "Reached Out", icon: "📩" },
    { id: "ref_briefed", label: "Briefed Them", icon: "📝" },
    { id: "ref_submitted", label: "Referral Submitted", icon: "📤" },
    { id: "ref_tracking", label: "Tracking Progress", icon: "📊" },
  ],
  WS4: [
    { id: "rec_identify", label: "Recruiter Found", icon: "🎯" },
    { id: "rec_connect", label: "Connected", icon: "🔗" },
    { id: "rec_brief", label: "Brief Shared", icon: "📄" },
    { id: "rec_active", label: "Actively Working", icon: "⚡" },
    { id: "rec_intro", label: "Intro Made", icon: "🤝" },
  ],
};

const DAILY_TASKS = [
  { id: "d1", label: "Check job boards (LinkedIn, company careers pages)", minutes: 15, category: "Discovery" },
  { id: "d2", label: "Send 2-3 personalised LinkedIn connection requests", minutes: 15, category: "Outreach" },
  { id: "d3", label: "Follow up on pending connections / messages (2-3)", minutes: 10, category: "Follow-up" },
  { id: "d4", label: "Customise and submit 1 application", minutes: 30, category: "Apply" },
  { id: "d5", label: "Update tracker with new progress", minutes: 5, category: "Admin" },
  { id: "d6", label: "Engage with 3 posts from target contacts", minutes: 10, category: "Visibility" },
  { id: "d7", label: "Research 1 company deeply (culture, team, strategy)", minutes: 15, category: "Prep" },
];

const WEEKLY_TASKS = [
  { id: "w1", label: "Publish or share 1 LinkedIn post (thought leadership)", category: "Brand" },
  { id: "w2", label: "Review and refresh target company list", category: "Strategy" },
  { id: "w3", label: "Prep for upcoming coffee chats / interviews", category: "Prep" },
  { id: "w4", label: "Audit pipeline -- move stale leads, add new ones", category: "Admin" },
  { id: "w5", label: "Reach out to 1 recruiter or headhunter", category: "Outreach" },
];

const emptyCompany = () => ({
  id: Date.now().toString(),
  name: "",
  workstream: "WS1",
  stage: "identify",
  contacts: "",
  role: "",
  notes: "",
  nextAction: "",
  nextDate: "",
  lastUpdated: new Date().toISOString().split("T")[0],
});

const getTodayKey = () => new Date().toISOString().split("T")[0];
const getWeekKey = () => {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff)).toISOString().split("T")[0];
};

export default function JobSearchHQ() {
  const [companies, setCompanies] = useState([]);
  const [dailyChecks, setDailyChecks] = useState({});
  const [weeklyChecks, setWeeklyChecks] = useState({});
  const [view, setView] = useState("pipeline");
  const [editingId, setEditingId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newCo, setNewCo] = useState(emptyCompany());
  const [loaded, setLoaded] = useState(false);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get("jobsearch-data");
        if (r?.value) {
          const d = JSON.parse(r.value);
          setCompanies(d.companies || []);
          setStreak(d.streak || 0);
        }
      } catch {}
      try {
        const r = await window.storage.get("daily-" + getTodayKey());
        if (r?.value) setDailyChecks(JSON.parse(r.value));
      } catch {}
      try {
        const r = await window.storage.get("weekly-" + getWeekKey());
        if (r?.value) setWeeklyChecks(JSON.parse(r.value));
      } catch {}
      setLoaded(true);
    })();
  }, []);

  const saveCompanies = useCallback(async (cos, s) => {
    try {
      await window.storage.set("jobsearch-data", JSON.stringify({ companies: cos, streak: s ?? streak }));
    } catch {}
  }, [streak]);

  const saveDaily = useCallback(async (checks) => {
    try { await window.storage.set("daily-" + getTodayKey(), JSON.stringify(checks)); } catch {}
  }, []);

  const saveWeekly = useCallback(async (checks) => {
    try { await window.storage.set("weekly-" + getWeekKey(), JSON.stringify(checks)); } catch {}
  }, []);

  const addCompany = () => {
    if (!newCo.name.trim()) return;
    const updated = [...companies, { ...newCo, id: Date.now().toString(), lastUpdated: getTodayKey() }];
    setCompanies(updated);
    saveCompanies(updated);
    setNewCo(emptyCompany());
    setShowAdd(false);
  };

  const updateCompany = (id, field, value) => {
    const updated = companies.map(c => c.id === id ? { ...c, [field]: value, lastUpdated: getTodayKey() } : c);
    setCompanies(updated);
    saveCompanies(updated);
  };

  const removeCompany = (id) => {
    const updated = companies.filter(c => c.id !== id);
    setCompanies(updated);
    saveCompanies(updated);
    setEditingId(null);
  };

  const toggleDaily = (id) => {
    const updated = { ...dailyChecks, [id]: !dailyChecks[id] };
    setDailyChecks(updated);
    saveDaily(updated);
  };

  const toggleWeekly = (id) => {
    const updated = { ...weeklyChecks, [id]: !weeklyChecks[id] };
    setWeeklyChecks(updated);
    saveWeekly(updated);
  };

  const dailyDone = DAILY_TASKS.filter(t => dailyChecks[t.id]).length;
  const dailyTotal = DAILY_TASKS.length;
  const weeklyDone = WEEKLY_TASKS.filter(t => weeklyChecks[t.id]).length;

  if (!loaded) return <div style={{ padding: 40, fontFamily: "'DM Sans', sans-serif", color: "#666" }}>Loading your command centre...</div>;

  const styles = {
    root: {
      fontFamily: "'DM Sans', sans-serif",
      maxWidth: 900,
      margin: "0 auto",
      padding: "24px 16px",
      color: "#1a1a1a",
      lineHeight: 1.5,
    },
    header: {
      marginBottom: 32,
    },
    h1: {
      fontSize: 26,
      fontWeight: 700,
      letterSpacing: "-0.5px",
      margin: 0,
      color: "#0f172a",
    },
    subtitle: {
      fontSize: 13,
      color: "#64748b",
      marginTop: 4,
    },
    nav: {
      display: "flex",
      gap: 0,
      borderBottom: "2px solid #e2e8f0",
      marginBottom: 24,
    },
    navBtn: (active) => ({
      padding: "10px 20px",
      fontSize: 13,
      fontWeight: active ? 600 : 400,
      color: active ? "#0f172a" : "#64748b",
      background: "none",
      border: "none",
      borderBottom: active ? "2px solid #0f172a" : "2px solid transparent",
      marginBottom: -2,
      cursor: "pointer",
      fontFamily: "inherit",
      transition: "all 0.15s",
    }),
    statsRow: {
      display: "flex",
      gap: 12,
      marginBottom: 24,
      flexWrap: "wrap",
    },
    stat: (color) => ({
      flex: "1 1 140px",
      padding: "14px 16px",
      borderRadius: 10,
      background: color + "0a",
      border: `1px solid ${color}22`,
    }),
    statNum: (color) => ({
      fontSize: 28,
      fontWeight: 700,
      color,
      lineHeight: 1,
    }),
    statLabel: {
      fontSize: 11,
      color: "#64748b",
      marginTop: 4,
      textTransform: "uppercase",
      letterSpacing: "0.5px",
    },
    card: {
      background: "#fff",
      border: "1px solid #e8ecf0",
      borderRadius: 10,
      padding: "16px 18px",
      marginBottom: 10,
      transition: "box-shadow 0.15s",
    },
    cardHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 12,
    },
    companyName: {
      fontSize: 15,
      fontWeight: 600,
      color: "#0f172a",
    },
    badge: (color) => ({
      display: "inline-block",
      fontSize: 10,
      fontWeight: 600,
      padding: "3px 8px",
      borderRadius: 20,
      background: color + "15",
      color,
      textTransform: "uppercase",
      letterSpacing: "0.3px",
      whiteSpace: "nowrap",
    }),
    stagePill: (active, color) => ({
      fontSize: 11,
      padding: "3px 8px",
      borderRadius: 6,
      background: active ? color : "#f1f5f9",
      color: active ? "#fff" : "#94a3b8",
      fontWeight: active ? 600 : 400,
      border: "none",
      cursor: "pointer",
      fontFamily: "inherit",
      transition: "all 0.15s",
    }),
    input: {
      width: "100%",
      padding: "8px 10px",
      fontSize: 13,
      border: "1px solid #d1d5db",
      borderRadius: 6,
      fontFamily: "inherit",
      boxSizing: "border-box",
      outline: "none",
    },
    select: {
      padding: "8px 10px",
      fontSize: 13,
      border: "1px solid #d1d5db",
      borderRadius: 6,
      fontFamily: "inherit",
      background: "#fff",
      outline: "none",
    },
    btn: (primary) => ({
      padding: "8px 16px",
      fontSize: 13,
      fontWeight: 500,
      borderRadius: 6,
      border: primary ? "none" : "1px solid #d1d5db",
      background: primary ? "#0f172a" : "#fff",
      color: primary ? "#fff" : "#374151",
      cursor: "pointer",
      fontFamily: "inherit",
    }),
    checkRow: (done) => ({
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "10px 14px",
      borderRadius: 8,
      background: done ? "#f0fdf4" : "#fafbfc",
      marginBottom: 6,
      cursor: "pointer",
      border: `1px solid ${done ? "#bbf7d0" : "#f0f0f0"}`,
      transition: "all 0.15s",
    }),
    checkbox: (done) => ({
      width: 18,
      height: 18,
      borderRadius: 4,
      border: `2px solid ${done ? "#16a34a" : "#cbd5e1"}`,
      background: done ? "#16a34a" : "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      fontSize: 11,
      color: "#fff",
      fontWeight: 700,
    }),
    checkLabel: (done) => ({
      fontSize: 13,
      color: done ? "#6b7280" : "#1a1a1a",
      textDecoration: done ? "line-through" : "none",
      flex: 1,
    }),
    catBadge: {
      fontSize: 10,
      padding: "2px 7px",
      borderRadius: 4,
      background: "#f1f5f9",
      color: "#64748b",
      fontWeight: 500,
      whiteSpace: "nowrap",
    },
    timeBadge: {
      fontSize: 10,
      padding: "2px 6px",
      borderRadius: 4,
      background: "#fef3c7",
      color: "#92400e",
      fontWeight: 500,
      whiteSpace: "nowrap",
    },
    progressBar: {
      height: 6,
      borderRadius: 3,
      background: "#e2e8f0",
      overflow: "hidden",
      marginTop: 6,
    },
    progressFill: (pct, color) => ({
      height: "100%",
      width: pct + "%",
      background: color,
      borderRadius: 3,
      transition: "width 0.3s ease",
    }),
  };

  const renderPipeline = () => {
    const grouped = {};
    Object.keys(WORKSTREAMS).forEach(ws => { grouped[ws] = companies.filter(c => c.workstream === ws); });

    return (
      <div>
        <div style={styles.statsRow}>
          <div style={styles.stat("#0f172a")}>
            <div style={styles.statNum("#0f172a")}>{companies.length}</div>
            <div style={styles.statLabel}>Companies</div>
          </div>
          <div style={styles.stat("#2D6A4F")}>
            <div style={styles.statNum("#2D6A4F")}>{companies.filter(c => ["coffee","chatted","referral","insight","interview","offer"].includes(c.stage)).length}</div>
            <div style={styles.statLabel}>In Conversation</div>
          </div>
          <div style={styles.stat("#1B4965")}>
            <div style={styles.statNum("#1B4965")}>{companies.filter(c => ["interview","offer"].includes(c.stage)).length}</div>
            <div style={styles.statLabel}>Interview Stage</div>
          </div>
          <div style={styles.stat("#7B2D8B")}>
            <div style={styles.statNum("#7B2D8B")}>{dailyDone}/{dailyTotal}</div>
            <div style={styles.statLabel}>Today's Tasks</div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Pipeline</h2>
          <button style={styles.btn(true)} onClick={() => setShowAdd(true)}>+ Add Company</button>
        </div>

        {showAdd && (
          <div style={{ ...styles.card, border: "2px solid #0f172a" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <input style={styles.input} placeholder="Company name" value={newCo.name} onChange={e => setNewCo({ ...newCo, name: e.target.value })} />
              <select style={styles.select} value={newCo.workstream} onChange={e => setNewCo({ ...newCo, workstream: e.target.value, stage: STAGES[e.target.value][0].id })}>
                {Object.entries(WORKSTREAMS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <input style={styles.input} placeholder="Target role" value={newCo.role} onChange={e => setNewCo({ ...newCo, role: e.target.value })} />
              <input style={styles.input} placeholder="Contact name(s)" value={newCo.contacts} onChange={e => setNewCo({ ...newCo, contacts: e.target.value })} />
            </div>
            <input style={{ ...styles.input, marginBottom: 10 }} placeholder="Next action" value={newCo.nextAction} onChange={e => setNewCo({ ...newCo, nextAction: e.target.value })} />
            <div style={{ display: "flex", gap: 8 }}>
              <button style={styles.btn(true)} onClick={addCompany}>Add</button>
              <button style={styles.btn(false)} onClick={() => { setShowAdd(false); setNewCo(emptyCompany()); }}>Cancel</button>
            </div>
          </div>
        )}

        {Object.entries(WORKSTREAMS).map(([wsKey, ws]) => {
          const cos = grouped[wsKey];
          if (!cos.length) return null;
          return (
            <div key={wsKey} style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: ws.color }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: ws.color }}>{ws.label}</span>
                <span style={{ fontSize: 11, color: "#94a3b8" }}>({cos.length})</span>
              </div>
              {cos.map(c => {
                const wsStages = STAGES[c.workstream];
                const currentIdx = wsStages.findIndex(s => s.id === c.stage);
                const isEditing = editingId === c.id;
                return (
                  <div key={c.id} style={styles.card}>
                    <div style={styles.cardHeader}>
                      <div>
                        <span style={styles.companyName}>{c.name}</span>
                        {c.role && <span style={{ fontSize: 12, color: "#64748b", marginLeft: 8 }}>{c.role}</span>}
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button style={{ ...styles.btn(false), padding: "4px 10px", fontSize: 11 }} onClick={() => setEditingId(isEditing ? null : c.id)}>
                          {isEditing ? "Close" : "Edit"}
                        </button>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 4, marginTop: 10, flexWrap: "wrap" }}>
                      {wsStages.map((s, i) => (
                        <button key={s.id} style={styles.stagePill(i <= currentIdx, ws.color)} onClick={() => updateCompany(c.id, "stage", s.id)} title={s.label}>
                          {s.icon} {i === currentIdx ? s.label : ""}
                        </button>
                      ))}
                    </div>
                    {(c.nextAction || c.contacts) && !isEditing && (
                      <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>
                        {c.nextAction && <div>→ <strong>Next:</strong> {c.nextAction} {c.nextDate && <span style={styles.timeBadge}>{c.nextDate}</span>}</div>}
                        {c.contacts && <div style={{ marginTop: 2 }}>👤 {c.contacts}</div>}
                      </div>
                    )}
                    {isEditing && (
                      <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        <input style={styles.input} placeholder="Contact(s)" value={c.contacts} onChange={e => updateCompany(c.id, "contacts", e.target.value)} />
                        <input style={styles.input} placeholder="Role" value={c.role} onChange={e => updateCompany(c.id, "role", e.target.value)} />
                        <input style={styles.input} placeholder="Next action" value={c.nextAction} onChange={e => updateCompany(c.id, "nextAction", e.target.value)} />
                        <input style={styles.input} type="date" value={c.nextDate} onChange={e => updateCompany(c.id, "nextDate", e.target.value)} />
                        <textarea style={{ ...styles.input, gridColumn: "1 / -1", minHeight: 50 }} placeholder="Notes" value={c.notes} onChange={e => updateCompany(c.id, "notes", e.target.value)} />
                        <select style={styles.select} value={c.workstream} onChange={e => { updateCompany(c.id, "workstream", e.target.value); updateCompany(c.id, "stage", STAGES[e.target.value][0].id); }}>
                          {Object.entries(WORKSTREAMS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                        <button style={{ ...styles.btn(false), color: "#dc2626", borderColor: "#fecaca" }} onClick={() => removeCompany(c.id)}>Remove</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}

        {companies.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: "#94a3b8", fontSize: 14 }}>
            No companies yet. Tap "Add Company" to start building your pipeline.
          </div>
        )}
      </div>
    );
  };

  const renderDaily = () => {
    const pct = Math.round((dailyDone / dailyTotal) * 100);
    return (
      <div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Today's Routine</h2>
            <span style={{ fontSize: 13, color: pct === 100 ? "#16a34a" : "#64748b" }}>{pct}% done</span>
          </div>
          <div style={styles.progressBar}>
            <div style={styles.progressFill(pct, pct === 100 ? "#16a34a" : "#0f172a")} />
          </div>
          <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 6 }}>~100 minutes total. Best done in 2 blocks: morning (discovery + outreach) and evening (follow-up + admin).</p>
        </div>
        {DAILY_TASKS.map(t => (
          <div key={t.id} style={styles.checkRow(dailyChecks[t.id])} onClick={() => toggleDaily(t.id)}>
            <div style={styles.checkbox(dailyChecks[t.id])}>{dailyChecks[t.id] ? "✓" : ""}</div>
            <span style={styles.checkLabel(dailyChecks[t.id])}>{t.label}</span>
            <span style={styles.catBadge}>{t.category}</span>
            <span style={styles.timeBadge}>{t.minutes}m</span>
          </div>
        ))}

        <h2 style={{ fontSize: 16, fontWeight: 600, margin: "28px 0 12px" }}>This Week</h2>
        {WEEKLY_TASKS.map(t => (
          <div key={t.id} style={styles.checkRow(weeklyChecks[t.id])} onClick={() => toggleWeekly(t.id)}>
            <div style={styles.checkbox(weeklyChecks[t.id])}>{weeklyChecks[t.id] ? "✓" : ""}</div>
            <span style={styles.checkLabel(weeklyChecks[t.id])}>{t.label}</span>
            <span style={styles.catBadge}>{t.category}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderPlaybook = () => (
    <div style={{ fontSize: 13, lineHeight: 1.7, color: "#334155" }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginTop: 0 }}>The Four Workstreams</h2>

      <div style={{ ...styles.card, borderLeft: `3px solid ${WORKSTREAMS.WS1.color}` }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: WORKSTREAMS.WS1.color, margin: "0 0 6px" }}>WS1: No Listing -- Network In</h3>
        <p style={{ margin: "0 0 6px" }}>For companies where you'd love to work but there's no open role. The goal is to build a warm relationship so you hear about roles before they're posted -- or create one.</p>
        <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}><strong>Stages:</strong> Identify contact → Send connection → Accepted → Message with context → Coffee chat → Build ongoing relationship → Get referral or inside lead</p>
      </div>

      <div style={{ ...styles.card, borderLeft: `3px solid ${WORKSTREAMS.WS2.color}` }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: WORKSTREAMS.WS2.color, margin: "0 0 6px" }}>WS2: Active Listing -- Apply & Connect</h3>
        <p style={{ margin: "0 0 6px" }}>A role exists. You apply formally AND work the inside track simultaneously. The connection gives you insight into what the hiring manager actually wants, and potentially a nudge on your application.</p>
        <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}><strong>Stages:</strong> Listing found → Company research → Apply → Connect with insider → Get insight on team/role → Interview stages → Offer/negotiation</p>
      </div>

      <div style={{ ...styles.card, borderLeft: `3px solid ${WORKSTREAMS.WS3.color}` }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: WORKSTREAMS.WS3.color, margin: "0 0 6px" }}>WS3: Referral Pipeline</h3>
        <p style={{ margin: "0 0 6px" }}>People in your existing network who work at target companies or know people who do. These are warmer leads -- ex-colleagues, alumni, industry contacts. You're asking them to refer you or make an introduction.</p>
        <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}><strong>Stages:</strong> Identify referrer → Reach out → Brief them on what you're looking for → They submit referral → Track progress</p>
      </div>

      <div style={{ ...styles.card, borderLeft: `3px solid ${WORKSTREAMS.WS4.color}` }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: WORKSTREAMS.WS4.color, margin: "0 0 6px" }}>WS4: Recruiter / Headhunter Channel</h3>
        <p style={{ margin: "0 0 6px" }}>Executive search firms and specialist recruiters working in your space (marketing, media, digital leadership across APAC). They hold mandates you'll never see on job boards.</p>
        <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}><strong>Stages:</strong> Identify recruiter → Connect → Share your brief → They actively work → Intro to hiring company</p>
      </div>

      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginTop: 28 }}>Daily Rhythm (~100 mins)</h2>
      <div style={styles.card}>
        <p style={{ margin: "0 0 8px" }}><strong>Morning block (45 mins):</strong> Scan job boards for new listings. Send 2-3 personalised connection requests. Research 1 company deeply.</p>
        <p style={{ margin: "0 0 8px" }}><strong>Midday (10 mins):</strong> Engage with 3 posts from people at target companies. Brief, thoughtful comments -- not "Great post!"</p>
        <p style={{ margin: 0 }}><strong>Evening block (45 mins):</strong> Follow up on pending connections. Customise and submit 1 application. Update your tracker.</p>
      </div>

      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginTop: 28 }}>Weekly Rhythm</h2>
      <div style={styles.card}>
        <p style={{ margin: "0 0 8px" }}><strong>Monday:</strong> Audit the pipeline. Move stale entries, add new targets, update stages.</p>
        <p style={{ margin: "0 0 8px" }}><strong>Midweek:</strong> Publish a LinkedIn post. This is your storefront -- keep it active with thought leadership around AI in marketing, media effectiveness, or data-driven creative.</p>
        <p style={{ margin: "0 0 8px" }}><strong>Friday:</strong> Reach out to 1 new recruiter. Prep for the following week's coffee chats or interviews.</p>
        <p style={{ margin: 0 }}><strong>Ongoing:</strong> Review and refresh your target company list. Aim to always have 15-20 companies across all workstreams.</p>
      </div>

      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginTop: 28 }}>Key Principles</h2>
      <div style={styles.card}>
        <p style={{ margin: "0 0 8px" }}><strong>Dual-track every application.</strong> Never just apply. Always find someone inside to connect with.</p>
        <p style={{ margin: "0 0 8px" }}><strong>Personalise every message.</strong> Reference their work, a recent post, something specific about the company.</p>
        <p style={{ margin: "0 0 8px" }}><strong>Follow up at 5-7 days.</strong> One follow-up is professional. Two is persistent. Three is too many.</p>
        <p style={{ margin: "0 0 8px" }}><strong>Track everything.</strong> If it's not in the tracker, it doesn't exist.</p>
        <p style={{ margin: 0 }}><strong>Aim for 2-3 coffee chats per week</strong> once your pipeline is warm. That's the leading indicator of progress.</p>
      </div>
    </div>
  );

  return (
    <div style={styles.root}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={styles.header}>
        <h1 style={styles.h1}>Job Search Command Centre</h1>
        <div style={styles.subtitle}>{getTodayKey()} · {companies.length} companies tracked · {dailyDone}/{dailyTotal} tasks today</div>
      </div>
      <div style={styles.nav}>
        <button style={styles.navBtn(view === "pipeline")} onClick={() => setView("pipeline")}>Pipeline</button>
        <button style={styles.navBtn(view === "daily")} onClick={() => setView("daily")}>Daily Tasks</button>
        <button style={styles.navBtn(view === "playbook")} onClick={() => setView("playbook")}>Playbook</button>
      </div>
      {view === "pipeline" && renderPipeline()}
      {view === "daily" && renderDaily()}
      {view === "playbook" && renderPlaybook()}
    </div>
  );
}
