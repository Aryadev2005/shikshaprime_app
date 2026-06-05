// 06-assignments.jsx — Homework / Assignments list

function AssignmentsScreen() {
  return (
    <ScreenShell padTop={56} bg={TOKENS.paper}>
      <div style={{ padding: '0 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, color: TOKENS.ink3, letterSpacing: 0.4, textTransform: 'uppercase' }}>Your work</div>
            <div style={{
              fontFamily: 'Instrument Serif, serif',
              fontSize: 30, color: TOKENS.ink, letterSpacing: -0.5,
              lineHeight: 1, marginTop: 4,
            }}>Assignments</div>
          </div>
          <div style={{
            width: 42, height: 42, borderRadius: 14,
            background: TOKENS.plum, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 6px 14px rgba(58,27,92,0.2)',
          }}>
            <Icon name="plus" size={20} color="#fff" strokeWidth={2.4} />
          </div>
        </div>

        {/* Search */}
        <div style={{
          marginTop: 16, height: 46, borderRadius: 14,
          background: '#fff', border: `1px solid ${TOKENS.line}`,
          display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px',
        }}>
          <Icon name="search" size={17} color={TOKENS.ink3} strokeWidth={1.8} />
          <div style={{ flex: 1, fontSize: 14, color: TOKENS.ink3 }}>Search assignments…</div>
          <Icon name="sort" size={17} color={TOKENS.ink3} strokeWidth={1.8} />
        </div>

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 6, marginTop: 14, overflow: 'hidden' }}>
          {[
            { l: 'All · 14', active: true },
            { l: 'Pending · 3' },
            { l: 'Submitted · 9' },
            { l: 'Graded · 2' },
          ].map((c, i) => (
            <div key={i} style={{
              padding: '6px 12px', borderRadius: 999,
              background: c.active ? TOKENS.plum : '#fff',
              color: c.active ? '#fff' : TOKENS.ink2,
              border: c.active ? 'none' : `1px solid ${TOKENS.line}`,
              fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
            }}>{c.l}</div>
          ))}
        </div>
      </div>

      {/* Featured (due tomorrow) */}
      <div style={{ padding: '18px 20px 0' }}>
        <div style={{
          borderRadius: 22, overflow: 'hidden',
          background: `linear-gradient(155deg, ${TOKENS.plumDeep} 0%, ${TOKENS.plum} 60%, ${TOKENS.plum700} 100%)`,
          padding: 18, position: 'relative',
        }}>
          <div style={{
            position: 'absolute', top: -30, right: -40, width: 160, height: 160,
            borderRadius: '50%', background: `radial-gradient(circle, ${TOKENS.coral}60, transparent 70%)`,
            filter: 'blur(20px)',
          }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
            <div style={{
              padding: '4px 9px', borderRadius: 999,
              background: 'rgba(255,107,61,0.2)', color: TOKENS.coralWarm,
              fontSize: 10.5, fontWeight: 700, letterSpacing: 0.5,
              display: 'inline-flex', alignItems: 'center', gap: 5,
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: TOKENS.coralWarm }} />
              DUE TOMORROW
            </div>
            <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.6)' }}>HISTORY · 29 May</div>
          </div>
          <div style={{
            marginTop: 12, fontSize: 21, fontWeight: 600, color: '#fff',
            letterSpacing: -0.4, lineHeight: 1.2, position: 'relative',
          }}>
            World War II<br/>Critical Analysis Essay
          </div>
          <div style={{ marginTop: 10, fontSize: 12.5, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, position: 'relative' }}>
            1,500 words · MLA format · Submit as PDF
          </div>

          <div style={{
            marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            position: 'relative',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar name="Priya Nair" size={26} />
              <div>
                <div style={{ fontSize: 11.5, color: '#fff', fontWeight: 600 }}>Mrs. Priya Nair</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)' }}>Assigned 3 days ago</div>
              </div>
            </div>
            <div style={{
              padding: '8px 14px', borderRadius: 12,
              background: `linear-gradient(180deg, ${TOKENS.coralWarm}, ${TOKENS.coral})`,
              color: '#fff', fontSize: 12.5, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 5,
              boxShadow: '0 4px 10px rgba(255,107,61,0.4)',
            }}>
              Start <Icon name="arrowR" size={13} color="#fff" strokeWidth={2.6} />
            </div>
          </div>
        </div>
      </div>

      {/* List section header */}
      <div style={{ padding: '18px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: TOKENS.ink }}>This week</div>
        <div style={{ fontSize: 12, color: TOKENS.ink3 }}>13 items</div>
      </div>

      {/* List */}
      <div style={{ padding: '10px 20px 100px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <AsgnRow sub="MATH"    title="Algebra Worksheet 4" due="In 3 days" status="pending" progress={20} />
        <AsgnRow sub="PHYSICS" title="Pendulum Lab Report"  due="In 5 days" status="draft"   progress={60} />
        <AsgnRow sub="ENGLISH" title="Poem Memorization"    due="In 1 week" status="pending" progress={0}  />
        <AsgnRow sub="CHEM"    title="Periodic Table Quiz"  due="Submitted" status="done"    grade="92" />
      </div>
    </ScreenShell>
  );
}

function AsgnRow({ sub, title, due, status, progress, grade }) {
  const map = {
    pending: { iconBg: TOKENS.plumTint, icon: 'file', iconColor: TOKENS.plum },
    draft:   { iconBg: TOKENS.amberTint, icon: 'edit', iconColor: '#A07015' },
    done:    { iconBg: TOKENS.greenTint, icon: 'check', iconColor: TOKENS.green },
  };
  const m = map[status];
  return (
    <div style={{
      background: '#fff', borderRadius: 16,
      border: `1px solid ${TOKENS.line}`, padding: 14,
      display: 'flex', alignItems: 'flex-start', gap: 12,
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 11,
        background: m.iconBg, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name={m.icon} size={17} color={m.iconColor} strokeWidth={2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div style={{ fontSize: 10, color: TOKENS.ink3, letterSpacing: 0.5, fontWeight: 600 }}>{sub}</div>
          <div style={{ fontSize: 11, color: status === 'done' ? TOKENS.green : TOKENS.ink3, fontWeight: 600 }}>{due}</div>
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: TOKENS.ink, marginTop: 2, letterSpacing: -0.1 }}>{title}</div>
        {status === 'done' ? (
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Pill tone="green" dot>Graded · {grade}/100</Pill>
            <span style={{ fontSize: 11, color: TOKENS.ink3 }}>Feedback ready</span>
          </div>
        ) : (
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1 }}><Bar value={progress} tone={status === 'draft' ? 'coral' : 'plum'} height={4} /></div>
            <span style={{ fontSize: 10.5, color: TOKENS.ink3, fontWeight: 600 }}>{progress}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

window.AssignmentsScreen = AssignmentsScreen;
