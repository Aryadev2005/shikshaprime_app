// 10-attendance-self.jsx — Student's own attendance view

function StudentAttendanceScreen() {
  return (
    <ScreenShell padTop={56} bg={TOKENS.paper}>
      <TopBar title="My Attendance" sub="Quarter 2 · 2026" trailing={
        <div style={{
          width: 38, height: 38, borderRadius: 12,
          background: TOKENS.surface, border: `1px solid ${TOKENS.line}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="download" size={17} color={TOKENS.ink} strokeWidth={1.8} />
        </div>
      }/>

      {/* Big % hero */}
      <div style={{ padding: '4px 20px 0', textAlign: 'center' }}>
        <div style={{
          fontFamily: 'Instrument Serif, serif', fontSize: 90, lineHeight: 1,
          color: TOKENS.ink, letterSpacing: -3, display: 'inline-flex', alignItems: 'flex-start',
        }}>
          91<span style={{ fontSize: 36, marginTop: 12, color: TOKENS.coral }}>%</span>
        </div>
        <div style={{ fontSize: 13, color: TOKENS.ink3, marginTop: 4 }}>
          78 of 86 classes attended this quarter
        </div>
        <div style={{ marginTop: 10, display: 'inline-flex', gap: 6 }}>
          <Pill tone="green" dot>Above target</Pill>
          <Pill tone="coral" dot>12-day streak</Pill>
        </div>
      </div>

      {/* Heatmap */}
      <div style={{ padding: '24px 20px 0' }}>
        <div style={{
          background: '#fff', borderRadius: 18, border: `1px solid ${TOKENS.line}`,
          padding: 16,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: TOKENS.ink }}>Pattern</div>
            <div style={{ fontSize: 11, color: TOKENS.ink3 }}>Apr 1 → May 28</div>
          </div>

          <Heatmap />

          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
            <span style={{ fontSize: 10, color: TOKENS.ink3 }}>Less</span>
            {[TOKENS.line2, '#E5DAF4', TOKENS.plum300, TOKENS.plum500, TOKENS.plum].map((c, i) => (
              <span key={i} style={{ width: 10, height: 10, borderRadius: 3, background: c }} />
            ))}
            <span style={{ fontSize: 10, color: TOKENS.ink3 }}>More</span>
          </div>
        </div>
      </div>

      {/* Subject breakdown */}
      <div style={{ padding: '18px 20px 110px' }}>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: TOKENS.ink, marginBottom: 10 }}>By subject</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <SubjAtt name="Mathematics"  attended={42} total={44} />
          <SubjAtt name="Physics"      attended={20} total={22} />
          <SubjAtt name="English Lit." attended={9}  total={12} warn />
          <SubjAtt name="History"      attended={11} total={12} />
        </div>

        {/* Warning */}
        <div style={{
          marginTop: 14, padding: 14, borderRadius: 16,
          background: TOKENS.amberTint, border: `1px solid ${TOKENS.amber}33`,
          display: 'flex', gap: 12, alignItems: 'flex-start',
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: 9,
            background: '#fff', color: TOKENS.amber,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Icon name="clock" size={16} color="#A07015" strokeWidth={2} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#6B4D0F' }}>Watch your English attendance</div>
            <div style={{ fontSize: 12, color: '#7A5A1A', marginTop: 3, lineHeight: 1.5 }}>
              You've missed 3 of 12 English classes. Falling below 75% may affect exam eligibility.
            </div>
          </div>
        </div>
      </div>
    </ScreenShell>
  );
}

function Heatmap() {
  // 8 weeks × 5 weekdays
  const cells = [];
  for (let w = 0; w < 9; w++) {
    for (let d = 0; d < 5; d++) {
      // deterministic seeded "pattern"
      const r = ((w * 7 + d * 3 + 11) % 100) / 100;
      let level;
      if (d === 4 && w === 7) level = 0;
      else if (r < 0.07) level = 0;
      else if (r < 0.18) level = 1;
      else if (r < 0.4) level = 2;
      else if (r < 0.7) level = 3;
      else level = 4;
      cells.push({ w, d, level });
    }
  }
  const colors = [TOKENS.line2, '#E5DAF4', TOKENS.plum300, TOKENS.plum500, TOKENS.plum];
  const labels = ['M', 'T', 'W', 'T', 'F'];
  return (
    <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 14 }}>
        {labels.map((l, i) => (
          <div key={i} style={{ fontSize: 9, color: TOKENS.ink3, height: 16, display: 'flex', alignItems: 'center', letterSpacing: 0.5 }}>{l}</div>
        ))}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 9, color: TOKENS.ink3, letterSpacing: 0.5 }}>
          <span>APR</span><span>MAY</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: 4 }}>
          {Array.from({ length: 9 }).map((_, w) => (
            <div key={w} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {Array.from({ length: 5 }).map((_, d) => {
                const cell = cells.find(c => c.w === w && c.d === d);
                return (
                  <div key={d} style={{
                    aspectRatio: '1 / 1', borderRadius: 3,
                    background: colors[cell.level],
                  }} />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SubjAtt({ name, attended, total, warn }) {
  const pct = Math.round((attended / total) * 100);
  return (
    <div style={{
      background: '#fff', borderRadius: 14, border: `1px solid ${TOKENS.line}`,
      padding: '12px 14px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: TOKENS.ink }}>{name}</div>
        <div style={{ fontSize: 12, color: TOKENS.ink3 }}>
          <span style={{ fontWeight: 700, color: warn ? TOKENS.amber : TOKENS.ink }}>{pct}%</span> · {attended}/{total}
        </div>
      </div>
      <div style={{ marginTop: 8 }}>
        <Bar value={pct} tone={warn ? 'coral' : 'plum'} height={4} />
      </div>
    </div>
  );
}

window.StudentAttendanceScreen = StudentAttendanceScreen;
