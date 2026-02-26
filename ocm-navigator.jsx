import { useState, useEffect, useCallback, useMemo, useRef } from "react";

// ─── Constants & Config ─────────────────────────────────────────────
const ADKAR = ["Awareness", "Desire", "Knowledge", "Ability", "Reinforcement"];
const DIMENSIONS = ["People", "Process", "Technology", "Org"];
const IMPACT_LEVELS = ["H", "M", "L"];
const READINESS = ["supportive", "neutral", "skeptical", "resistant"];
const ACTION_TYPES = ["Comms", "Training", "Workshop", "Coaching", "Enablement"];
const ACTION_STATUS = ["planned", "in_progress", "done"];
const ROLES = ["Sponsor", "PL", "HR", "IT", "BR", "CM", "SME"];

const COLORS = {
  bg: "#0a0e17",
  surface: "#111827",
  surfaceAlt: "#1a2236",
  border: "#1e2d4a",
  borderLight: "#2a3f6a",
  text: "#e2e8f0",
  textMuted: "#8194b2",
  accent: "#3b82f6",
  accentGlow: "rgba(59,130,246,0.15)",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  purple: "#8b5cf6",
  cyan: "#06b6d4",
  pink: "#ec4899",
  heatH: "#ef4444",
  heatM: "#f59e0b",
  heatL: "#22c55e",
};

const uid = (prefix = "") => prefix + Math.random().toString(36).slice(2, 8);

// ─── Persistence ────────────────────────────────────────────────────
const STORAGE_KEY = "ocm-nav-data";
const saveData = async (data) => {
  try { await window.storage.set(STORAGE_KEY, JSON.stringify(data)); } catch (e) { console.error(e); }
};
const loadData = async () => {
  try {
    const r = await window.storage.get(STORAGE_KEY);
    return r ? JSON.parse(r.value) : null;
  } catch { return null; }
};

const emptyPortfolio = () => ({
  initiatives: [],
  stakeholders: [],
  targetGroups: [],
  impactItems: [],
  actions: [],
  artifacts: [],
  changeProposals: [],
});

// ─── Micro Components ──────────────────────────────────────────────
const Badge = ({ children, color = COLORS.accent, small }) => (
  <span style={{
    display: "inline-block", padding: small ? "1px 6px" : "2px 10px",
    borderRadius: 4, fontSize: small ? 10 : 11, fontWeight: 600,
    background: color + "22", color, border: `1px solid ${color}44`,
    letterSpacing: 0.3, textTransform: "uppercase", whiteSpace: "nowrap"
  }}>{children}</span>
);

const levelColor = (l) => l === "H" ? COLORS.danger : l === "M" ? COLORS.warning : COLORS.success;
const statusColor = (s) => s === "done" ? COLORS.success : s === "in_progress" ? COLORS.accent : COLORS.textMuted;
const readinessColor = (r) => r === "supportive" ? COLORS.success : r === "neutral" ? COLORS.warning : r === "skeptical" ? COLORS.pink : COLORS.danger;

const Btn = ({ children, onClick, variant = "default", small, style: sx, disabled }) => {
  const base = {
    padding: small ? "4px 10px" : "8px 18px", borderRadius: 6, border: "none",
    cursor: disabled ? "not-allowed" : "pointer", fontWeight: 600,
    fontSize: small ? 12 : 13, transition: "all .15s", display: "inline-flex",
    alignItems: "center", gap: 6, opacity: disabled ? 0.4 : 1, fontFamily: "inherit",
  };
  const variants = {
    default: { background: COLORS.surfaceAlt, color: COLORS.text, border: `1px solid ${COLORS.border}` },
    primary: { background: COLORS.accent, color: "#fff" },
    danger: { background: COLORS.danger + "22", color: COLORS.danger, border: `1px solid ${COLORS.danger}44` },
    success: { background: COLORS.success + "22", color: COLORS.success, border: `1px solid ${COLORS.success}44` },
    ghost: { background: "transparent", color: COLORS.textMuted },
  };
  return <button style={{ ...base, ...variants[variant], ...sx }} onClick={onClick} disabled={disabled}>{children}</button>;
};

const Input = ({ label, value, onChange, type = "text", options, placeholder, textarea, style: sx }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 4, ...sx }}>
    {label && <label style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</label>}
    {options ? (
      <select value={value} onChange={e => onChange(e.target.value)} style={{
        background: COLORS.bg, color: COLORS.text, border: `1px solid ${COLORS.border}`,
        borderRadius: 6, padding: "8px 10px", fontSize: 13, fontFamily: "inherit", outline: "none",
      }}>
        <option value="">— Auswählen —</option>
        {options.map(o => <option key={typeof o === "string" ? o : o.value} value={typeof o === "string" ? o : o.value}>
          {typeof o === "string" ? o : o.label}
        </option>)}
      </select>
    ) : textarea ? (
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        rows={3} style={{
          background: COLORS.bg, color: COLORS.text, border: `1px solid ${COLORS.border}`,
          borderRadius: 6, padding: "8px 10px", fontSize: 13, fontFamily: "inherit", outline: "none", resize: "vertical",
        }} />
    ) : (
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{
          background: COLORS.bg, color: COLORS.text, border: `1px solid ${COLORS.border}`,
          borderRadius: 6, padding: "8px 10px", fontSize: 13, fontFamily: "inherit", outline: "none",
        }} />
    )}
  </div>
);

const Card = ({ children, style: sx, onClick }) => (
  <div onClick={onClick} style={{
    background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10,
    padding: 20, transition: "all .15s", cursor: onClick ? "pointer" : "default", ...sx,
  }}>{children}</div>
);

const Modal = ({ open, onClose, title, children, wide }) => {
  if (!open) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14,
        padding: 28, width: wide ? "min(95vw,900px)" : "min(90vw,560px)",
        maxHeight: "85vh", overflowY: "auto",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 18, color: COLORS.text }}>{title}</h3>
          <Btn variant="ghost" small onClick={onClose}>✕</Btn>
        </div>
        {children}
      </div>
    </div>
  );
};

const Tabs = ({ tabs, active, onChange }) => (
  <div style={{ display: "flex", gap: 2, background: COLORS.bg, borderRadius: 8, padding: 3 }}>
    {tabs.map(t => (
      <button key={t.key} onClick={() => onChange(t.key)} style={{
        padding: "7px 16px", borderRadius: 6, border: "none", cursor: "pointer",
        fontSize: 12, fontWeight: 600, fontFamily: "inherit", transition: "all .15s",
        background: active === t.key ? COLORS.accent : "transparent",
        color: active === t.key ? "#fff" : COLORS.textMuted,
      }}>{t.label}</button>
    ))}
  </div>
);

const EmptyState = ({ icon, title, sub, action }) => (
  <div style={{ textAlign: "center", padding: "48px 20px", color: COLORS.textMuted }}>
    <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
    <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.text, marginBottom: 6 }}>{title}</div>
    <div style={{ fontSize: 13, marginBottom: 16 }}>{sub}</div>
    {action}
  </div>
);

