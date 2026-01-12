import React, { useState, useEffect, useRef } from 'react';
import { Send, Trophy, Activity, MessageSquare, Zap } from 'lucide-react';
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm';

const App = () => {
  const [messages, setMessages] = useState([
    { id: 1, text: "Welcome to the Arena. I'm HoopsAI. Ask me about NBA stats or game analysis!", sender: 'bot' }
  ]);
  const [input, setInput] = useState('');
  
  // 1. ADDED: State to track which screen we are looking at
  const [activeView, setActiveView] = useState('chat'); // 'chat' or 'standings'
  const [standingsData, setStandingsData] = useState(''); // Store the raw Markdown/table data

  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeView]); // Scroll when view changes too

  const handleStandings = async () => {
    setActiveView('standings');
    setStandingsData({ east: "Loading East...", west: "Loading West..." });

    try {
      const response = await fetch('http://localhost:8000/standings');
      const data = await response.json();

      // Now we use the specific keys from your Python return
      setStandingsData({
        east: data.east,
        west: data.west
      });
    } catch (error) {
      console.error("Error fetching standings:", error);
      setStandingsData({ east: "Error loading data.", west: "Error loading data." });
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userQuery = input;
    const userMsg = { id: Date.now(), text: userQuery, sender: 'user' };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    try {
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userQuery }), 
      });

      const data = await response.json();
      const botMsg = { 
        id: Date.now() + 1, 
        text: data.reply, 
        sender: 'bot' 
      };
      
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error("Error connecting to basketball backend:", error);
    }
  };

  const s = {
    container: { display: 'flex', height: '100vh', backgroundColor: '#0a0a0c', color: '#e2e8f0', fontFamily: 'sans-serif' },
    sidebar: { width: '260px', backgroundColor: '#111114', borderRight: '1px solid #2d2d30', padding: '24px', display: 'flex', flexDirection: 'column' },
    logoSection: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' },
    logoIcon: { backgroundColor: '#ea580c', padding: '8px', borderRadius: '8px', display: 'flex' },
    logoText: { fontWeight: '900', fontSize: '1.2rem', fontStyle: 'italic', letterSpacing: '-1px' },
    main: { flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' },
    header: { height: '60px', borderBottom: '1px solid #2d2d30', display: 'flex', alignItems: 'center', padding: '0 24px', backgroundColor: 'rgba(10,10,12,0.8)' },
    chatWindow: { flex: 1, overflowY: 'auto', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' },
    // 3. New style for the full-page table container
    tableContainer: { flex: 1, overflowY: 'auto', padding: '40px', backgroundColor: '#0a0a0c' },
    userBubble: { alignSelf: 'flex-end', backgroundColor: '#ea580c', color: 'white', padding: '12px 16px', borderRadius: '16px 16px 0 16px', maxWidth: '70%', fontSize: '0.95rem' },
    botBubble: { alignSelf: 'flex-start', backgroundColor: '#1e1e21', border: '1px solid #2d2d30', color: '#e2e8f0', padding: '12px 16px', borderRadius: '16px 16px 16px 0', maxWidth: '70%', fontSize: '0.95rem' },
    inputArea: { padding: '24px', backgroundColor: '#0a0a0c' },
    inputWrapper: { maxWidth: '800px', margin: '0 auto', position: 'relative', display: 'flex', alignItems: 'center' },
    input: { width: '100%', backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '12px', padding: '14px 20px', color: 'white', outline: 'none', fontSize: '1rem' },
    sendBtn: { position: 'absolute', right: '10px', backgroundColor: '#ea580c', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: 'white', display: 'flex' }
  };

  return (
    <div style={s.container}>
      {/* Sidebar */}
      <aside style={s.sidebar}>
        <div style={s.logoSection}>
          <div style={s.logoIcon}><Zap size={20} /></div>
          <span style={s.logoText}>HOOPS.BOX</span>
        </div>
        <div style={{ color: '#64748b', fontSize: '0.7rem', letterSpacing: '2px', fontWeight: 'bold', marginBottom: '16px' }}>ANALYTICS</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          
          {/* 4. Update Chat History to set view back to 'chat' */}
          <SidebarItem 
            icon={<MessageSquare size={18}/>} 
            label="Chat History" 
            active={activeView === 'chat'} 
            onClick={() => setActiveView('chat')}
          />
          <SidebarItem 
            icon={<Trophy size={18}/>} 
            label="Standings" 
            active={activeView === 'standings'}
            onClick={handleStandings} 
          />
          <SidebarItem icon={<Activity size={18}/>} label="Live Stats" />
        </div>
      </aside>

      {/* Main Content */}
      <main style={s.main}>
        <header style={s.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', backgroundColor: '#22c55e', borderRadius: '50%' }}></div>
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8' }}>
                {activeView === 'chat' ? 'SYSTEM ONLINE' : 'LEAGUE STANDINGS'}
            </span>
          </div>
        </header>

        {/* 5. CONDITIONALLY RENDER: Chat vs Standings */}
        {activeView === 'chat' ? (
          <>
            <div style={s.chatWindow}>
              {messages.map((msg) => (
                <div key={msg.id} style={msg.sender === 'user' ? s.userBubble : s.botBubble}>
                  {msg.sender === 'user' ? msg.text : (
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({node, ...props}) => <p style={{ margin: '0 0 10px 0' }} {...props} />,
                        table: ({node, ...props}) => (
                          <div style={{ overflowX: 'auto', margin: '10px 0' }}>
                            <table style={{ borderCollapse: 'collapse', width: '100%', border: '1px solid #3f3f46' }} {...props} />
                          </div>
                        ),
                        th: ({node, ...props}) => <th style={{ backgroundColor: '#27272a', padding: '8px', border: '1px solid #3f3f46', textAlign: 'left' }} {...props} />,
                        td: ({node, ...props}) => <td style={{ padding: '8px', border: '1px solid #3f3f46' }} {...props} />
                      }}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  )}
                </div>
              ))}
              <div ref={scrollRef} />
            </div>

            <div style={s.inputArea}>
              <div style={s.inputWrapper}>
                <input 
                  style={s.input}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask about current or past NBA players or teams..."
                />
                <button style={s.sendBtn} onClick={handleSend}>
                  <Send size={20} />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* 3. STANDINGS VIEW (Side-by-Side Tables) */
          <div style={{ ...s.tableContainer, maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
            <div style={{ 
              display: 'flex', 
              gap: '24px', 
              padding: '20px',
              justifyContent: 'center',
              alignItems: 'flex-start' 
            }}>
              <div style={{ flex: 1, backgroundColor: '#111114', padding: '20px', borderRadius: '12px', border: '1px solid #2d2d30' }}>
                <StandingTable data={standingsData.east} />
              </div>
              <div style={{ flex: 1, backgroundColor: '#111114', padding: '20px', borderRadius: '12px', border: '1px solid #2d2d30' }}>
                <StandingTable data={standingsData.west} />
              </div>
            </div>
          </div>
        )}
        
      </main>
    </div>
  );
};

// Helper Sidebar Component
const SidebarItem = ({ icon, label, active = false, onClick }) => (
  <div 
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', borderRadius: '8px', cursor: 'pointer',
      backgroundColor: active ? 'rgba(234, 88, 12, 0.1)' : 'transparent',
      color: active ? '#ea580c' : '#94a3b8',
      transition: 'all 0.2s ease'
    }}
  >
    {icon}
    <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{label}</span>
  </div>
);
const StandingTable = ({ data }) => (
  <ReactMarkdown 
    remarkPlugins={[remarkGfm]}
    components={{
      h3: ({node, ...props}) => (
        <h3 style={{ color: '#ea580c', marginBottom: '15px', fontSize: '1.2rem', fontWeight: 'bold' }} {...props} />
      ),
      table: ({node, ...props}) => (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.8rem', textAlign: 'left' }} {...props} />
        </div>
      ),
      th: ({node, ...props}) => (
        <th style={{ borderBottom: '2px solid #2d2d30', padding: '12px 8px', color: '#94a3b8', fontWeight: 'bold' }} {...props} />
      ),
      td: ({node, ...props}) => (
        <td style={{ borderBottom: '1px solid #1e1e21', padding: '10px 8px', color: '#e2e8f0' }} {...props} />
      )
    }}
  >
    {data}
  </ReactMarkdown>
);
export default App;