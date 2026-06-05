// 07-calendar.jsx — Calendar / Timetable

function CalendarScreen() {
  return (
    <ScreenShell padTop={56} bg={TOKENS.paper}>
      <div style={{ padding: '0 20px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, color: TOKENS.ink3, letterSpacing: 0.4, textTransform: 'uppercase' }}>May 2026</div>
            <div style={{
              fontFamily: 'Instrument Serif, serif',
              fontSize: 30, color: TOKENS.ink, letterSpacing: -0.5, lineHeight: 1, marginTop: 4,
            }}>This week</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{
              padding: '6px 12px', borderRadius: 10,
              background: '#fff', border: `1px solid ${TOKENS.line}`,
              fontSize: 12, fontWeight: 600, color: TOKENS.ink2,
              display: 'flex', alignItems: 'center', gap: 4,
            }}>Today</div>
            <div style={{
              width: 38, height: 38, borderRadius: 12,
              background: TOKENS.plum, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="plus" size={18} color="#fff" strokeWidth={2.4} />
            </div>
          </div>
        </div>
      </div>

      {/* Week strip */}
      <div style={{
        margin: '20px 16px 0', padding: '12px 8px',
        background: '#fff', borderRadius: 18,
        border: `1px solid ${TOKENS.line}`,
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2,
      }}>
        {[
          ['Mon', 27, false, 0],
          ['Tue', 28, true,  3],
          ['Wed', 29, false, 5],
          ['Thu', 30, false, 4],
          ['Fri', 31, false, 2],
          ['Sat', 1,  false, 0],
          ['Sun', 2,  false, 0],
        ].map(([d, num, today, dots], i) => (
          <div key={i} style={{
            padding: '8px 0', borderRadius: 12, textAlign: 'center',
            background: today ? TOKENS.plum : 'transparent',
            color: today ? '#fff' : TOKENS.ink,
          }}>
            <div style={{
              fontSize: 10, color: today ? 'rgba(255,255,255,0.7)' : TOKENS.ink3,
              letterSpacing: 0.5, textTransform: 'uppercase',
            }}>{d}</div>
            <div style={{ fontSize: 17, fontWeight: 700, marginTop: 2, letterSpacing: -0.3 }}>{num}</div>
            <div style={{
              marginTop: 4, display: 'flex', justifyContent: 'center', gap: 2,
              height: 4,
            }}>
              {Array.from({ length: dots }).slice(0, 3).map((_, j) => (
                <span key={j} style={{
                  width: 3, height: 3, borderRadius: '50%',
                  background: today ? '#fff' : TOKENS.coral,
                }} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Day header */}
      <div style={{ padding: '20px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: TOKENS.ink, letterSpacing: -0.2 }}>Tuesday, 28 May</div>
          <div style={{ fontSize: 12, color: TOKENS.ink3, marginTop: 2 }}>3 classes · 1 deadline · Sports practice</div>
        </div>
      </div>

      {/* Timeline */}
      <div style={{ padding: '14px 20px 110px', position: 'relative' }}>
        <TimeRow time="09:00" duration="1h" sub="Mathematics" room="Room 204" teacher="John Doe" tone="plum" active />
        <TimeRow time="10:30" duration="1h 30m" sub="Physics Lab" room="Block C" teacher="S. Mehta" tone="coral" />
        <TimeRow time="13:00" duration="1h" sub="English Lit" room="Room 109" teacher="P. Nair" tone="green" />
        <TimeRow time="16:00" duration="—" sub="Essay Deadline" room="World War II" teacher="History · Submit" tone="amber" deadline />
      </div>
    </ScreenShell>
  );
}

function TimeRow({ time, duration, sub, room, teacher, tone, active, deadline }) {
  const colors = { plum: TOKENS.plum, coral: TOKENS.coral, green: TOKENS.green, amber: TOKENS.amber };
  const bgs    = { plum: TOKENS.plumTint, coral: TOKENS.coralTint, green: TOKENS.greenTint, amber: TOKENS.amberTint };
  const c = colors[tone], bg = bgs[tone];

  return (
    <div style={{ display: 'flex', gap: 14, marginBottom: 10 }}>
      <div style={{ width: 52, flexShrink: 0, paddingTop: 4 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: TOKENS.ink, letterSpacing: -0.2 }}>{time}</div>
        <div style={{ fontSize: 10.5, color: TOKENS.ink3, marginTop: 1 }}>{duration}</div>
      </div>
      <div style={{ position: 'relative', width: 4, flexShrink: 0 }}>
        <div style={{
          position: 'absolute', top: 4, bottom: -10, left: 1,
          width: 2, background: TOKENS.line, borderRadius: 1,
        }} />
        <div style={{
          position: 'absolute', top: 6, left: -3, width: 10, height: 10,
          borderRadius: '50%', background: c,
          boxShadow: active ? `0 0 0 4px ${bg}` : 'none',
        }} />
      </div>
      <div style={{
        flex: 1, padding: 13, borderRadius: 14,
        background: deadline ? '#fff' : bg,
        border: deadline ? `1px dashed ${TOKENS.amber}` : 'none',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: TOKENS.ink, letterSpacing: -0.2 }}>{sub}</div>
          {active && <Pill tone="plum" dot>Live</Pill>}
          {deadline && <Pill tone="amber">Deadline</Pill>}
        </div>
        <div style={{ fontSize: 11.5, color: TOKENS.ink3, marginTop: 3 }}>{teacher} · {room}</div>
        {!deadline && (
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex' }}>
              {['Karan Verma', 'Tara I', 'Riya M'].map((n, i) => (
                <div key={i} style={{ marginLeft: i === 0 ? 0 : -7 }}>
                  <Avatar name={n} size={22} ring />
                </div>
              ))}
              <span style={{
                marginLeft: -7, width: 22, height: 22, borderRadius: '50%',
                background: '#fff', border: `1.5px solid ${bg}`,
                color: TOKENS.ink2, fontSize: 9.5, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>+39</span>
            </div>
            {active && (
              <div style={{
                padding: '5px 10px', borderRadius: 8, background: c,
                color: '#fff', fontSize: 11, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 4,
              }}>Take attendance <Icon name="arrowR" size={11} color="#fff" strokeWidth={2.6} /></div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

window.CalendarScreen = CalendarScreen;
