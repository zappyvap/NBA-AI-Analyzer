import React, { useState, useEffect, useRef } from 'react';
import { Send, Trophy, Activity, MessageSquare, Zap } from 'lucide-react';

const App = () => {
  const [messages, setMessages] = useState([
    { id: 1, text: "Welcome to the Arena. I'm HoopsAI. Ask me about NBA stats or game analysis!", sender: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    // 1. Capture the user's query from the 'input' state
    const userQuery = input;
    const userMsg = { id: Date.now(), text: userQuery, sender: 'user' };
    
    // 2. Add user message to UI immediately
    setMessages(prev => [...prev, userMsg]);
    setInput(''); // Clear the bar

    try {
      // 3. Send the query to your backend
      // Replace 'http://localhost:5000/chat' with your actual backend URL
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userQuery }), 
      });

      const data = await response.json();

      // 4. Take the text your backend "spits out" (assuming it's in data.reply)
      // and add it to the 'messages' state
      const botMsg = { 
        id: Date.now() + 1, 
        text: data.reply, // This is the text from your backend
        sender: 'bot' 
      };
      
      setMessages(prev => [...prev, botMsg]);

    } catch (error) {
      console.error("Error connecting to basketball backend:", error);
    }
  };

  // --- STYLES OBJECT (Standard CSS) ---
  const s = {
    container: { display: 'flex', height: '100vh', backgroundColor: '#0a0a0c', color: '#e2e8f0', fontFamily: 'sans-serif' },
    sidebar: { width: '260px', backgroundColor: '#111114', borderRight: '1px solid #2d2d30', padding: '24px', display: 'flex', flexDirection: 'column' },
    logoSection: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' },
    logoIcon: { backgroundColor: '#ea580c', padding: '8px', borderRadius: '8px', display: 'flex' },
    logoText: { fontWeight: '900', fontSize: '1.2rem', fontStyle: 'italic', letterSpacing: '-1px' },
    main: { flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' },
    header: { height: '60px', borderBottom: '1px solid #2d2d30', display: 'flex', alignItems: 'center', padding: '0 24px', backgroundColor: 'rgba(10,10,12,0.8)' },
    chatWindow: { flex: 1, overflowY: 'auto', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' },
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
          <SidebarItem icon={<MessageSquare size={18}/>} label="Chat History" active />
          <SidebarItem icon={<Trophy size={18}/>} label="Standings" />
          <SidebarItem icon={<Activity size={18}/>} label="Live Stats" />
        </div>
      </aside>

      {/* Main Content */}
      <main style={s.main}>
        <header style={s.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', backgroundColor: '#22c55e', borderRadius: '50%' }}></div>
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8' }}>SYSTEM ONLINE</span>
          </div>
        </header>

        <div style={s.chatWindow}>
          {messages.map((msg) => (
            <div key={msg.id} style={msg.sender === 'user' ? s.userBubble : s.botBubble}>
              {msg.text}
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
              placeholder="Ask about LeBron, Curry, or game tactics..."
            />
            <button style={s.sendBtn} onClick={handleSend}>
              <Send size={20} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

// Helper Sidebar Component
const SidebarItem = ({ icon, label, active = false }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', borderRadius: '8px', cursor: 'pointer',
    backgroundColor: active ? 'rgba(234, 88, 12, 0.1)' : 'transparent',
    color: active ? '#ea580c' : '#94a3b8'
  }}>
    {icon}
    <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{label}</span>
  </div>
);

export default App;