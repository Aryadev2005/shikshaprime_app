// 04-attendance-taker.jsx — Teacher's Attendance Taker (Tinder-style swipe + summary chip)

function AttendanceTakerScreen() {
  return (
    <ScreenShell padTop={56} bg={TOKENS.plumDeep}>
      {/* Dark backdrop with glow */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(120% 70% at 50% 0%, ${TOKENS.plum700} 0%, ${TOKENS.plumDeep} 70%)`,
      }} />
      <div style={{
        position: 'absolute', top: 100, left: '50%', transform: 'translateX(-50%)',
        width: 280, height: 280, borderRadius: '50%',
        background: `radial-gradient(circle, ${TOKENS.coral}30, transparent 65%)`,
        filter: 'blur(36px)',
      }} />

      {/* Header (dark) */}
      <div style={{ padding: '6px 20px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
        <div style={{
          width: 38, height: 38, borderRadius: 12,
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="x" size={18} color="#fff" strokeWidth={2} />
        </div>
        <div style={{ textAlign: 'center', color: '#fff' }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', letterSpacing: 0.4, textTransform: 'uppercase' }}>Class XII-A · Math</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Take Attendance</div>
        </div>
        <div style={{
          width: 38, height: 38, borderRadius: 12,
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="undo" size={18} color="#fff" strokeWidth={2} />
        </div>
      </div>

      {/* Progress + counts */}
      <div style={{ padding: '4px 20px 0', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.65)', letterSpacing: 0.5 }}>STUDENT 18 OF 42</div>
          <div style={{ display: 'flex', gap: 10, fontSize: 11.5, color: '#fff', fontWeight: 600 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: TOKENS.green }} /> 14
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: TOKENS.red }} /> 3
            </span>
          </div>
        </div>
        <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ width: '42%', height: '100%', background: `linear-gradient(90deg, ${TOKENS.coralWarm}, ${TOKENS.coral})`, borderRadius: 999 }} />
        </div>
      </div>

      {/* Stack of swipe cards */}
      <div style={{ position: 'relative', marginTop: 26, height: 460 }}>
        {/* Back card 2 */}
        <SwipeCard offsetY={16} scale={0.9} opacity={0.4} name="Ananya Sharma" roll="26EN011" />
        {/* Back card 1 */}
        <SwipeCard offsetY={8} scale={0.95} opacity={0.7} name="Karan Verma" roll="26EN010" />
        {/* Front card — tilted right (PRESENT preview) */}
        <SwipeCard offsetY={0} scale={1} opacity={1} rotate={6} translateX={26} name="Apurba Das" roll="26EN009" hint="present" />
      </div>

      {/* Action buttons */}
      <div style={{
        position: 'absolute', bottom: 56, left: 0, right: 0,
        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 22,
      }}>
        <ActionFAB icon="x" tone="red" />
        <ActionFAB icon="clock" tone="amber" size={56} />
        <ActionFAB icon="check" tone="green" size={70} primary />
      </div>
    </ScreenShell>
  );
}

function SwipeCard({ offsetY = 0, scale = 1, opacity = 1, rotate = 0, translateX = 0, name, roll, hint }) {
  return (
    <div style={{
      position: 'absolute', left: 20, right: 20, top: offsetY,
      transform: `translateX(${translateX}px) scale(${scale}) rotate(${rotate}deg)`,
      transformOrigin: 'bottom center',
      opacity, transition: 'all .2s',
    }}>
      <div style={{
        background: '#fff', borderRadius: 24,
        boxShadow: '0 30px 60px rgba(0,0,0,0.35)',
        padding: 22, overflow: 'hidden', position: 'relative',
      }}>
        {/* PRESENT stamp */}
        {hint === 'present' && (
          <div style={{
            position: 'absolute', top: 18, right: 18,
            padding: '6px 12px', borderRadius: 8,
            border: `2.5px solid ${TOKENS.green}`,
            color: TOKENS.green, fontWeight: 800,
            fontSize: 13, letterSpacing: 2,
            transform: 'rotate(8deg)',
          }}>
            PRESENT
          </div>
        )}

        {/* Big avatar */}
        <div style={{
          width: '100%', aspectRatio: '1 / 1', borderRadius: 18,
          background: `linear-gradient(160deg, ${TOKENS.plumTint} 0%, ${TOKENS.coralTint} 100%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}>
          <div style={{
            fontFamily: 'Instrument Serif, serif',
            fontSize: 120, color: TOKENS.plum, letterSpacing: -2,
            opacity: 0.85,
          }}>
            {name.split(' ').map(w => w[0]).join('').toUpperCase()}
          </div>
        </div>

        {/* Identity */}
        <div style={{ marginTop: 18, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: TOKENS.ink, letterSpacing: -0.4 }}>{name}</div>
            <div style={{ fontSize: 12.5, color: TOKENS.ink3, marginTop: 3 }}>Roll {roll} · XII-A</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon name="flame" size={13} color={TOKENS.coral} strokeWidth={2} fill={TOKENS.coralTint} />
            <span style={{ fontSize: 12, fontWeight: 600, color: TOKENS.coral }}>12-day streak</span>
          </div>
        </div>

        {/* Mini stat */}
        <div style={{
          marginTop: 14, padding: 12, borderRadius: 12,
          background: TOKENS.plumTint,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 10.5, color: TOKENS.ink3, letterSpacing: 0.4 }}>SEMESTER ATTENDANCE</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: TOKENS.plum, marginTop: 2 }}>91% · 78 of 86 classes</div>
          </div>
          <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 24 }}>
            {[14, 10, 18, 13, 20, 16, 22].map((h, i) => (
              <div key={i} style={{
                width: 4, height: h, borderRadius: 2,
                background: i === 6 ? TOKENS.plum : TOKENS.plum300,
              }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionFAB({ icon, tone, size = 56, primary }) {
  const colors = {
    green: TOKENS.green, red: TOKENS.red, amber: TOKENS.amber,
  };
  const c = colors[tone];
  if (primary) {
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: `linear-gradient(180deg, #2EBA8E, ${c})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 10px 24px ${c}55, inset 0 1px 0 rgba(255,255,255,0.3)`,
      }}>
        <Icon name={icon} size={28} color="#fff" strokeWidth={3} />
      </div>
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'rgba(255,255,255,0.95)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 8px 18px rgba(0,0,0,0.25)',
    }}>
      <Icon name={icon} size={size === 70 ? 26 : 22} color={c} strokeWidth={2.6} />
    </div>
  );
}

window.AttendanceTakerScreen = AttendanceTakerScreen;
