// 05-review.jsx — Attendance review/summary (teacher post-take)

function ReviewScreen() {
  const present = 38, absent = 3, late = 1, total = 42;
  return (
    <ScreenShell padTop={56} bg={TOKENS.paper}>
      <TopBar title="Class XII-A · Math" sub="Tue, 28 May · 09:00" trailing={
        <div style={{
          width: 38, height: 38, borderRadius: 12,
          background: TOKENS.surface, border: `1px solid ${TOKENS.line}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="filter" size={18} color={TOKENS.ink} strokeWidth={1.8} />
        </div>
      }/>

      {/* Donut + breakdown */}
      <div style={{ padding: '0 20px' }}>
        <div style={{
          background: '#fff', borderRadius: 22,
          border: `1px solid ${TOKENS.line}`, padding: 18,
          display: 'flex', alignItems: 'center', gap: 18,
        }}>
          <Donut present={present} absent={absent} late={late} total={total} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Legend dot={TOKENS.green} label="Present" value={present} />
            <Legend dot={TOKENS.red} label="Absent" value={absent} />
            <Legend dot={TOKENS.amber} label="Late" value={late} />
            <div style={{
              marginTop: 4, paddingTop: 8, borderTop: `1px dashed ${TOKENS.line}`,
              display: 'flex', justifyContent: 'space-between', fontSize: 11.5,
            }}>
              <span style={{ color: TOKENS.ink3 }}>Total</span>
              <span style={{ color: TOKENS.ink, fontWeight: 700 }}>{total}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ padding: '18px 20px 0', display: 'flex', gap: 8 }}>
        <Tab active>All · {total}</Tab>
        <Tab>Present</Tab>
        <Tab tone="coral">Absent · 3</Tab>
      </div>

      {/* Student list */}
      <div style={{ padding: '12px 20px 110px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <StudentRow name="Apurba Das" roll="26EN009" status="present" />
        <StudentRow name="Karan Verma" roll="26EN010" status="present" />
        <StudentRow name="Ananya Sharma" roll="26EN011" status="late" mins={8} />
        <StudentRow name="Riya Mukherjee" roll="26EN012" status="absent" reason="Sick leave" />
        <StudentRow name="Dev Patel" roll="26EN013" status="present" />
        <StudentRow name="Tara Iyer" roll="26EN014" status="absent" reason="No notice" />
      </div>

      {/* Sticky submit */}
      <div style={{
        position: 'absolute', left: 16, right: 16, bottom: 30,
        background: '#fff', borderRadius: 20, padding: 8,
        border: `1px solid ${TOKENS.line}`,
        boxShadow: '0 10px 24px rgba(35,16,56,0.10)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{ flex: 1, padding: '0 8px' }}>
          <div style={{ fontSize: 11, color: TOKENS.ink3 }}>Roster locked at 17:00</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: TOKENS.ink }}>Submit to register</div>
        </div>
        <div style={{
          padding: '12px 16px', borderRadius: 14,
          background: `linear-gradient(180deg, ${TOKENS.coralWarm}, ${TOKENS.coral})`,
          color: '#fff', fontWeight: 600, fontSize: 14,
          boxShadow: '0 6px 14px rgba(255,107,61,0.32)',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          Submit <Icon name="arrowR" size={16} color="#fff" strokeWidth={2.4} />
        </div>
      </div>
    </ScreenShell>
  );
}

function Donut({ present, absent, late, total }) {
  const r = 38, c = 2 * Math.PI * r;
  const pP = present / total, pL = late / total, pA = absent / total;
  return (
    <div style={{ position: 'relative', width: 110, height: 110, flexShrink: 0 }}>
      <svg width="110" height="110" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="50" cy="50" r={r} stroke={TOKENS.line2} strokeWidth="10" fill="none" />
        <circle cx="50" cy="50" r={r}
          stroke={TOKENS.green} strokeWidth="10" fill="none"
          strokeDasharray={`${pP * c} ${c}`} strokeLinecap="round" />
        <circle cx="50" cy="50" r={r}
          stroke={TOKENS.amber} strokeWidth="10" fill="none"
          strokeDasharray={`${pL * c} ${c}`}
          strokeDashoffset={-pP * c} strokeLinecap="round" />
        <circle cx="50" cy="50" r={r}
          stroke={TOKENS.red} strokeWidth="10" fill="none"
          strokeDasharray={`${pA * c} ${c}`}
          strokeDashoffset={-(pP + pL) * c} strokeLinecap="round" />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: TOKENS.ink, letterSpacing: -0.6, fontFamily: 'Inter' }}>
          {Math.round(present / total * 100)}%
        </div>
        <div style={{ fontSize: 9.5, color: TOKENS.ink3, letterSpacing: 0.6, marginTop: -2 }}>PRESENT</div>
      </div>
    </div>
  );
}
function Legend({ dot, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: dot }} />
        <span style={{ fontSize: 13, color: TOKENS.ink2 }}>{label}</span>
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color: TOKENS.ink }}>{value}</span>
    </div>
  );
}
function Tab({ children, active, tone }) {
  if (active) {
    return (
      <div style={{
        padding: '8px 14px', borderRadius: 999,
        background: TOKENS.plum, color: '#fff',
        fontSize: 12.5, fontWeight: 600,
      }}>{children}</div>
    );
  }
  return (
    <div style={{
      padding: '8px 14px', borderRadius: 999,
      background: '#fff', color: tone === 'coral' ? TOKENS.coral : TOKENS.ink2,
      fontSize: 12.5, fontWeight: 600,
      border: `1px solid ${TOKENS.line}`,
    }}>{children}</div>
  );
}
function StudentRow({ name, roll, status, reason, mins }) {
  const map = {
    present: { tone: 'green', label: 'Present' },
    absent:  { tone: 'red', label: 'Absent' },
    late:    { tone: 'amber', label: `Late · ${mins}m` },
  };
  const s = map[status];
  return (
    <div style={{
      background: '#fff', borderRadius: 14,
      border: `1px solid ${TOKENS.line}`,
      padding: '11px 12px', display: 'flex', alignItems: 'center', gap: 11,
    }}>
      <Avatar name={name} size={36} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: TOKENS.ink, letterSpacing: -0.1 }}>{name}</div>
        <div style={{ fontSize: 11, color: TOKENS.ink3, marginTop: 1 }}>
          {roll}{reason ? ` · ${reason}` : ''}
        </div>
      </div>
      <Pill tone={s.tone} dot>{s.label}</Pill>
    </div>
  );
}

window.ReviewScreen = ReviewScreen;
