import React, { useState } from 'react';
import { User, DollarSign, AlertCircle, Loader2, BarChart3, TrendingUp } from 'lucide-react';

export default function PlayerPropsAnalyzer() {
  const [playerName, setPlayerName] = useState('');
  const [propType, setPropType] = useState('points');
  const [line, setLine] = useState('');
  const [opponent, setOpponent] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);

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
    if (!playerName || !line || !opponent) {
      setError('Please fill in player name, prop line, and opponent');
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const propLabel = propTypes.find(p => p.value === propType)?.label || propType;
      
      // Call your backend API endpoint
      const response = await fetch('http://localhost:8000/player_props', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerName,
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
}