const DataRow = ({ label, value }) => (
  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${COLORS.border}22` }}>
    <span style={{ fontSize: 12, color: COLORS.textMuted }}>{label}</span>
    <span style={{ fontSize: 12, color: COLORS.text, fontWeight: 500 }}>{value}</span>
  </div>
);

// ─── ADKAR Coverage Calculator ──────────────────────────────────────
const calcAdkarCoverage = (actions, tgId) => {
  const cov = {};
  ADKAR.forEach(a => cov[a] = 0);
  actions.filter(a => !tgId || a.target_group_ids?.includes(tgId)).forEach(a => {
    (a.adkar_tags || []).forEach(tag => { if (cov[tag] !== undefined) cov[tag]++; });
  });
  return cov;
};

// ─── Main App ───────────────────────────────────────────────────────
export default function OCMNavigator() {
  const [data, setData] = useState(emptyPortfolio());
  const [loaded, setLoaded] = useState(false);
  const [nav, setNav] = useState("portfolio");
  const [selectedInit, setSelectedInit] = useState(null);
  const [modal, setModal] = useState(null);
  const [subTab, setSubTab] = useState("overview");

  // Load
  useEffect(() => {
    loadData().then(d => { if (d) setData(d); setLoaded(true); });
  }, []);

  // Auto-save
  useEffect(() => { if (loaded) saveData(data); }, [data, loaded]);

  const update = useCallback((fn) => setData(prev => { const next = { ...prev }; fn(next); return next; }), []);
  const initiative = useMemo(() => data.initiatives.find(i => i.id === selectedInit), [data, selectedInit]);
  const initStakeholders = useMemo(() => data.stakeholders.filter(s => s.initiative_id === selectedInit), [data, selectedInit]);
  const initTGs = useMemo(() => data.targetGroups.filter(t => t.initiative_id === selectedInit), [data, selectedInit]);
  const initImpacts = useMemo(() => data.impactItems.filter(i => i.initiative_id === selectedInit), [data, selectedInit]);
  const initActions = useMemo(() => data.actions.filter(a => a.initiative_id === selectedInit), [data, selectedInit]);

  // ── Navigation Sidebar ──
  const SideNav = () => (
    <div style={{
      width: 240, minHeight: "100vh", background: COLORS.surface,
      borderRight: `1px solid ${COLORS.border}`, display: "flex", flexDirection: "column",
      flexShrink: 0,
    }}>
      <div style={{ padding: "20px 18px 16px", borderBottom: `1px solid ${COLORS.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.purple})`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
          }}>◈</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, letterSpacing: -0.3 }}>OCM Navigator</div>
            <div style={{ fontSize: 10, color: COLORS.textMuted }}>Change Management</div>
          </div>
        </div>
      </div>
      <nav style={{ padding: "12px 10px", flex: 1 }}>
        {[
          { key: "portfolio", icon: "◫", label: "Portfolio" },
          { key: "initiative", icon: "◉", label: "Initiative", disabled: !selectedInit },
          { key: "heatmap", icon: "▦", label: "Impact Heatmap", disabled: !selectedInit },
          { key: "timeline", icon: "▬", label: "Timeline", disabled: !selectedInit },
          { key: "report", icon: "▤", label: "Statusreport", disabled: !selectedInit },
          { key: "proposals", icon: "△", label: "Vorschläge", disabled: !selectedInit },
          { key: "import", icon: "↓", label: "Import / Export" },
        ].map(item => (
          <button key={item.key} disabled={item.disabled}
            onClick={() => { setNav(item.key); if (item.key === "initiative") setSubTab("overview"); }}
            style={{
              display: "flex", alignItems: "center", gap: 10, width: "100%",
              padding: "9px 12px", borderRadius: 7, border: "none", cursor: item.disabled ? "not-allowed" : "pointer",
              background: nav === item.key ? COLORS.accentGlow : "transparent",
              color: nav === item.key ? COLORS.accent : item.disabled ? COLORS.border : COLORS.textMuted,
              fontSize: 13, fontWeight: nav === item.key ? 600 : 400, fontFamily: "inherit",
              transition: "all .15s", textAlign: "left", opacity: item.disabled ? 0.4 : 1,
              borderLeft: nav === item.key ? `2px solid ${COLORS.accent}` : "2px solid transparent",
            }}>
            <span style={{ fontSize: 16, width: 20, textAlign: "center" }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
      {selectedInit && initiative && (
        <div style={{ padding: "12px 16px", borderTop: `1px solid ${COLORS.border}`, fontSize: 11, color: COLORS.textMuted }}>
          <div style={{ fontWeight: 600, color: COLORS.text, marginBottom: 2 }}>{initiative.name}</div>
          <Badge color={COLORS.accent} small>{initiative.priority || "Normal"}</Badge>
        </div>
      )}
    </div>
  );

  // ── Portfolio View ──
  const PortfolioView = () => {
    const [showNew, setShowNew] = useState(false);
    const [form, setForm] = useState({ name: "", goal: "", scope: "", priority: "High", time_window: "" });
    const addInit = () => {
      if (!form.name) return;
      update(d => d.initiatives.push({ id: uid("INI-"), ...form, milestones: [], assumptions: [], risks: [], created: new Date().toISOString() }));
      setForm({ name: "", goal: "", scope: "", priority: "High", time_window: "" });
      setShowNew(false);
    };
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, color: COLORS.text, fontWeight: 700 }}>Change Portfolio</h2>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: COLORS.textMuted }}>
              {data.initiatives.length} Initiative{data.initiatives.length !== 1 ? "n" : ""}
            </p>
          </div>
          <Btn variant="primary" onClick={() => setShowNew(true)}>＋ Neue Initiative</Btn>
        </div>
        {data.initiatives.length === 0 ? (
          <EmptyState icon="◫" title="Noch keine Initiativen" sub="Erstelle deine erste Change-Initiative" action={<Btn variant="primary" onClick={() => setShowNew(true)}>＋ Initiative erstellen</Btn>} />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 14 }}>
            {data.initiatives.map(ini => {
              const acts = data.actions.filter(a => a.initiative_id === ini.id);
              const done = acts.filter(a => a.status === "done").length;
              const pct = acts.length ? Math.round(done / acts.length * 100) : 0;
              return (
                <Card key={ini.id} onClick={() => { setSelectedInit(ini.id); setNav("initiative"); setSubTab("overview"); }}
                  style={{ cursor: "pointer", borderColor: selectedInit === ini.id ? COLORS.accent : COLORS.border }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.text }}>{ini.name}</div>
                    <Badge color={ini.priority === "High" ? COLORS.danger : ini.priority === "Medium" ? COLORS.warning : COLORS.success} small>{ini.priority}</Badge>
                  </div>
                  <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 12, minHeight: 32 }}>{ini.goal || "Kein Ziel definiert"}</div>
                  <div style={{ display: "flex", gap: 16, fontSize: 11, color: COLORS.textMuted, marginBottom: 10 }}>
                    <span>{data.stakeholders.filter(s => s.initiative_id === ini.id).length} Stakeholder</span>
                    <span>{data.impactItems.filter(i => i.initiative_id === ini.id).length} Impacts</span>
                    <span>{acts.length} Maßnahmen</span>
                  </div>
                  <div style={{ background: COLORS.bg, borderRadius: 4, height: 6, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: `linear-gradient(90deg,${COLORS.accent},${COLORS.purple})`, borderRadius: 4, transition: "width .3s" }} />
                  </div>
                  <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 4 }}>{pct}% abgeschlossen</div>
                </Card>
              );
            })}
          </div>
        )}
        <Modal open={showNew} onClose={() => setShowNew(false)} title="Neue Initiative">
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Input label="Name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="z.B. ERP Migration Wave 1" />
            <Input label="Ziel" value={form.goal} onChange={v => setForm(f => ({ ...f, goal: v }))} textarea placeholder="Was soll erreicht werden?" />
            <Input label="Scope" value={form.scope} onChange={v => setForm(f => ({ ...f, scope: v }))} placeholder="z.B. DACH Region, 500 MA" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Input label="Priorität" value={form.priority} onChange={v => setForm(f => ({ ...f, priority: v }))} options={["High", "Medium", "Low"]} />
              <Input label="Zeitfenster" value={form.time_window} onChange={v => setForm(f => ({ ...f, time_window: v }))} placeholder="Q2–Q4 2026" />
            </div>
            <Btn variant="primary" onClick={addInit} style={{ alignSelf: "flex-end", marginTop: 8 }}>Initiative erstellen</Btn>
          </div>
        </Modal>
      </div>
    );
  };

  // ── Initiative Detail View ──
  const InitiativeView = () => {
    if (!initiative) return <EmptyState icon="◉" title="Keine Initiative ausgewählt" sub="Wähle eine Initiative im Portfolio" />;
    const tabs = [
      { key: "overview", label: "Übersicht" },
      { key: "stakeholders", label: `Stakeholder (${initStakeholders.length})` },
      { key: "targets", label: `Zielgruppen (${initTGs.length})` },
      { key: "impacts", label: `Impacts (${initImpacts.length})` },
      { key: "actions", label: `Maßnahmen (${initActions.length})` },
    ];
    return (
      <div>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 22, color: COLORS.text }}>{initiative.name}</h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: COLORS.textMuted }}>{initiative.goal}</p>
        </div>
        <Tabs tabs={tabs} active={subTab} onChange={setSubTab} />
        <div style={{ marginTop: 20 }}>
          {subTab === "overview" && <OverviewTab />}
          {subTab === "stakeholders" && <StakeholderTab />}
          {subTab === "targets" && <TargetGroupTab />}
          {subTab === "impacts" && <ImpactTab />}
          {subTab === "actions" && <ActionTab />}
        </div>
      </div>
    );
  };

  // ── Overview Tab ──
  const OverviewTab = () => {
    const adkar = calcAdkarCoverage(initActions);
    const statusCounts = { planned: 0, in_progress: 0, done: 0 };
    initActions.forEach(a => statusCounts[a.status]++);
    const deleteInit = () => {
      if (!confirm("Initiative wirklich löschen?")) return;
      update(d => {
        d.initiatives = d.initiatives.filter(i => i.id !== selectedInit);
        d.stakeholders = d.stakeholders.filter(s => s.initiative_id !== selectedInit);
        d.targetGroups = d.targetGroups.filter(t => t.initiative_id !== selectedInit);
        d.impactItems = d.impactItems.filter(i => i.initiative_id !== selectedInit);
        d.actions = d.actions.filter(a => a.initiative_id !== selectedInit);
      });
      setSelectedInit(null);
      setNav("portfolio");
    };
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card>
          <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.textMuted, marginBottom: 12 }}>DETAILS</div>
          <DataRow label="Scope" value={initiative.scope || "–"} />
          <DataRow label="Priorität" value={initiative.priority} />
          <DataRow label="Zeitfenster" value={initiative.time_window || "–"} />
          <DataRow label="Stakeholder" value={initStakeholders.length} />
          <DataRow label="Zielgruppen" value={initTGs.length} />
          <DataRow label="Impacts" value={initImpacts.length} />
          <DataRow label="Maßnahmen" value={initActions.length} />
          <div style={{ marginTop: 16 }}>
            <Btn variant="danger" small onClick={deleteInit}>Initiative löschen</Btn>
          </div>
        </Card>
        <Card>
          <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.textMuted, marginBottom: 12 }}>ADKAR-ABDECKUNG</div>
          {ADKAR.map(a => (
            <div key={a} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                <span style={{ color: COLORS.text }}>{a}</span>
                <span style={{ color: COLORS.textMuted }}>{adkar[a]} Maßn.</span>
              </div>
              <div style={{ background: COLORS.bg, borderRadius: 3, height: 5, overflow: "hidden" }}>
                <div style={{
                  width: `${Math.min(adkar[a] * 20, 100)}%`, height: "100%", borderRadius: 3,
                  background: adkar[a] === 0 ? COLORS.danger : adkar[a] < 3 ? COLORS.warning : COLORS.success,
                  transition: "width .3s",
                }} />
              </div>
            </div>
          ))}
        </Card>
        <Card>
          <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.textMuted, marginBottom: 12 }}>MAÜNAHMEN-STATUS</div>
          <div style={{ display: "flex", gap: 12 }}>
            {Object.entries(statusCounts).map(([s, c]) => (
              <div key={s} style={{ flex: 1, textAlign: "center", padding: 12, background: COLORS.bg, borderRadius: 8 }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: statusColor(s) }}>{c}</div>
                <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>{s === "planned" ? "Geplant" : s === "in_progress" ? "In Arbeit" : "Fertig"}</div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.textMuted, marginBottom: 12 }}>IMPACT-VERTEILUNG</div>
          {DIMENSIONS.map(dim => {
            const items = initImpacts.filter(i => i.dimension === dim);
            const high = items.filter(i => i.impact_level === "H").length;
            return (
              <div key={dim} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: COLORS.text, width: 80 }}>{dim}</span>
                <div style={{ flex: 1, display: "flex", gap: 4 }}>
                  {items.map((it, i) => (
                    <div key={i} style={{ width: 14, height: 14, borderRadius: 3, background: levelColor(it.impact_level) }} title={it.change_description} />
                  ))}
                  {items.length === 0 && <span style={{ fontSize: 11, color: COLORS.textMuted }}>–</span>}
                </div>
                {high > 0 && <Badge color={COLORS.danger} small>{high}H</Badge>}
              </div>
            );
          })}
        </Card>
      </div>
    );
  };

  // ── Stakeholder Tab ──
  const StakeholderTab = () => {
    const [showForm, setShowForm] = useState(false);
    const empty = { name: "", role: "BR", function: "", org_unit: "", influence: "M", interest: "M", readiness: "neutral", notes: "" };
    const [form, setForm] = useState(empty);
    const add = () => {
      if (!form.name) return;
      update(d => d.stakeholders.push({ id: uid("S-"), initiative_id: selectedInit, ...form }));
      setForm(empty); setShowForm(false);
    };
    const remove = (id) => update(d => d.stakeholders = d.stakeholders.filter(s => s.id !== id));
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>Stakeholder-Register</div>
          <Btn variant="primary" small onClick={() => setShowForm(true)}>＋ Hinzufügen</Btn>
        </div>
        {initStakeholders.length === 0 ? (
          <EmptyState icon="👤" title="Keine Stakeholder" sub="Füge Stakeholder hinzu" />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  {["Name", "Rolle", "Funktion", "OE", "Einfluss", "Interesse", "Readiness", ""].map(h => (
                    <th key={h} style={{ padding: "8px 10px", textAlign: "left", color: COLORS.textMuted, fontWeight: 600, fontSize: 11, textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {initStakeholders.map(s => (
                  <tr key={s.id} style={{ borderBottom: `1px solid ${COLORS.border}22` }}>
                    <td style={{ padding: "8px 10px", color: COLORS.text, fontWeight: 500 }}>{s.name}</td>
                    <td style={{ padding: "8px 10px" }}><Badge color={COLORS.purple} small>{s.role}</Badge></td>
                    <td style={{ padding: "8px 10px", color: COLORS.textMuted }}>{s.function}</td>
                    <td style={{ padding: "8px 10px", color: COLORS.textMuted }}>{s.org_unit}</td>
                    <td style={{ padding: "8px 10px" }}><Badge color={levelColor(s.influence)} small>{s.influence}</Badge></td>
                    <td style={{ padding: "8px 10px" }}><Badge color={levelColor(s.interest)} small>{s.interest}</Badge></td>
                    <td style={{ padding: "8px 10px" }}><Badge color={readinessColor(s.readiness)} small>{s.readiness}</Badge></td>
                    <td style={{ padding: "8px 10px" }}><Btn variant="ghost" small onClick={() => remove(s.id)}>✕</Btn></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Modal open={showForm} onClose={() => setShowForm(false)} title="Stakeholder hinzufügen">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Input label="Name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="Max Mustermann" />
            <Input label="Rolle" value={form.role} onChange={v => setForm(f => ({ ...f, role: v }))} options={ROLES} />
            <Input label="Funktion" value={form.function} onChange={v => setForm(f => ({ ...f, function: v }))} placeholder="Abteilungsleiter" />
            <Input label="Org.-Einheit" value={form.org_unit} onChange={v => setForm(f => ({ ...f, org_unit: v }))} placeholder="Finance" />
            <Input label="Einfluss" value={form.influence} onChange={v => setForm(f => ({ ...f, influence: v }))} options={IMPACT_LEVELS} />
            <Input label="Interesse" value={form.interest} onChange={v => setForm(f => ({ ...f, interest: v }))} options={IMPACT_LEVELS} />
            <Input label="Readiness" value={form.readiness} onChange={v => setForm(f => ({ ...f, readiness: v }))} options={READINESS} />
            <Input label="Notizen" value={form.notes} onChange={v => setForm(f => ({ ...f, notes: v }))} textarea style={{ gridColumn: "1/-1" }} />
          </div>
          <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}><Btn variant="primary" onClick={add}>Speichern</Btn></div>
        </Modal>
      </div>
    );
  };

  // ── Target Group Tab ──
  const TargetGroupTab = () => {
    const [showForm, setShowForm] = useState(false);
    const empty = { name: "", size: "", org_units: "", locations: "" };
    const [form, setForm] = useState(empty);
    const add = () => {
      if (!form.name) return;
      update(d => d.targetGroups.push({
        id: uid("TG-"), initiative_id: selectedInit, name: form.name,
        size: parseInt(form.size) || 0, org_units: form.org_units.split(",").map(s => s.trim()).filter(Boolean),
        locations: form.locations.split(",").map(s => s.trim()).filter(Boolean),
      }));
      setForm(empty); setShowForm(false);
    };
    const remove = (id) => update(d => d.targetGroups = d.targetGroups.filter(t => t.id !== id));
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>Zielgruppen</div>
          <Btn variant="primary" small onClick={() => setShowForm(true)}>＋ Hinzufügen</Btn>
        </div>
        {initTGs.length === 0 ? (
          <EmptyState icon="👥" title="Keine Zielgruppen" sub="Definiere betroffene Zielgruppen" />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 12 }}>
            {initTGs.map(tg => (
              <Card key={tg.id}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>{tg.name}</div>
                  <Btn variant="ghost" small onClick={() => remove(tg.id)}>✕</Btn>
                </div>
                <DataRow label="Größe" value={tg.size} />
                <DataRow label="OE" value={tg.org_units?.join(", ") || "–"} />
                <DataRow label="Standorte" value={tg.locations?.join(", ") || "–"} />
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 4 }}>ADKAR-Abdeckung</div>
                  <div style={{ display: "flex", gap: 4 }}>
                    {ADKAR.map(a => {
                      const c = calcAdkarCoverage(initActions, tg.id)[a];
                      return <Badge key={a} color={c === 0 ? COLORS.danger : c < 2 ? COLORS.warning : COLORS.success} small>{a[0]}:{c}</Badge>;
                    })}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
        <Modal open={showForm} onClose={() => setShowForm(false)} title="Zielgruppe hinzufügen">
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Input label="Name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="z.B. Vertrieb Außendienst" />
            <Input label="Größe (Personen)" value={form.size} onChange={v => setForm(f => ({ ...f, size: v }))} type="number" />
            <Input label="Org.-Einheiten (kommagetrennt)" value={form.org_units} onChange={v => setForm(f => ({ ...f, org_units: v }))} />
            <Input label="Standorte (kommagetrennt)" value={form.locations} onChange={v => setForm(f => ({ ...f, locations: v }))} />
          </div>
          <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}><Btn variant="primary" onClick={add}>Speichern</Btn></div>
        </Modal>
      </div>
    );
  };

  // ── Impact Tab ──
  const ImpactTab = () => {
    const [showForm, setShowForm] = useState(false);
    const empty = { target_group_id: "", dimension: "People", change_description: "", impact_level: "M", criticality: "M", training_need: "M", comms_need: "M" };
    const [form, setForm] = useState(empty);
    const add = () => {
      if (!form.change_description) return;
      update(d => d.impactItems.push({ id: uid("I-"), initiative_id: selectedInit, ...form, dependencies: [] }));
      setForm(empty); setShowForm(false);
    };
    const remove = (id) => update(d => d.impactItems = d.impactItems.filter(i => i.id !== id));
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>Impact Items</div>
          <Btn variant="primary" small onClick={() => setShowForm(true)}>＋ Hinzufügen</Btn>
        </div>
        {initImpacts.length === 0 ? (
          <EmptyState icon="⚡" title="Keine Impacts" sub="Erfasse Change-Impacts" />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  {["Zielgruppe", "Dimension", "Beschreibung", "Impact", "Kritik.", "Training", "Komm.", ""].map(h => (
                    <th key={h} style={{ padding: "8px 10px", textAlign: "left", color: COLORS.textMuted, fontWeight: 600, fontSize: 11, textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {initImpacts.map(imp => {
                  const tg = initTGs.find(t => t.id === imp.target_group_id);
                  return (
                    <tr key={imp.id} style={{ borderBottom: `1px solid ${COLORS.border}22` }}>
                      <td style={{ padding: "8px 10px", color: COLORS.text }}>{tg?.name || "–"}</td>
                      <td style={{ padding: "8px 10px" }}><Badge color={COLORS.cyan} small>{imp.dimension}</Badge></td>
                      <td style={{ padding: "8px 10px", color: COLORS.textMuted, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{imp.change_description}</td>
                      <td style={{ padding: "8px 10px" }}><Badge color={levelColor(imp.impact_level)} small>{imp.impact_level}</Badge></td>
                      <td style={{ padding: "8px 10px" }}><Badge color={levelColor(imp.criticality)} small>{imp.criticality}</Badge></td>
                      <td style={{ padding: "8px 10px" }}><Badge color={levelColor(imp.training_need)} small>{imp.training_need}</Badge></td>
                      <td style={{ padding: "8px 10px" }}><Badge color={levelColor(imp.comms_need)} small>{imp.comms_need}</Badge></td>
                      <td style={{ padding: "8px 10px" }}><Btn variant="ghost" small onClick={() => remove(imp.id)}>✕</Btn></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Modal open={showForm} onClose={() => setShowForm(false)} title="Impact Item hinzufügen">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Input label="Zielgruppe" value={form.target_group_id} onChange={v => setForm(f => ({ ...f, target_group_id: v }))} options={initTGs.map(t => ({ value: t.id, label: t.name }))} />
            <Input label="Dimension" value={form.dimension} onChange={v => setForm(f => ({ ...f, dimension: v }))} options={DIMENSIONS} />
            <Input label="Beschreibung" value={form.change_description} onChange={v => setForm(f => ({ ...f, change_description: v }))} textarea style={{ gridColumn: "1/-1" }} />
            <Input label="Impact Level" value={form.impact_level} onChange={v => setForm(f => ({ ...f, impact_level: v }))} options={IMPACT_LEVELS} />
            <Input label="Kritikalität" value={form.criticality} onChange={v => setForm(f => ({ ...f, criticality: v }))} options={IMPACT_LEVELS} />
            <Input label="Training-Bedarf" value={form.training_need} onChange={v => setForm(f => ({ ...f, training_need: v }))} options={IMPACT_LEVELS} />
            <Input label="Komm.-Bedarf" value={form.comms_need} onChange={v => setForm(f => ({ ...f, comms_need: v }))} options={IMPACT_LEVELS} />
          </div>
          <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}><Btn variant="primary" onClick={add}>Speichern</Btn></div>
        </Modal>
      </div>
    );
  };

  // ── Action Tab ──
  const ActionTab = () => {
    const [showForm, setShowForm] = useState(false);
    const empty = { type: "Comms", title: "", adkar_tags: [], target_group_ids: [], owner_person_id: "", due_date: "", status: "planned", depends_on: [] };
    const [form, setForm] = useState(empty);
    const toggleAdkar = (tag) => setForm(f => ({ ...f, adkar_tags: f.adkar_tags.includes(tag) ? f.adkar_tags.filter(t => t !== tag) : [...f.adkar_tags, tag] }));
    const toggleTG = (id) => setForm(f => ({ ...f, target_group_ids: f.target_group_ids.includes(id) ? f.target_group_ids.filter(t => t !== id) : [...f.target_group_ids, id] }));
    const add = () => {
      if (!form.title) return;
      update(d => d.actions.push({ id: uid("A-"), initiative_id: selectedInit, ...form, linked_artifact_ids: [] }));
      setForm(empty); setShowForm(false);
    };
    const remove = (id) => update(d => d.actions = d.actions.filter(a => a.id !== id));
    const cycleStatus = (id) => {
      update(d => {
        const a = d.actions.find(a => a.id === id);
        if (a) a.status = a.status === "planned" ? "in_progress" : a.status === "in_progress" ? "done" : "planned";
      });
    };
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>Maßnahmen</div>
          <Btn variant="primary" small onClick={() => setShowForm(true)}>＋ Hinzufügen</Btn>
        </div>
        {initActions.length === 0 ? (
          <EmptyState icon="📋" title="Keine Maßnahmen" sub="Plane Change-Maßnahmen" />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {initActions.map(a => {
              const owner = initStakeholders.find(s => s.id === a.owner_person_id);
              return (
                <Card key={a.id} style={{ padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <span onClick={() => cycleStatus(a.id)} style={{
                          cursor: "pointer", width: 18, height: 18, borderRadius: 4, display: "inline-flex",
                          alignItems: "center", justifyContent: "center", fontSize: 10,
                          background: statusColor(a.status) + "22", color: statusColor(a.status),
                          border: `1px solid ${statusColor(a.status)}44`,
                        }}>{a.status === "done" ? "✓" : a.status === "in_progress" ? "▶" : "○"}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>{a.title}</span>
                        <Badge color={COLORS.cyan} small>{a.type}</Badge>
                      </div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {(a.adkar_tags || []).map(t => <Badge key={t} color={COLORS.purple} small>{t}</Badge>)}
                        {a.due_date && <Badge color={COLORS.textMuted} small>📅 {a.due_date}</Badge>}
                        {owner && <Badge color={COLORS.textMuted} small>👤 {owner.name}</Badge>}
                      </div>
                    </div>
                    <Btn variant="ghost" small onClick={() => remove(a.id)}>✕</Btn>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
        <Modal open={showForm} onClose={() => setShowForm(false)} title="Maßnahme hinzufügen" wide>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Input label="Titel" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="z.B. Kick-off Kommunikation" style={{ gridColumn: "1/-1" }} />
            <Input label="Typ" value={form.type} onChange={v => setForm(f => ({ ...f, type: v }))} options={ACTION_TYPES} />
            <Input label="Owner" value={form.owner_person_id} onChange={v => setForm(f => ({ ...f, owner_person_id: v }))} options={initStakeholders.map(s => ({ value: s.id, label: s.name }))} />
            <Input label="Fällig am" value={form.due_date} onChange={v => setForm(f => ({ ...f, due_date: v }))} type="date" />
            <Input label="Status" value={form.status} onChange={v => setForm(f => ({ ...f, status: v }))} options={ACTION_STATUS} />
          </div>
          <div style={{ marginTop: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, textTransform: "uppercase" }}>ADKAR-Tags</label>
            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
              {ADKAR.map(a => (
                <button key={a} onClick={() => toggleAdkar(a)} style={{
                  padding: "5px 12px", borderRadius: 5, border: "none", cursor: "pointer",
                  fontSize: 12, fontFamily: "inherit", fontWeight: 600,
                  background: form.adkar_tags.includes(a) ? COLORS.purple : COLORS.bg,
                  color: form.adkar_tags.includes(a) ? "#fff" : COLORS.textMuted,
                }}>{a}</button>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, textTransform: "uppercase" }}>Zielgruppen</label>
            <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
              {initTGs.map(tg => (
                <button key={tg.id} onClick={() => toggleTG(tg.id)} style={{
                  padding: "5px 12px", borderRadius: 5, border: "none", cursor: "pointer",
                  fontSize: 12, fontFamily: "inherit", fontWeight: 600,
                  background: form.target_group_ids.includes(tg.id) ? COLORS.accent : COLORS.bg,
                  color: form.target_group_ids.includes(tg.id) ? "#fff" : COLORS.textMuted,
                }}>{tg.name}</button>
              ))}
              {initTGs.length === 0 && <span style={{ fontSize: 12, color: COLORS.textMuted }}>Keine Zielgruppen vorhanden</span>}
            </div>
          </div>
          <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}><Btn variant="primary" onClick={add}>Speichern</Btn></div>
        </Modal>
      </div>
    );
  };

  // ── Impact Heatmap View ──
  const HeatmapView = () => {
    if (!initiative) return <EmptyState icon="▦" title="Keine Initiative ausgewählt" sub="" />;
    if (initTGs.length === 0 || initImpacts.length === 0) return (
      <div>
        <h2 style={{ margin: "0 0 8px", fontSize: 22, color: COLORS.text }}>Impact Heatmap</h2>
        <EmptyState icon="▦" title="Nicht genug Daten" sub="Zielgruppen und Impacts werden benötigt" />
      </div>
    );
    const getMax = (tgId, dim) => {
      const items = initImpacts.filter(i => i.target_group_id === tgId && i.dimension === dim);
      if (items.length === 0) return null;
      if (items.some(i => i.impact_level === "H")) return "H";
      if (items.some(i => i.impact_level === "M")) return "M";
      return "L";
    };
    const getTooltip = (tgId, dim) => {
      return initImpacts.filter(i => i.target_group_id === tgId && i.dimension === dim)
        .map(i => `${i.change_description} (Impact:${i.impact_level} Crit:${i.criticality} Train:${i.training_need})`).join("\n");
    };
    return (
      <div>
        <h2 style={{ margin: "0 0 20px", fontSize: 22, color: COLORS.text }}>Impact Heatmap</h2>
        <Card>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ padding: 12, textAlign: "left", color: COLORS.textMuted, fontSize: 11, fontWeight: 600, borderBottom: `1px solid ${COLORS.border}` }}>ZIELGRUPPE</th>
                  {DIMENSIONS.map(d => (
                    <th key={d} style={{ padding: 12, textAlign: "center", color: COLORS.textMuted, fontSize: 11, fontWeight: 600, borderBottom: `1px solid ${COLORS.border}` }}>{d.toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {initTGs.map(tg => (
                  <tr key={tg.id}>
                    <td style={{ padding: 12, fontSize: 13, fontWeight: 500, color: COLORS.text, borderBottom: `1px solid ${COLORS.border}22` }}>
                      {tg.name} <span style={{ fontSize: 11, color: COLORS.textMuted }}>({tg.size})</span>
                    </td>
                    {DIMENSIONS.map(d => {
                      const lvl = getMax(tg.id, d);
                      return (
                        <td key={d} title={getTooltip(tg.id, d)} style={{ padding: 12, textAlign: "center", borderBottom: `1px solid ${COLORS.border}22` }}>
                          {lvl ? (
                            <div style={{
                              width: 44, height: 44, borderRadius: 8, margin: "0 auto",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              background: levelColor(lvl) + "22", color: levelColor(lvl),
                              fontSize: 16, fontWeight: 700, border: `2px solid ${levelColor(lvl)}44`,
                            }}>{lvl}</div>
                          ) : (
                            <div style={{ color: COLORS.border, fontSize: 12 }}>–</div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 16, justifyContent: "center" }}>
            {[["H", "Hoch", COLORS.danger], ["M", "Mittel", COLORS.warning], ["L", "Niedrig", COLORS.success]].map(([l, label, c]) => (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: COLORS.textMuted }}>
                <div style={{ width: 16, height: 16, borderRadius: 4, background: c + "22", border: `2px solid ${c}44` }} />
                {label}
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  };

  // ── Timeline View ──
  const TimelineView = () => {
    if (!initiative) return <EmptyState icon="▬" title="Keine Initiative ausgewählt" sub="" />;
    const sorted = [...initActions].sort((a, b) => (a.due_date || "9999").localeCompare(b.due_date || "9999"));
    const months = {};
    sorted.forEach(a => {
      const m = a.due_date ? a.due_date.slice(0, 7) : "undatiert";
      if (!months[m]) months[m] = [];
      months[m].push(a);
    });
    return (
      <div>
        <h2 style={{ margin: "0 0 20px", fontSize: 22, color: COLORS.text }}>Timeline</h2>
        {sorted.length === 0 ? (
          <EmptyState icon="▬" title="Keine Maßnahmen" sub="Erstelle Maßnahmen mit Fälligkeitsdaten" />
        ) : (
          <div style={{ position: "relative", paddingLeft: 24 }}>
            <div style={{ position: "absolute", left: 9, top: 0, bottom: 0, width: 2, background: COLORS.border }} />
            {Object.entries(months).map(([m, actions]) => (
              <div key={m} style={{ marginBottom: 28 }}>
                <div style={{
                  position: "relative", marginBottom: 12, fontSize: 13, fontWeight: 700,
                  color: COLORS.accent, paddingLeft: 16,
                }}>
                  <div style={{
                    position: "absolute", left: -20, top: 2, width: 14, height: 14, borderRadius: "50%",
                    background: COLORS.accent, border: `3px solid ${COLORS.surface}`,
                  }} />
                  {m === "undatiert" ? "Ohne Datum" : new Date(m + "-01").toLocaleDateString("de-DE", { month: "long", year: "numeric" })}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingLeft: 16 }}>
                  {actions.map(a => {
                    const owner = initStakeholders.find(s => s.id === a.owner_person_id);
                    return (
                      <Card key={a.id} style={{ padding: 12, borderLeft: `3px solid ${statusColor(a.status)}` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, marginBottom: 4 }}>{a.title}</div>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                              <Badge color={COLORS.cyan} small>{a.type}</Badge>
                              <Badge color={statusColor(a.status)} small>{a.status}</Badge>
                              {owner && <Badge color={COLORS.textMuted} small>👤 {owner.name}</Badge>}
                              {(a.adkar_tags || []).map(t => <Badge key={t} color={COLORS.purple} small>{t}</Badge>)}
                            </div>
                          </div>
                          <div style={{ fontSize: 12, color: COLORS.textMuted, whiteSpace: "nowrap" }}>{a.due_date || ""}</div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ── Status Report View ──
  const ReportView = () => {
    if (!initiative) return <EmptyState icon="▤" title="Keine Initiative ausgewählt" sub="" />;
    const done = initActions.filter(a => a.status === "done").length;
    const inProg = initActions.filter(a => a.status === "in_progress").length;
    const planned = initActions.filter(a => a.status === "planned").length;
    const pct = initActions.length ? Math.round(done / initActions.length * 100) : 0;
    const highImpacts = initImpacts.filter(i => i.impact_level === "H");
    const resistants = initStakeholders.filter(s => s.readiness === "resistant" || s.readiness === "skeptical");
    const adkar = calcAdkarCoverage(initActions);
    const gaps = ADKAR.filter(a => adkar[a] === 0);
    const upcoming = initActions.filter(a => a.status !== "done" && a.due_date).sort((a, b) => a.due_date.localeCompare(b.due_date)).slice(0, 5);

    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 22, color: COLORS.text }}>Statusreport</h2>
          <Badge color={COLORS.accent}>{new Date().toLocaleDateString("de-DE")}</Badge>
        </div>
        <Card style={{ marginBottom: 16, background: `linear-gradient(135deg, ${COLORS.surfaceAlt}, ${COLORS.surface})` }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.accent, marginBottom: 12 }}>1. EXECUTIVE SUMMARY</div>
          <div style={{ fontSize: 13, color: COLORS.text, lineHeight: 1.7 }}>
            <p>• Initiative „{initiative.name}" – Gesamtfortschritt: <strong>{pct}%</strong> ({done}/{initActions.length} Maßnahmen abgeschlossen)</p>
            <p>• {initStakeholders.length} Stakeholder identifiziert, davon {resistants.length} skeptisch/resistant</p>
            <p>• {initImpacts.length} Change-Impacts erfasst, davon {highImpacts.length} mit hohem Impact</p>
            <p>• {initTGs.length} Zielgruppen betroffen (Gesamt: {initTGs.reduce((s, t) => s + t.size, 0)} Personen)</p>
            {gaps.length > 0 && <p style={{ color: COLORS.warning }}>• ADKAR-Lücken: {gaps.join(", ")} – keine Maßnahmen zugeordnet</p>}
          </div>
        </Card>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Card>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.accent, marginBottom: 12 }}>2. MAÜNAHMEN-STATUS</div>
            <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
              {[["Geplant", planned, COLORS.textMuted], ["In Arbeit", inProg, COLORS.accent], ["Fertig", done, COLORS.success]].map(([l, v, c]) => (
                <div key={l} style={{ flex: 1, textAlign: "center", padding: 12, background: COLORS.bg, borderRadius: 8 }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: c }}>{v}</div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted }}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{ background: COLORS.bg, borderRadius: 4, height: 8, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: `linear-gradient(90deg,${COLORS.success},${COLORS.accent})`, borderRadius: 4 }} />
            </div>
          </Card>
          <Card>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.accent, marginBottom: 12 }}>3. ADKAR-ABDECKUNG</div>
            {ADKAR.map(a => (
              <div key={a} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <span style={{ width: 100, fontSize: 12, color: COLORS.text }}>{a}</span>
                <div style={{ flex: 1, background: COLORS.bg, borderRadius: 3, height: 8, overflow: "hidden" }}>
                  <div style={{ width: `${Math.min(adkar[a] * 20, 100)}%`, height: "100%", borderRadius: 3, background: adkar[a] === 0 ? COLORS.danger : COLORS.success }} />
                </div>
                <span style={{ fontSize: 11, color: COLORS.textMuted, width: 20 }}>{adkar[a]}</span>
              </div>
            ))}
            {initTGs.length > 0 && (
              <div style={{ marginTop: 12, fontSize: 11, color: COLORS.textMuted }}>
                Pro Zielgruppe: {initTGs.map(tg => {
                  const c = calcAdkarCoverage(initActions, tg.id);
                  const g = ADKAR.filter(a => c[a] === 0);
                  return `${tg.name}: ${g.length === 0 ? "✓ vollständig" : g.map(a => a[0]).join(",") + " fehlt"}`;
                }).join(" | ")}
              </div>
            )}
          </Card>
          <Card>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.accent, marginBottom: 12 }}>4. TOP-RISIKEN & WIDERSTÄNDE</div>
            {resistants.length === 0 && highImpacts.length === 0 ? (
              <div style={{ fontSize: 12, color: COLORS.textMuted }}>Keine kritischen Risiken identifiziert</div>
            ) : (
              <div>
                {resistants.map(s => (
                  <div key={s.id} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                    <Badge color={readinessColor(s.readiness)} small>{s.readiness}</Badge>
                    <span style={{ fontSize: 12, color: COLORS.text }}>{s.name} ({s.role}, {s.org_unit})</span>
                    {s.influence === "H" && <Badge color={COLORS.danger} small>Hoher Einfluss</Badge>}
                  </div>
                ))}
                {highImpacts.length > 0 && (
                  <div style={{ marginTop: 8, fontSize: 12, color: COLORS.warning }}>
                    ⚠ {highImpacts.length} High-Impact-Changes erfordern besondere Aufmerksamkeit
                  </div>
                )}
              </div>
            )}
          </Card>
          <Card>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.accent, marginBottom: 12 }}>5. NÄCHSTE FOKUSMAÜNAHMEN</div>
            {upcoming.length === 0 ? (
              <div style={{ fontSize: 12, color: COLORS.textMuted }}>Keine offenen Maßnahmen mit Datum</div>
            ) : (
              upcoming.map(a => (
                <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${COLORS.border}22` }}>
                  <div>
                    <div style={{ fontSize: 12, color: COLORS.text, fontWeight: 500 }}>{a.title}</div>
                    <div style={{ display: "flex", gap: 4, marginTop: 2 }}>
                      <Badge color={COLORS.cyan} small>{a.type}</Badge>
                      <Badge color={statusColor(a.status)} small>{a.status}</Badge>
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: COLORS.textMuted }}>{a.due_date}</span>
                </div>
              ))
            )}
          </Card>
        </div>
      </div>
    );
  };

  // ── Proposals View ──
  const ProposalView = () => {
    if (!initiative) return <EmptyState icon="△" title="Keine Initiative ausgewählt" sub="" />;
    const proposals = data.changeProposals?.filter(p => p.initiative_id === selectedInit) || [];
    const [showNew, setShowNew] = useState(false);
    const empty = { reason: "", actions_add: "", actions_update_id: "", actions_update_fields: "", risks: "", benefits: "" };
    const [form, setForm] = useState(empty);
    const addProposal = () => {
      if (!form.reason) return;
      update(d => {
        if (!d.changeProposals) d.changeProposals = [];
        d.changeProposals.push({
          id: uid("P-"), initiative_id: selectedInit, reason: form.reason,
          status: "pending", created: new Date().toISOString(),
          diff: {
            actions_add: form.actions_add ? [{ title: form.actions_add }] : [],
            actions_update: form.actions_update_id ? [{ action_id: form.actions_update_id, fields: form.actions_update_fields }] : [],
            actions_remove: [],
          },
          risks: form.risks.split("\n").filter(Boolean),
          benefits: form.benefits.split("\n").filter(Boolean),
        });
      });
      setForm(empty); setShowNew(false);
    };
    const applyProposal = (pId) => {
      update(d => {
        const p = d.changeProposals.find(p => p.id === pId);
        if (p) { p.status = "applied"; p.applied_at = new Date().toISOString(); }
      });
    };
    const rejectProposal = (pId) => {
      update(d => {
        const p = d.changeProposals.find(p => p.id === pId);
        if (p) p.status = "rejected";
      });
    };
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 22, color: COLORS.text }}>Change Proposals</h2>
          <Btn variant="primary" onClick={() => setShowNew(true)}>＋ Vorschlag erstellen</Btn>
        </div>
        {proposals.length === 0 ? (
          <EmptyState icon="△" title="Keine Vorschläge" sub="Erstelle Änderungsvorschläge für den Plan" />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {proposals.map(p => (
              <Card key={p.id} style={{ borderLeft: `3px solid ${p.status === "applied" ? COLORS.success : p.status === "rejected" ? COLORS.danger : COLORS.warning}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>{p.reason}</div>
                  <Badge color={p.status === "applied" ? COLORS.success : p.status === "rejected" ? COLORS.danger : COLORS.warning} small>{p.status}</Badge>
                </div>
                {p.diff?.actions_add?.length > 0 && (
                  <div style={{ fontSize: 12, color: COLORS.success, marginBottom: 4 }}>+ Neue Maßnahmen: {p.diff.actions_add.map(a => a.title).join(", ")}</div>
                )}
                {p.risks?.length > 0 && (
                  <div style={{ fontSize: 12, color: COLORS.warning, marginBottom: 4 }}>Risiken: {p.risks.join("; ")}</div>
                )}
                {p.benefits?.length > 0 && (
                  <div style={{ fontSize: 12, color: COLORS.success, marginBottom: 4 }}>Nutzen: {p.benefits.join("; ")}</div>
                )}
                {p.status === "pending" && (
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <Btn variant="success" small onClick={() => applyProposal(p.id)}>✓ Apply</Btn>
                    <Btn variant="danger" small onClick={() => rejectProposal(p.id)}>✕ Reject</Btn>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
        <Modal open={showNew} onClose={() => setShowNew(false)} title="Neuer Change Proposal">
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Input label="Begründung" value={form.reason} onChange={v => setForm(f => ({ ...f, reason: v }))} textarea placeholder="Warum wird diese Änderung vorgeschlagen?" />
            <Input label="Neue Maßnahme (Titel)" value={form.actions_add} onChange={v => setForm(f => ({ ...f, actions_add: v }))} placeholder="Optional: Titel einer neuen Maßnahme" />
            <Input label="Risiken (je Zeile)" value={form.risks} onChange={v => setForm(f => ({ ...f, risks: v }))} textarea />
            <Input label="Erwarteter Nutzen (je Zeile)" value={form.benefits} onChange={v => setForm(f => ({ ...f, benefits: v }))} textarea />
          </div>
          <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}><Btn variant="primary" onClick={addProposal}>Vorschlag erstellen</Btn></div>
        </Modal>
      </div>
    );
  };

  // ── Import/Export View ──
  const ImportExportView = () => {
    const [importText, setImportText] = useState("");
    const [importMsg, setImportMsg] = useState(null);
    const doImport = () => {
      try {
        const parsed = JSON.parse(importText);
        if (parsed.initiatives) setData(prev => ({ ...prev, ...parsed }));
        else throw new Error("Ungültiges Format");
        setImportMsg({ type: "success", text: "Import erfolgreich!" });
      } catch (e) { setImportMsg({ type: "error", text: "Fehler: " + e.message }); }
    };
    const doExport = () => {
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "ocm-portfolio-export.json"; a.click();
      URL.revokeObjectURL(url);
    };
    const exportCSV = (type) => {
      let rows = [];
      let headers = [];
      if (type === "stakeholders") {
        headers = ["id", "initiative_id", "name", "role", "function", "org_unit", "influence", "interest", "readiness", "notes"];
        rows = data.stakeholders;
      } else if (type === "impacts") {
        headers = ["id", "initiative_id", "target_group_id", "dimension", "change_description", "impact_level", "criticality", "training_need", "comms_need"];
        rows = data.impactItems;
      } else if (type === "actions") {
        headers = ["id", "initiative_id", "type", "title", "adkar_tags", "target_group_ids", "owner_person_id", "due_date", "status"];
        rows = data.actions.map(a => ({ ...a, adkar_tags: (a.adkar_tags || []).join(";"), target_group_ids: (a.target_group_ids || []).join(";") }));
      }
      const csv = [headers.join(","), ...rows.map(r => headers.map(h => `"${(r[h] || "").toString().replace(/"/g, '""')}"`).join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `ocm-${type}.csv`; a.click();
      URL.revokeObjectURL(url);
    };
    const loadDemo = () => {
      const demo = {
        initiatives: [{
          id: "INI-demo1", name: "ERP Migration Wave 1", goal: "Migration von SAP ECC auf S/4HANA für Finance & Controlling",
          scope: "DACH Region, 450 MA", priority: "High", time_window: "Q1–Q3 2026", milestones: [], assumptions: [], risks: [],
        }],
        stakeholders: [
          { id: "S-001", initiative_id: "INI-demo1", name: "Dr. Petra Schmidt", role: "Sponsor", function: "CFO", org_unit: "Finance", influence: "H", interest: "H", readiness: "supportive", notes: "Treibt Initiative" },
          { id: "S-002", initiative_id: "INI-demo1", name: "Markus Weber", role: "PL", function: "Projektleiter", org_unit: "IT", influence: "H", interest: "H", readiness: "supportive", notes: "" },
          { id: "S-003", initiative_id: "INI-demo1", name: "Sabine Müller", role: "BR", function: "Abteilungsleiterin", org_unit: "Controlling", influence: "M", interest: "H", readiness: "skeptical", notes: "Sorge um Arbeitsplätze" },
          { id: "S-004", initiative_id: "INI-demo1", name: "Thomas Bauer", role: "HR", function: "HR Business Partner", org_unit: "HR", influence: "M", interest: "M", readiness: "neutral", notes: "" },
          { id: "S-005", initiative_id: "INI-demo1", name: "Julia Fischer", role: "CM", function: "Change Managerin", org_unit: "PMO", influence: "M", interest: "H", readiness: "supportive", notes: "" },
        ],
        targetGroups: [
          { id: "TG-001", initiative_id: "INI-demo1", name: "Finance Buchhaltung", size: 120, org_units: ["Buchhaltung", "Rechnungswesen"], locations: ["Köln", "Berlin"] },
          { id: "TG-002", initiative_id: "INI-demo1", name: "Controlling", size: 85, org_units: ["Controlling"], locations: ["Köln", "München"] },
          { id: "TG-003", initiative_id: "INI-demo1", name: "IT Operations", size: 40, org_units: ["IT"], locations: ["Köln"] },
          { id: "TG-004", initiative_id: "INI-demo1", name: "Management DACH", size: 25, org_units: ["Finance", "Controlling"], locations: ["Köln", "Berlin", "München"] },
        ],
        impactItems: [
          { id: "I-001", initiative_id: "INI-demo1", target_group_id: "TG-001", dimension: "Technology", change_description: "Neue SAP S/4HANA Fiori-Oberfläche ersetzt SAP GUI", impact_level: "H", criticality: "H", training_need: "H", comms_need: "H", dependencies: [] },
          { id: "I-002", initiative_id: "INI-demo1", target_group_id: "TG-001", dimension: "Process", change_description: "Monatsabschluss-Prozess wird automatisiert und verkürzt", impact_level: "H", criticality: "H", training_need: "M", comms_need: "M", dependencies: [] },
          { id: "I-003", initiative_id: "INI-demo1", target_group_id: "TG-002", dimension: "Technology", change_description: "Neue Reporting-Tools (Embedded Analytics) ersetzen BW-Berichte", impact_level: "H", criticality: "M", training_need: "H", comms_need: "M", dependencies: [] },
          { id: "I-004", initiative_id: "INI-demo1", target_group_id: "TG-002", dimension: "People", change_description: "Rolle Controlling wird strategischer – weniger manuelle Reports", impact_level: "M", criticality: "M", training_need: "M", comms_need: "H", dependencies: [] },
          { id: "I-005", initiative_id: "INI-demo1", target_group_id: "TG-003", dimension: "Technology", change_description: "Neue Systemarchitektur (Cloud, HANA DB) erfordert neue Skills", impact_level: "H", criticality: "H", training_need: "H", comms_need: "M", dependencies: [] },
          { id: "I-006", initiative_id: "INI-demo1", target_group_id: "TG-003", dimension: "Process", change_description: "DevOps-Prozesse für S/4 Betrieb etablieren", impact_level: "M", criticality: "M", training_need: "H", comms_need: "L", dependencies: [] },
          { id: "I-007", initiative_id: "INI-demo1", target_group_id: "TG-004", dimension: "People", change_description: "Führungskräfte müssen Change aktiv unterstützen und kommunizieren", impact_level: "M", criticality: "H", training_need: "M", comms_need: "H", dependencies: [] },
          { id: "I-008", initiative_id: "INI-demo1", target_group_id: "TG-001", dimension: "Org", change_description: "Shared Service Center wird aufgebaut", impact_level: "M", criticality: "M", training_need: "L", comms_need: "H", dependencies: [] },
        ],
        actions: [
          { id: "A-001", initiative_id: "INI-demo1", type: "Comms", title: "Kick-off Townhall: Vision & Warum", adkar_tags: ["Awareness"], target_group_ids: ["TG-001", "TG-002", "TG-003", "TG-004"], owner_person_id: "S-001", due_date: "2026-02-15", status: "done", depends_on: [], linked_artifact_ids: [] },
          { id: "A-002", initiative_id: "INI-demo1", type: "Comms", title: "Manager Briefing: Auswirkungen & Rolle", adkar_tags: ["Awareness", "Desire"], target_group_ids: ["TG-004"], owner_person_id: "S-005", due_date: "2026-02-28", status: "done", depends_on: ["A-001"], linked_artifact_ids: [] },
          { id: "A-003", initiative_id: "INI-demo1", type: "Workshop", title: "Impact-Assessment Workshop Finance", adkar_tags: ["Awareness", "Knowledge"], target_group_ids: ["TG-001"], owner_person_id: "S-005", due_date: "2026-03-15", status: "in_progress", depends_on: ["A-002"], linked_artifact_ids: [] },
          { id: "A-004", initiative_id: "INI-demo1", type: "Training", title: "SAP Fiori Key-User Training (Wave 1)", adkar_tags: ["Knowledge", "Ability"], target_group_ids: ["TG-001"], owner_person_id: "S-002", due_date: "2026-04-15", status: "planned", depends_on: ["A-003"], linked_artifact_ids: [] },
          { id: "A-005", initiative_id: "INI-demo1", type: "Training", title: "Embedded Analytics Training Controlling", adkar_tags: ["Knowledge", "Ability"], target_group_ids: ["TG-002"], owner_person_id: "S-002", due_date: "2026-04-30", status: "planned", depends_on: ["A-003"], linked_artifact_ids: [] },
          { id: "A-006", initiative_id: "INI-demo1", type: "Coaching", title: "Führungskräfte-Coaching: Change-Kommunikation", adkar_tags: ["Desire", "Ability"], target_group_ids: ["TG-004"], owner_person_id: "S-005", due_date: "2026-03-30", status: "planned", depends_on: ["A-002"], linked_artifact_ids: [] },
          { id: "A-007", initiative_id: "INI-demo1", type: "Enablement", title: "IT Operations: S/4 HANA Admin Training", adkar_tags: ["Knowledge", "Ability"], target_group_ids: ["TG-003"], owner_person_id: "S-002", due_date: "2026-05-15", status: "planned", depends_on: [], linked_artifact_ids: [] },
          { id: "A-008", initiative_id: "INI-demo1", type: "Comms", title: "Go-Live Newsletter + FAQ", adkar_tags: ["Awareness", "Reinforcement"], target_group_ids: ["TG-001", "TG-002", "TG-003"], owner_person_id: "S-005", due_date: "2026-05-10", status: "planned", depends_on: ["A-004", "A-005"], linked_artifact_ids: [] },
          { id: "A-009", initiative_id: "INI-demo1", type: "Workshop", title: "Post-Go-Live Retrospektive", adkar_tags: ["Reinforcement"], target_group_ids: ["TG-001", "TG-002", "TG-003", "TG-004"], owner_person_id: "S-005", due_date: "2026-06-15", status: "planned", depends_on: ["A-008"], linked_artifact_ids: [] },
        ],
        artifacts: [],
        changeProposals: [],
      };
      setData(demo);
      setSelectedInit("INI-demo1");
      setNav("initiative");
      setSubTab("overview");
    };
    return (
      <div>
        <h2 style={{ margin: "0 0 20px", fontSize: 22, color: COLORS.text }}>Import / Export</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Card>
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.accent, marginBottom: 12 }}>IMPORT (JSON)</div>
            <textarea value={importText} onChange={e => setImportText(e.target.value)}
              placeholder='Portfolio-JSON hier einfügen...'
              style={{
                width: "100%", minHeight: 160, background: COLORS.bg, color: COLORS.text,
                border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 12,
                fontSize: 12, fontFamily: "monospace", resize: "vertical", outline: "none", boxSizing: "border-box",
              }} />
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <Btn variant="primary" onClick={doImport}>JSON importieren</Btn>
              <Btn variant="default" onClick={loadDemo}>Demo-Daten laden</Btn>
            </div>
            {importMsg && <div style={{ marginTop: 8, fontSize: 12, color: importMsg.type === "success" ? COLORS.success : COLORS.danger }}>{importMsg.text}</div>}
          </Card>
          <Card>
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.accent, marginBottom: 12 }}>EXPORT</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Btn variant="default" onClick={doExport}>📦 Vollständiger JSON-Export</Btn>
              <Btn variant="default" onClick={() => exportCSV("stakeholders")}>👤 Stakeholder CSV</Btn>
              <Btn variant="default" onClick={() => exportCSV("impacts")}>⚡ Impact Items CSV</Btn>
              <Btn variant="default" onClick={() => exportCSV("actions")}>📋 Maßnahmen CSV</Btn>
            </div>
            <div style={{ marginTop: 16, fontSize: 12, color: COLORS.textMuted }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Statistik</div>
              <DataRow label="Initiativen" value={data.initiatives.length} />
              <DataRow label="Stakeholder" value={data.stakeholders.length} />
              <DataRow label="Zielgruppen" value={data.targetGroups.length} />
              <DataRow label="Impacts" value={data.impactItems.length} />
              <DataRow label="Maßnahmen" value={data.actions.length} />
            </div>
          </Card>
        </div>
      </div>
    );
  };

  // ── Main Render ──
  const views = {
    portfolio: PortfolioView,
    initiative: InitiativeView,
    heatmap: HeatmapView,
    timeline: TimelineView,
    report: ReportView,
    proposals: ProposalView,
    import: ImportExportView,
  };
  const CurrentView = views[nav] || PortfolioView;

  return (
    <div style={{
      display: "flex", minHeight: "100vh", background: COLORS.bg,
      fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif", color: COLORS.text,
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <SideNav />
      <main style={{ flex: 1, padding: "28px 36px", overflowY: "auto", maxHeight: "100vh" }}>
        <CurrentView />
      </main>
    </div>
  );
}
