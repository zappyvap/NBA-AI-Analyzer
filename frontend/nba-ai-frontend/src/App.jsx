import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Send, Trophy, Activity, MessageSquare, Zap, User, DollarSign, AlertCircle, Loader2, BarChart3, TrendingUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm';

// Player Props Analyzer Component
// At the top of App.jsx, replace the old PlayerPropsAnalyzer with this:

const PlayerPropsAnalyzer = () => {
  const [playerName, setPlayerName] = useState('');
  const [propType, setPropType] = useState('points');
  const [line, setLine] = useState('');
  const [opponent, setOpponent] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [playerTeam, setPlayerTeam] = useState('');

  const propTypes = [
    { value: 'points', label: 'Points' },
    { value: 'rebounds', label: 'Rebounds' },
    { value: 'assists', label: 'Assists' },
    { value: 'threes', label: '3-Pointers Made' },
    { value: 'pts+rebs+asts', label: 'Points + Rebounds + Assists' },
    { value: 'pts+rebs', label: 'Points + Rebounds' },
    { value: 'pts+asts', label: 'Points + Assists' },
    { value: 'rebs+asts', label: 'Rebounds + Assists' },
    { value: 'steals', label: 'Steals' },
    { value: 'blocks', label: 'Blocks' },
  ];

  const analyzeProp = async () => {
    if (!playerName || !playerTeam || !line || !opponent) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const propLabel = propTypes.find(p => p.value === propType)?.label || propType;
      
      const response = await fetch('http://localhost:8000/player_props', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerName,
          playerTeam,
          propType: propLabel,
          line,
          opponent
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get analysis');
      }

      const result = await response.json();
      setAnalysis(result);

    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence === 'High') return 'text-green-400 bg-green-500/20 border-green-500';
    if (confidence === 'Medium') return 'text-yellow-400 bg-yellow-500/20 border-yellow-500';
    return 'text-red-400 bg-red-500/20 border-red-500';
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <User className="text-purple-500" size={36} />
            NBA Player Props Analyzer
          </h1>
          <p className="text-slate-400">AI-powered analysis for player prop bets</p>
        </div>

        {/* Input Form */}
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-slate-300 text-sm font-semibold mb-2">
                Player Name
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="e.g., Luka Doncic"
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>
            
            <div>
              <label className="block text-slate-300 text-sm font-semibold mb-2">
                Player Team
              </label>
              <input
                type="text"
                value={playerTeam}
                onChange={(e) => setPlayerTeam(e.target.value)}
                placeholder="e.g., Mavericks"
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>
            
            <div>
              <label className="block text-slate-300 text-sm font-semibold mb-2">
                Opponent
              </label>
              <input
                type="text"
                value={opponent}
                onChange={(e) => setOpponent(e.target.value)}
                placeholder="e.g., Lakers"
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-slate-300 text-sm font-semibold mb-2">
                Prop Type
              </label>
              <select
                value={propType}
                onChange={(e) => setPropType(e.target.value)}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
              >
                {propTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-slate-300 text-sm font-semibold mb-2">
                Line (O/U)
              </label>
              <input
                type="text"
                value={line}
                onChange={(e) => setLine(e.target.value)}
                placeholder="e.g., 28.5"
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <button
            onClick={analyzeProp}
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Analyzing Prop...
              </>
            ) : (
              <>
                <BarChart3 size={20} />
                Analyze Prop
              </>
            )}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/30 border border-red-500 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="text-red-500" size={24} />
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Analysis Results */}
        {analysis && (
          <div className="space-y-6">
            {/* Recommendation Card */}
            <div className={`border-2 rounded-xl p-6 ${getConfidenceColor(analysis.recommendation.confidence)}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-3xl font-bold">{analysis.recommendation.pick}</h2>
                    <span className="text-lg opacity-75">{line}</span>
                  </div>
                  <p className="text-slate-300 mb-3">{analysis.recommendation.reasoning}</p>
                  {analysis.recommendation.projectedStat && (
                    <div className="inline-block bg-slate-900/50 px-4 py-2 rounded-lg">
                      <span className="text-xs font-semibold opacity-75">PROJECTED: </span>
                      <span className="text-xl font-bold">{analysis.recommendation.projectedStat}</span>
                    </div>
                  )}
                </div>
                <div className="text-right ml-4">
                  <div className="text-xs font-semibold mb-1">CONFIDENCE</div>
                  <div className="text-3xl font-bold">{analysis.recommendation.confidence}</div>
                </div>
              </div>
            </div>

            {/* Player Form & Matchup */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
                <h3 className="text-purple-400 font-bold mb-3 flex items-center gap-2">
                  <TrendingUp size={20} />
                  Player Form
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed">{analysis.playerForm}</p>
              </div>

              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
                <h3 className="text-blue-400 font-bold mb-3 flex items-center gap-2">
                  <BarChart3 size={20} />
                  Matchup Analysis
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed">{analysis.matchupAnalysis}</p>
              </div>
            </div>

            {/* Recent Trends */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
              <h3 className="text-white font-bold mb-3">Recent Trends</h3>
              <p className="text-slate-300 text-sm leading-relaxed">{analysis.trends}</p>
            </div>

            {/* Key Factors */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
              <h3 className="text-white font-bold mb-3">Key Factors to Consider</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {analysis.keyFactors.map((factor, idx) => (
                  <div key={idx} className="flex items-start gap-2 bg-slate-700/30 p-3 rounded-lg">
                    <span className="text-purple-500 mt-1">•</span>
                    <span className="text-slate-300 text-sm">{factor}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Disclaimer */}
            <div className="bg-orange-900/20 border border-orange-500/50 rounded-lg p-4">
              <p className="text-orange-200 text-xs">
                ⚠️ <strong>Disclaimer:</strong> This analysis is for entertainment purposes only. Sports betting involves risk. Please gamble responsibly.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Main App Component
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
    const response = await fetch('http://localhost:8000/league-leaders');
    const data = await response.json();
    setLeaderboards(data);
  };

  const fetchStandings = async () => {
    if (standingsData.east && standingsData.west) {
      return;
    }

    setStandingsData({ east: "Loading East...", west: "Loading West..." });

    try {
      const response = await fetch('http://localhost:8000/standings');
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
      const response = await fetch('http://localhost:8000/chat', {
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
            to="/player-props" 
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