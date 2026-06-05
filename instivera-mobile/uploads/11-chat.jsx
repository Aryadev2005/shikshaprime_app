// 11-chat.jsx — Conversations / messaging hub

function ChatScreen() {
  return (
    <ScreenShell padTop={56} bg={TOKENS.paper}>
      <div style={{ padding: '0 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, color: TOKENS.ink3, letterSpacing: 0.4, textTransform: 'uppercase' }}>3 unread</div>
            <div style={{
              fontFamily: 'Instrument Serif, serif',
              fontSize: 30, color: TOKENS.ink, letterSpacing: -0.5, lineHeight: 1, marginTop: 4,
            }}>Messages</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 12,
              background: '#fff', border: `1px solid ${TOKENS.line}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="search" size={17} color={TOKENS.ink} strokeWidth={1.8} />
            </div>
            <div style={{
              width: 38, height: 38, borderRadius: 12,
              background: `linear-gradient(180deg, ${TOKENS.coralWarm}, ${TOKENS.coral})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(255,107,61,0.32)',
            }}>
              <Icon name="edit" size={17} color="#fff" strokeWidth={2} />
            </div>
          </div>
        </div>
      </div>

      {/* Active people horizontal */}
      <div style={{ padding: '18px 20px 0', display: 'flex', gap: 14, overflow: 'hidden' }}>
        <ActiveBubble name="Class XII-A" online count={42} group />
        <ActiveBubble name="John Doe"  online />
        <ActiveBubble name="P. Nair" />
        <ActiveBubble name="Karan V." online />
        <ActiveBubble name="Tara I." />
      </div>

      {/* Section title */}
      <div style={{ padding: '20px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: TOKENS.ink }}>Recent</div>
        <div style={{ fontSize: 12, color: TOKENS.ink3 }}>Pinned · Class · DMs</div>
      </div>

      {/* List */}
      <div style={{ padding: '10px 16px 110px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <ChatRow
          name="Class XII-A"
          sub="Mrs. Nair: Submission window extended to…"
          time="09:14"
          unread={2}
          pinned
          group
        />
        <ChatRow
          name="John Doe"
          sub="Great work on yesterday's worksheet 👏"
          time="08:02"
          unread={1}
          online
        />
        <ChatRow
          name="Mom"
          sub="Voice message"
          voice
          duration="0:18"
          time="Mon"
        />
        <ChatRow
          name="Sports Squad"
          sub="Karan: who's in for tomorrow practice?"
          time="Mon"
          group
          muted
        />
        <ChatRow
          name="Riya Mukherjee"
          sub="You: see you at the library at 4"
          time="Sun"
          read
        />
        <ChatRow
          name="Admin · Fees"
          sub="Q2 payment due in 18 days"
          time="Sun"
          system
        />
      </div>
    </ScreenShell>
  );
}

function ActiveBubble({ name, online, count, group }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: 60, flexShrink: 0 }}>
      <div style={{ position: 'relative' }}>
        <div style={{
          width: 54, height: 54, borderRadius: '50%',
          background: group
            ? `linear-gradient(160deg, ${TOKENS.coralWarm}, ${TOKENS.coral})`
            : undefined,
          padding: 2.5,
          boxShadow: online && !group ? `0 0 0 2px ${TOKENS.coral}` : 'none',
        }}>
          {group ? (
            <div style={{
              width: '100%', height: '100%', borderRadius: '50%',
              background: TOKENS.plum, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Instrument Serif, serif', fontSize: 22,
            }}>XII</div>
          ) : (
            <Avatar name={name} size={49} />
          )}
        </div>
        {online && !group && (
          <div style={{
            position: 'absolute', bottom: 1, right: 1,
            width: 12, height: 12, borderRadius: '50%',
            background: TOKENS.green, border: '2.5px solid ' + TOKENS.paper,
          }} />
        )}
        {count && (
          <div style={{
            position: 'absolute', bottom: -2, right: -2,
            background: '#fff', color: TOKENS.plum,
            border: `2px solid ${TOKENS.paper}`,
            borderRadius: 999, padding: '1px 5px',
            fontSize: 9, fontWeight: 700,
          }}>{count}</div>
        )}
      </div>
      <div style={{
        fontSize: 11, fontWeight: 600, color: TOKENS.ink2,
        textAlign: 'center', maxWidth: 60,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>{name}</div>
    </div>
  );
}

function ChatRow({ name, sub, time, unread, pinned, online, group, voice, duration, muted, read, system }) {
  return (
    <div style={{
      padding: '10px 12px', borderRadius: 16,
      background: unread ? TOKENS.plumTint : 'transparent',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        {system ? (
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: TOKENS.coralTint, color: TOKENS.coral,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="wallet" size={20} color={TOKENS.coral} strokeWidth={2} />
          </div>
        ) : group ? (
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: TOKENS.plum, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Instrument Serif, serif', fontSize: 18,
          }}>{name.split(' ').map(w => w[0]).join('').slice(0,2)}</div>
        ) : (
          <Avatar name={name} size={44} />
        )}
        {online && (
          <div style={{
            position: 'absolute', bottom: -1, right: -1,
            width: 11, height: 11, borderRadius: '50%',
            background: TOKENS.green, border: '2.5px solid ' + TOKENS.paper,
          }} />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: TOKENS.ink, letterSpacing: -0.1 }}>{name}</span>
          {pinned && <Icon name="pin" size={11} color={TOKENS.ink3} strokeWidth={2} />}
          {muted && <Icon name="bell" size={11} color={TOKENS.ink4} strokeWidth={2} />}
        </div>
        <div style={{
          marginTop: 2, fontSize: 12.5, color: TOKENS.ink3,
          display: 'flex', alignItems: 'center', gap: 6,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {voice ? (
            <>
              <Icon name="mic" size={12} color={TOKENS.coral} strokeWidth={2} />
              <span style={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, maxWidth: 100 }}>
                {[6, 12, 9, 14, 7, 10, 4, 12, 9, 6, 11, 8].map((h, i) => (
                  <span key={i} style={{ width: 2, height: h, background: TOKENS.coral, opacity: i < 4 ? 1 : 0.4, borderRadius: 1 }} />
                ))}
              </span>
              <span>{duration}</span>
            </>
          ) : (
            <>
              {read && <Icon name="check" size={12} color={TOKENS.blue} strokeWidth={2.4} />}
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</span>
            </>
          )}
        </div>
      </div>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
        gap: 4, flexShrink: 0,
      }}>
        <div style={{ fontSize: 10.5, color: TOKENS.ink3 }}>{time}</div>
        {unread && (
          <div style={{
            background: TOKENS.coral, color: '#fff',
            borderRadius: 999, padding: '1px 7px',
            fontSize: 10.5, fontWeight: 700, minWidth: 18, textAlign: 'center',
          }}>{unread}</div>
        )}
      </div>
    </div>
  );
}

window.ChatScreen = ChatScreen;
