// 08-student-hub.jsx — Student detail / profile drill-down (teacher view)

function StudentHubScreen() {
  return (
    <ScreenShell padTop={0} bg={TOKENS.paper}>
      {/* Hero */}
      <div style={{
        position: 'relative',
        background: `linear-gradient(170deg, ${TOKENS.plum700} 0%, ${TOKENS.plum} 100%)`,
        padding: '56px 20px 90px',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -30, right: -50, width: 220, height: 220,
          borderRadius: '50%', background: `radial-gradient(circle, ${TOKENS.coral}40, transparent 70%)`,
          filter: 'blur(24px)',
        }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="chevL" size={18} color="#fff" strokeWidth={2} />
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', letterSpacing: 0.4 }}>Class XII-A</div>
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="chat" size={17} color="#fff" strokeWidth={1.8} />
          </div>
        </div>

        <div style={{ marginTop: 18, position: 'relative', display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <div style={{
              width: 88, height: 88, borderRadius: 24,
              background: `linear-gradient(160deg, ${TOKENS.coralWarm}, ${TOKENS.coral})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Instrument Serif, serif', fontSize: 44, color: '#fff',
              boxShadow: '0 10px 24px rgba(255,107,61,0.4)',
            }}>AD</div>
            <div style={{
              position: 'absolute', bottom: -4, right: -4,
              width: 26, height: 26, borderRadius: '50%',
              background: TOKENS.green, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '3px solid ' + TOKENS.plum,
            }}>
              <Icon name="check" size={14} color="#fff" strokeWidth={3} />
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', letterSpacing: 0.5, textTransform: 'uppercase' }}>Roll 26EN009</div>
            <div style={{
              fontFamily: 'Instrument Serif, serif', fontSize: 26, color: '#fff',
              letterSpacing: -0.3, lineHeight: 1.05, marginTop: 4,
            }}>Apurba Das</div>
            <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
              <Pill tone="coral" dot>Top 5%</Pill>
              <Pill tone="neutral"><span style={{ color: 'rgba(255,255,255,0.85)' }}>91% attendance</span></Pill>
            </div>
          </div>
        </div>
      </div>

      {/* Floating stats card */}
      <div style={{
        margin: '-60px 16px 0', position: 'relative',
        background: '#fff', borderRadius: 22,
        border: `1px solid ${TOKENS.line}`,
        boxShadow: '0 10px 24px rgba(35,16,56,0.08)',
        padding: 16,
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {[
            { v: 'A−', l: 'GPA',         tone: 'plum' },
            { v: '91%', l: 'ATTENDANCE', tone: 'green' },
            { v: '12', l: 'STREAK',      tone: 'coral' },
          ].map((s, i) => (
            <div key={i} style={{
              padding: 10, borderRadius: 12,
              background: TOKENS.plumTint, textAlign: 'center',
            }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: TOKENS.ink, letterSpacing: -0.4 }}>{s.v}</div>
              <div style={{ fontSize: 9.5, color: TOKENS.ink3, marginTop: 2, letterSpacing: 0.5 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Sparkline + label */}
        <div style={{ marginTop: 14, padding: '12px 0 0', borderTop: `1px dashed ${TOKENS.line}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div>
              <div style={{ fontSize: 11, color: TOKENS.ink3, letterSpacing: 0.4 }}>OVERALL TREND</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: TOKENS.ink, marginTop: 2 }}>+4.2 since last quarter</div>
            </div>
            <Pill tone="green" dot>Improving</Pill>
          </div>
          <svg width="100%" height="46" viewBox="0 0 320 46" style={{ marginTop: 8, display: 'block' }}>
            <defs>
              <linearGradient id="sparkfill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={TOKENS.plum500} stopOpacity="0.25" />
                <stop offset="100%" stopColor={TOKENS.plum500} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0 32 L40 26 L80 30 L120 22 L160 24 L200 14 L240 18 L280 8 L320 12 L320 46 L0 46 Z" fill="url(#sparkfill)" />
            <path d="M0 32 L40 26 L80 30 L120 22 L160 24 L200 14 L240 18 L280 8 L320 12" stroke={TOKENS.plum500} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="320" cy="12" r="4" fill={TOKENS.coral} />
            <circle cx="320" cy="12" r="8" fill={TOKENS.coral} fillOpacity="0.2" />
          </svg>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ padding: '20px 20px 0', display: 'flex', gap: 22, borderBottom: `1px solid ${TOKENS.line}`, margin: '0 4px' }}>
        {[
          { l: 'Subjects', active: true },
          { l: 'Notes' },
          { l: 'Activity' },
          { l: 'Family' },
        ].map((t, i) => (
          <div key={i} style={{ paddingBottom: 10, position: 'relative' }}>
            <div style={{ fontSize: 13, fontWeight: t.active ? 700 : 500, color: t.active ? TOKENS.ink : TOKENS.ink3 }}>{t.l}</div>
            {t.active && <div style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: 2, background: TOKENS.coral, borderRadius: 2 }} />}
          </div>
        ))}
      </div>

      {/* Subject rows */}
      <div style={{ padding: '14px 20px 30px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <SubjectRow name="Mathematics"  grade="A"  pct={92} delta="+3" />
        <SubjectRow name="Physics"      grade="A−" pct={88} delta="+5" />
        <SubjectRow name="English Lit." grade="B+" pct={84} delta="−1" down />
        <SubjectRow name="History"      grade="A−" pct={89} delta="+2" />
      </div>
    </ScreenShell>
  );
}

function SubjectRow({ name, grade, pct, delta, down }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 14,
      border: `1px solid ${TOKENS.line}`,
      padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10,
        background: TOKENS.plumTint, color: TOKENS.plum,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Instrument Serif, serif', fontSize: 20,
      }}>{grade}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: TOKENS.ink }}>{name}</div>
        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1 }}><Bar value={pct} tone="plum" height={4} /></div>
          <span style={{ fontSize: 11, fontWeight: 600, color: TOKENS.ink2 }}>{pct}%</span>
        </div>
      </div>
      <div style={{
        padding: '4px 7px', borderRadius: 6,
        background: down ? TOKENS.redTint : TOKENS.greenTint,
        color: down ? TOKENS.red : TOKENS.green,
        fontSize: 11, fontWeight: 700, letterSpacing: 0.2,
      }}>{delta}</div>
    </div>
  );
}

window.StudentHubScreen = StudentHubScreen;
