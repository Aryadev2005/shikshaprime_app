// 09-fees.jsx — Fees / Payments

function FeesScreen() {
  return (
    <ScreenShell padTop={56} bg={TOKENS.paper}>
      <TopBar title="Fees" trailing={
        <div style={{
          width: 38, height: 38, borderRadius: 12,
          background: TOKENS.surface, border: `1px solid ${TOKENS.line}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="download" size={18} color={TOKENS.ink} strokeWidth={1.8} />
        </div>
      }/>

      {/* Balance hero */}
      <div style={{ padding: '0 16px' }}>
        <div style={{
          borderRadius: 24, padding: '20px 20px',
          background: `linear-gradient(165deg, ${TOKENS.plum700} 0%, ${TOKENS.plum} 100%)`,
          color: '#fff', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: -40, right: -40, width: 180, height: 180,
            borderRadius: '50%', background: `radial-gradient(circle, ${TOKENS.coral}50, transparent 70%)`,
            filter: 'blur(24px)',
          }} />
          <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.65)', letterSpacing: 0.4 }}>OUTSTANDING BALANCE · Q2</div>
          <div style={{
            marginTop: 8, fontSize: 42, fontWeight: 700,
            letterSpacing: -1.4, lineHeight: 1, fontFamily: 'Inter',
            display: 'flex', alignItems: 'baseline', gap: 4,
          }}>
            <span style={{ fontSize: 22, opacity: 0.7 }}>₹</span>
            12,450
            <span style={{ fontSize: 18, opacity: 0.5, fontWeight: 500 }}>.00</span>
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
            Due 15 June · Late fee after due date
          </div>

          {/* Progress (paid so far) */}
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
              <span>₹37,550 paid</span>
              <span>of ₹50,000 annual</span>
            </div>
            <div style={{ marginTop: 6, height: 6, background: 'rgba(255,255,255,0.12)', borderRadius: 999 }}>
              <div style={{ width: '75%', height: '100%', background: `linear-gradient(90deg, ${TOKENS.coralWarm}, ${TOKENS.coral})`, borderRadius: 999 }} />
            </div>
          </div>

          {/* Pay button */}
          <div style={{
            marginTop: 16, height: 50, borderRadius: 14,
            background: '#fff', color: TOKENS.plum,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            fontSize: 15, fontWeight: 600,
          }}>
            Pay ₹12,450 now <Icon name="arrowR" size={16} color={TOKENS.plum} strokeWidth={2.4} />
          </div>
        </div>
      </div>

      {/* Quick methods */}
      <div style={{ padding: '18px 20px 0' }}>
        <SectionHead2 title="Pay with" />
        <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
          <PayMethod label="UPI"  icon="qr" />
          <PayMethod label="Card" icon="wallet" />
          <PayMethod label="NB"   icon="grad" />
          <PayMethod label="EMI"  icon="chart" />
        </div>
      </div>

      {/* Breakdown */}
      <div style={{ padding: '18px 20px 0' }}>
        <SectionHead2 title="What's owed" right="View invoice" />
        <div style={{
          marginTop: 10, background: '#fff', borderRadius: 16,
          border: `1px solid ${TOKENS.line}`,
        }}>
          <FeeRow label="Tuition · Q2" amount="9,000" />
          <Sep />
          <FeeRow label="Library" amount="450" />
          <Sep />
          <FeeRow label="Lab access" amount="1,200" />
          <Sep />
          <FeeRow label="Sports & clubs" amount="800" />
          <Sep />
          <FeeRow label="Late fee waiver" amount="−1,000" green />
          <Sep />
          <FeeRow label="Total" amount="12,450" bold />
        </div>
      </div>

      {/* History */}
      <div style={{ padding: '18px 20px 110px' }}>
        <SectionHead2 title="Recent payments" right="All" />
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <PayRow label="Q1 Tuition" date="12 Mar · UPI · ICICI" amount="11,200" />
          <PayRow label="Annual sports kit" date="04 Mar · Card · ••4421" amount="2,800" />
          <PayRow label="Examination fee" date="22 Feb · UPI · GPay" amount="900" />
        </div>
      </div>
    </ScreenShell>
  );
}

function SectionHead2({ title, right }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <div style={{ fontSize: 14.5, fontWeight: 700, color: TOKENS.ink }}>{title}</div>
      {right && <div style={{ fontSize: 12, color: TOKENS.plum, fontWeight: 600 }}>{right}</div>}
    </div>
  );
}
function PayMethod({ label, icon }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 14, border: `1px solid ${TOKENS.line}`,
      padding: '12px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
    }}>
      <div style={{
        width: 30, height: 30, borderRadius: 9,
        background: TOKENS.plumTint, color: TOKENS.plum,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name={icon} size={16} color={TOKENS.plum} strokeWidth={2} />
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, color: TOKENS.ink2 }}>{label}</div>
    </div>
  );
}
function FeeRow({ label, amount, green, bold }) {
  return (
    <div style={{
      padding: '12px 14px', display: 'flex',
      justifyContent: 'space-between', alignItems: 'center',
    }}>
      <span style={{ fontSize: 13.5, color: bold ? TOKENS.ink : TOKENS.ink2, fontWeight: bold ? 700 : 500 }}>{label}</span>
      <span style={{
        fontSize: bold ? 16 : 13.5,
        color: green ? TOKENS.green : TOKENS.ink,
        fontWeight: bold ? 700 : 600,
        letterSpacing: -0.2,
      }}>
        ₹{amount}
      </span>
    </div>
  );
}
function Sep() { return <div style={{ height: 1, background: TOKENS.line2, marginLeft: 14, marginRight: 14 }} />; }
function PayRow({ label, date, amount }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 14, border: `1px solid ${TOKENS.line}`,
      padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 10,
        background: TOKENS.greenTint, color: TOKENS.green,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name="check" size={16} color={TOKENS.green} strokeWidth={2.4} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: TOKENS.ink }}>{label}</div>
        <div style={{ fontSize: 11, color: TOKENS.ink3, marginTop: 1 }}>{date}</div>
      </div>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: TOKENS.ink, letterSpacing: -0.2 }}>₹{amount}</div>
    </div>
  );
}

window.FeesScreen = FeesScreen;
