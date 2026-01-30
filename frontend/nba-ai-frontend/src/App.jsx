import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Send, Trophy, Activity, MessageSquare, Zap, User, DollarSign, AlertCircle, Loader2, BarChart3, TrendingUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm';
import './App.css'
import { API_BASE_URL } from './config';


const PlayerPropsAnalyzer = () => {
  const [playerName, setPlayerName] = useState('');
  const [propType, setPropType] = useState('points');
  const [line, setLine] = useState('');
  const [opponent, setOpponent] = useState('');
  const [playerTeam, setPlayerTeam] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const propTypes = [
    { value: 'points', label: 'Points' },
    { value: 'rebounds', label: 'Rebounds' },
    { value: 'assists', label: 'Assists' },
    { value: 'threes', label: '3-Pointers' },
    { value: 'steals', label: 'Steals' },
    { value: 'blocks', label: 'Blocks' },
    { value: 'pts+rebs+asts', label: 'PRA' },
  ];

  const analyzeProp = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/player_props`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName, playerTeam, propType, line, opponent })
      });
      const result = await response.json();
      setAnalysis(result);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const confClass = analysis?.recommendation?.confidence === 'High' ? 'high-conf' : 
                 analysis?.recommendation?.confidence === 'Medium' ? 'med-conf' : 'low-conf';

  return (
    <div className="props-container">
      <div className="props-max-width">
        <div className="props-header">
          <h1>EDGE <span style={{ color: '#ea580c' }}>FINDER</span></h1>
        </div>

        <div className="betting-ticket" style={{ 
          display: 'flex', 
          flexDirection: 'row', 
          alignItems: 'flex-end', 
          gap: '8px', 
          padding: '12px',
          background: '#111114',
          borderRadius: '16px',
          border: '1px solid #2d2d30',
          marginBottom: '32px'
        }}>
          <div className="ticket-field" style={{ flex: 2, minWidth: '120px' }}>
            <label style={{ color: '#ea580c', fontSize: '10px', fontWeight: '900', marginBottom: '4px', display: 'block' }}>PLAYER</label>
            <input 
              placeholder="Name" 
              value={playerName} 
              onChange={e => setPlayerName(e.target.value)} 
              style={{ width: '100%', background: 'transparent', border: 'none', color: 'white', fontWeight: 'bold', outline: 'none' }}
            />
          </div>
          
          <div className="ticket-field" style={{ flex: 1.5, minWidth: '100px' }}>
            <label style={{ color: '#a78bfa', fontSize: '10px', fontWeight: '900', marginBottom: '4px', display: 'block' }}>PROP</label>
            <select 
              value={propType} 
              onChange={e => setPropType(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'white', fontWeight: 'bold', width: '100%', outline: 'none', cursor: 'pointer' }}
            >
              {propTypes.map(type => (
                <option key={type.value} value={type.value} style={{ background: '#111114' }}>{type.label}</option>
              ))}
            </select>
          </div>
          
          <div className="ticket-field" style={{ flex: 1 }}>
            <label style={{ color: '#3b82f6', fontSize: '10px', fontWeight: '900', marginBottom: '4px', display: 'block' }}>TEAM</label>
            <input 
              placeholder="DAL" 
              value={playerTeam} 
              onChange={e => setPlayerTeam(e.target.value)} 
              style={{ width: '100%', background: 'transparent', border: 'none', color: 'white', fontWeight: 'bold', outline: 'none' }}
            />
          </div>

          <div className="ticket-field" style={{ flex: 1 }}>
            <label style={{ color: '#3b82f6', fontSize: '10px', fontWeight: '900', marginBottom: '4px', display: 'block' }}>OPP</label>
            <input 
              placeholder="LAL" 
              value={opponent} 
              onChange={e => setOpponent(e.target.value)} 
              style={{ width: '100%', background: 'transparent', border: 'none', color: 'white', fontWeight: 'bold', outline: 'none' }}
            />
          </div>
          
          <div className="ticket-field" style={{ flex: 0.8 }}>
            <label style={{ color: '#10b981', fontSize: '10px', fontWeight: '900', marginBottom: '4px', display: 'block' }}>LINE</label>
            <input 
              placeholder="24.5" 
              value={line} 
              onChange={e => setLine(e.target.value)} 
              style={{ width: '100%', background: 'transparent', border: 'none', color: 'white', fontWeight: 'bold', outline: 'none' }}
            />
          </div>
          
          <button className="simulate-btn" onClick={analyzeProp} style={{ height: '42px', padding: '0 20px', marginLeft: '4px' }}>
            {loading ? '...' : 'SIMULATE'}
          </button>
        </div>

        {/* Analysis Results Display */}
        {analysis && (
          <div className="result-grid">
            {/* Main Recommendation Card */}
            <div className={`main-recommendation ${confClass}`} style={{ gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <h2>{analysis.recommendation.pick}</h2>
                  <p style={{ fontWeight: 'bold' }}>{line} {propType.toUpperCase()}</p>
                  {analysis.recommendation.projectedStat && (
                    <p style={{ fontSize: '0.9rem', color: '#cbd5e1', marginTop: '5px' }}>
                      Projected: {analysis.recommendation.projectedStat}
                    </p>
                  )}
                </div>
                <div className="confidence-chip">
                  <p style={{ fontSize: '10px', fontWeight: '900', margin: 0 }}>CONFIDENCE</p>
                  <p style={{ fontSize: '2rem', fontWeight: '900', margin: 0 }}>{analysis.recommendation.confidence}</p>
                </div>
              </div>
              <p style={{ color: '#e2e8f0', fontSize: '1.2rem', marginTop: '20px' }}>{analysis.recommendation.reasoning}</p>
            </div>

            {/* Detailed Analysis Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', gridColumn: '1 / -1' }}>
              {analysis.playerForm && (
                <div className="analysis-card">
                  <h3 style={{ color: '#ea580c', marginBottom: '15px', fontSize: '1.1rem', fontWeight: '700' }}>PLAYER FORM</h3>
                  <p style={{ color: '#e2e8f0', lineHeight: '1.6' }}>{analysis.playerForm}</p>
                </div>
              )}

              {analysis.matchupAnalysis && (
                <div className="analysis-card">
                  <h3 style={{ color: '#3b82f6', marginBottom: '15px', fontSize: '1.1rem', fontWeight: '700' }}>MATCHUP ANALYSIS</h3>
                  <p style={{ color: '#e2e8f0', lineHeight: '1.6' }}>{analysis.matchupAnalysis}</p>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', gridColumn: '1 / -1' }}>
              {analysis.trends && (
                <div className="analysis-card">
                  <h3 style={{ color: '#a78bfa', marginBottom: '15px', fontSize: '1.1rem', fontWeight: '700' }}>RECENT TRENDS</h3>
                  <p style={{ color: '#e2e8f0', lineHeight: '1.6' }}>{analysis.trends}</p>
                </div>
              )}

              {analysis.keyFactors && analysis.keyFactors.length > 0 && (
                <div className="analysis-card">
                  <h3 style={{ color: '#10b981', marginBottom: '15px', fontSize: '1.1rem', fontWeight: '700' }}>KEY FACTORS</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {analysis.keyFactors.map((factor, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#e2e8f0' }}>
                        <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '1.2rem' }}>•</span>
                        <span>{factor}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


const App = () => {
  const [messages, setMessages] = useState([
    { id: 1, text: "Welcome to the Arena. I'm HoopsAI. Ask me about NBA stats or past games!", sender: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const [standingsData, setStandingsData] = useState({ east: '', west: '' });
  const scrollRef = useRef(null);
  const location = useLocation();
  const [leaderboards, setLeaderboards] = useState(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, location.pathname]);

  const fetchLeaders = async () => {
    const response = await fetch(`${API_BASE_URL}/league_leaders`);
    const data = await response.json();
    setLeaderboards(data);
  };

  const fetchStandings = async () => {
    // Remove the early return check entirely
    setStandingsData({ east: "Loading East...", west: "Loading West..." });

    try {
      const response = await fetch(`${API_BASE_URL}/standings`);
      const data = await response.json();
      setStandingsData({
        east: data.east,
        west: data.west
      });
    } catch (error) {
      console.error("Error fetching standings:", error);
      setStandingsData({ east: "Error loading data.", west: "Error loading data." });
    }
  };

  useEffect(() => {
    if (location.pathname === '/standings') {
      fetchStandings();
    }
    if(location.pathname === '/league-leaders'){
      fetchLeaders();
    }
  }, [location.pathname]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { id: Date.now(), text: input, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }), 
      });
      const data = await response.json();
      setMessages(prev => [...prev, { id: Date.now() + 1, text: data.reply, sender: 'bot' }]);
    } catch (error) {
      console.error("Error connecting to backend:", error);
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
    tableContainer: { flex: 1, overflowY: 'auto', padding: '40px', backgroundColor: '#0a0a0c', boxSizing: 'border-box' },
    userBubble: { alignSelf: 'flex-end', backgroundColor: '#ea580c', color: 'white', padding: '12px 16px', borderRadius: '16px 16px 0 16px', maxWidth: '70%', fontSize: '0.95rem' },
    botBubble: { alignSelf: 'flex-start', backgroundColor: '#1e1e21', border: '1px solid #2d2d30', color: '#e2e8f0', padding: '12px 16px', borderRadius: '16px 16px 16px 0', maxWidth: '70%', fontSize: '0.95rem' },
    inputArea: { padding: '24px', backgroundColor: '#0a0a0c' },
    inputWrapper: { maxWidth: '800px', margin: '0 auto', position: 'relative', display: 'flex', alignItems: 'center' },
    input: { width: '100%', backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '12px', padding: '14px 20px', color: 'white', outline: 'none', fontSize: '1rem' },
    sendBtn: { position: 'absolute', right: '10px', backgroundColor: '#ea580c', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: 'white', display: 'flex' }
  };

  const getHeaderText = () => {
    switch(location.pathname) {
      case '/': return 'SYSTEM ONLINE';
      case '/standings': return 'LEAGUE STANDINGS';
      case '/league-leaders': return 'LEAGUE LEADERS';
      case '/player-props': return 'PLAYER PROPS';
      default: return 'SYSTEM ONLINE';
    }
  };

  return (
    <div style={s.container}>
      <aside style={s.sidebar}>
        <div style={s.logoSection}>
          <div style={s.logoIcon}><Zap size={20} /></div>
          <span style={s.logoText}>HOOPS.AI</span>
        </div>
        <div style={{ color: '#64748b', fontSize: '0.7rem', letterSpacing: '2px', fontWeight: 'bold', marginBottom: '16px' }}>ANALYTICS</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <SidebarItem 
            to="/" 
            icon={<MessageSquare size={18}/>} 
            label="Chat History" 
            active={location.pathname === '/'} 
          />
          <SidebarItem 
            to="/standings" 
            icon={<Trophy size={18}/>} 
            label="Standings" 
            active={location.pathname === '/standings'}
          />
          <SidebarItem 
            to="/league-leaders" 
            icon={<Activity size={18}/>} 
            label="League Leaders" 
            active={location.pathname === '/league-leaders'} 
          />
          <SidebarItem 
            to="/player_props" 
            icon={<DollarSign size={18}/>} 
            label="Player Props" 
            active={location.pathname === '/player-props'} 
          />
        </div>
      </aside>

      <main style={s.main}>
        <header style={s.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', backgroundColor: '#22c55e', borderRadius: '50%' }}></div>
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8' }}>
              {getHeaderText()}
            </span>
          </div>
        </header>

        <Routes>
          <Route path="/" element={
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
                    placeholder="Ask about NBA stats..."
                  />
                  <button style={s.sendBtn} onClick={handleSend}><Send size={20} /></button>
                </div>
              </div>
            </>
          } />
          <Route path="/standings" element={
            <div style={{ ...s.tableContainer, width: '100%' }}>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '32px',
                padding: '20px',
                maxWidth: '1200px',
                margin: '0 auto'
              }}>
                <div style={{ 
                  backgroundColor: '#111114', 
                  padding: '30px', 
                  borderRadius: '16px', 
                  border: '1px solid #2d2d30',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                }}>
                  <StandingTable data={standingsData.east} />
                </div>
                <div style={{ 
                  backgroundColor: '#111114', 
                  padding: '30px', 
                  borderRadius: '16px', 
                  border: '1px solid #2d2d30',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.5)' 
                }}>
                  <StandingTable data={standingsData.west} />
                </div>
              </div>
            </div>
          } />
          <Route path="/league-leaders" element={
            <div style={{ ...s.tableContainer, width: '100%', boxSizing: 'border-box' }}>
              <h1 style={{ color: '#fff', marginBottom: '24px', fontSize: '1.5rem' }}>League Leaders (2025-26)</h1>
              
              {!leaderboards ? (
                <div style={{ color: '#64748b' }}>Loading elite performance data...</div>
              ) : (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                  gap: '24px' 
                }}>
                  <LeaderboardCard title="🔥 Scoring" players={leaderboards.pts} statKey="PTS" unit="PPG" />
                  <LeaderboardCard title="🎯 Playmaking" players={leaderboards.ast} statKey="AST" unit="APG" />
                  <LeaderboardCard title="🧺 Glass Cleaning" players={leaderboards.reb} statKey="REB" unit="RPG" />
                  <LeaderboardCard title="🛡️ Steals" players={leaderboards.stl} statKey="STL" unit="SPG" />
                  <LeaderboardCard title="🚫 Rim Protection" players={leaderboards.blk} statKey="BLK" unit="BPG" />
                </div>
              )}
            </div>
          } />
          <Route path="/player-props" element={<PlayerPropsAnalyzer />} />
        </Routes>
      </main>
    </div>
  );
};

const SidebarItem = ({ icon, label, active = false, to }) => (
  <Link 
    to={to} 
    style={{
      textDecoration: 'none',
      display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', borderRadius: '8px',
      backgroundColor: active ? 'rgba(234, 88, 12, 0.1)' : 'transparent',
      color: active ? '#ea580c' : '#94a3b8',
      transition: 'all 0.2s ease'
    }}
  >
    {icon}
    <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{label}</span>
  </Link>
);

const StandingTable = ({ data }) => (
  <ReactMarkdown 
    remarkPlugins={[remarkGfm]}
    components={{
      h3: ({node, ...props}) => (
        <h3 style={{ 
          color: '#ea580c', 
          marginBottom: '20px', 
          fontSize: '1.5rem',
          fontWeight: '900',
          letterSpacing: '1px',
          textAlign: 'center' 
        }} {...props} />
      ),
      table: ({node, ...props}) => (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ 
            borderCollapse: 'separate', 
            borderSpacing: '0 8px',
            width: '100%', 
            fontSize: '1rem',
            textAlign: 'left' 
          }} {...props} />
        </div>
      ),
      th: ({node, ...props}) => {
        const label = String(props.children).toUpperCase();
        const headerColor = label === 'W' ? '#22c55e' : (label === 'L' ? '#ef4444' : '#94a3b8');
        
        return (
          <th style={{ 
            padding: '12px 10px', 
            color: headerColor, 
            fontWeight: 'bold',
            fontSize: '0.85rem',
            letterSpacing: '1px',
            borderBottom: '2px solid #2d2d30' 
          }} {...props} />
        );
      },
      td: ({node, ...props}) => (
        <td style={{ 
          padding: '12px 10px', 
          color: '#e2e8f0',
          backgroundColor: '#18181b',
          borderTop: '1px solid #2d2d30',
          borderBottom: '1px solid #2d2d30'
        }} {...props} />
      )
    }}
  >
    {data}
  </ReactMarkdown>
);

const LeaderboardCard = ({ title, players, statKey, unit }) => (
  <div style={{
    backgroundColor: '#111114',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid #2d2d30',
  }}>
    <h3 style={{ 
      color: '#ea580c', 
      marginBottom: '15px', 
      fontSize: '1.1rem', 
      borderBottom: '1px solid #2d2d30', 
      paddingBottom: '10px' 
    }}>
      {title}
    </h3>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {players?.map((player, index) => (
        <div key={index} style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          fontSize: '0.85rem',
          color: index === 0 ? '#fff' : '#94a3b8',
          fontWeight: index === 0 ? 'bold' : 'normal',
          backgroundColor: index === 0 ? 'rgba(234, 88, 12, 0.05)' : 'transparent',
          padding: '4px 8px',
          borderRadius: '4px'
        }}>
          <span>{index + 1}. {player.PLAYER}</span>
          <span style={{ color: '#ea580c' }}>{player[statKey]} {unit}</span>
        </div>
      ))}
    </div>
  </div>
);

export default App;