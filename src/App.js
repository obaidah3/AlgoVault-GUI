import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight, Settings, BarChart3, Target } from 'lucide-react';

const RobotHallwayMDP = () => {
  const [robotPosition, setRobotPosition] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [history, setHistory] = useState([]);
  const [stepCount, setStepCount] = useState(0);
  const [totalReward, setTotalReward] = useState(0);
  const [values, setValues] = useState({ 0: 0, 1: 0, 2: 0, 3: 0 });
  const [policy, setPolicy] = useState({ 0: 'RIGHT', 1: 'RIGHT', 2: 'RIGHT', 3: 'TERMINAL' });
  const [isComputed, setIsComputed] = useState(false);
  const [gamma, setGamma] = useState(0.9);
  const [speed, setSpeed] = useState(800);
  const [showSettings, setShowSettings] = useState(false);
  const [algorithm, setAlgorithm] = useState('value');
  const [iterations, setIterations] = useState(0);
  const [qValues, setQValues] = useState({ 
    0: {}, 1: {}, 2: {}, 3: {} 
  });
  const [convergenceTime, setConvergenceTime] = useState(0);
  const [scenario, setScenario] = useState('goal-right');

  const states = [0, 1, 2, 3];
  const actions = ['LEFT', 'RIGHT'];

  // Scenarios with different configurations
  const scenarios = {
    'goal-right': {
      name: 'Goal on Right',
      description: 'Charging station at position 3',
      goalState: 3,
      rewards: { 3: 10 },
      hazards: {},
      icon: '⚡'
    },
    'goal-left': {
      name: 'Goal on Left',
      description: 'Charging station at position 0',
      goalState: 0,
      rewards: { 0: 10 },
      hazards: {},
      icon: '⚡'
    },
    'middle-treasure': {
      name: 'Middle Treasure',
      description: 'Treasure at position 1, goal at position 3',
      goalState: 3,
      rewards: { 1: 5, 3: 10 },
      hazards: {},
      icon: '💎'
    },
    'avoid-hazard': {
      name: 'Avoid Hazard',
      description: 'Hazard at position 2, goal at position 3',
      goalState: 3,
      rewards: { 3: 10 },
      hazards: { 2: -8 },
      icon: '☠️'
    },
    'two-goals': {
      name: 'Two Goals',
      description: 'Small reward at 0 (+3), big reward at 3 (+10)',
      goalState: 3,
      rewards: { 0: 3, 3: 10 },
      hazards: {},
      icon: '🎯'
    },
    'expensive-path': {
      name: 'Expensive Path',
      description: 'High cost through position 2 (-5)',
      goalState: 3,
      rewards: { 3: 10 },
      hazards: { 2: -5 },
      icon: '💰'
    }
  };

  const currentScenario = scenarios[scenario];

  const transition = (state, action) => {
    if (state === currentScenario.goalState) return [[state, 1.0]];
    
    let intended;
    if (action === 'RIGHT') {
      intended = Math.min(state + 1, 3);
    } else {
      intended = Math.max(state - 1, 0);
    }
    
    return [[intended, 0.8], [state, 0.2]];
  };

  const reward = (_state, _action, nextState) => {
    // Check if reached goal
    if (nextState === currentScenario.goalState) {
      return currentScenario.rewards[nextState] || 10;
    }
    
    // Check for other rewards
    if (currentScenario.rewards[nextState]) {
      return currentScenario.rewards[nextState];
    }
    
    // Check for hazards
    if (currentScenario.hazards[nextState]) {
      return currentScenario.hazards[nextState];
    }
    
    // Default step cost
    return -1;
  };

  const valueIteration = () => {
    const startTime = performance.now();
    const V = { 0: 0, 1: 0, 2: 0, 3: 0 };
    const Q = {
      0: {}, 1: {}, 2: {}, 3: {}
    };
    const theta = 0.0001;
    let iter = 0;
    
    // Initialize Q-values
    for (const s of states) {
      Q[s] = {};
      for (const a of actions) {
        Q[s][a] = 0;
      }
    }
    
    while (true) {
      let delta = 0;
      iter++;
      
      for (const s of states) {
        if (s === currentScenario.goalState) continue;
        
        const actionValues = [];
        for (const a of actions) {
          let total = 0;
          for (const [nextS, prob] of transition(s, a)) {
            const r = reward(s, a, nextS);
            total += prob * (r + gamma * V[nextS]);
          }
          Q[s][a] = total;
          actionValues.push(total);
        }
        
        const bestValue = Math.max(...actionValues);
        delta = Math.max(delta, Math.abs(V[s] - bestValue));
        V[s] = bestValue;
      }
      
      if (delta < theta) break;
      if (iter > 1000) break;
    }
    
    const endTime = performance.now();
    setConvergenceTime(parseFloat((endTime - startTime).toFixed(2)));
    setIterations(iter);
    
    const pol = { 0: 'RIGHT', 1: 'RIGHT', 2: 'RIGHT', 3: 'TERMINAL' };
    for (const s of states) {
      if (s === currentScenario.goalState) {
        pol[s] = 'TERMINAL';
        continue;
      }
      
      let bestAction = 'RIGHT';
      let bestValue = -Infinity;
      
      for (const a of actions) {
        if (Q[s][a] > bestValue) {
          bestValue = Q[s][a];
          bestAction = a;
        }
      }
      
      pol[s] = bestAction;
    }
    
    setValues(V);
    setQValues(Q);
    setPolicy(pol);
    setIsComputed(true);
  };

  const policyIteration = () => {
    const startTime = performance.now();
    const V = { 0: 0, 1: 0, 2: 0, 3: 0 };
    const pol = { 0: 'RIGHT', 1: 'RIGHT', 2: 'RIGHT', 3: 'TERMINAL' };
    const Q = {
      0: {}, 1: {}, 2: {}, 3: {}
    };
    let iter = 0;
    
    for (const s of states) {
      Q[s] = {};
      for (const a of actions) {
        Q[s][a] = 0;
      }
    }
    
    while (iter < 100) {
      iter++;
      
      const theta = 0.0001;
      while (true) {
        let delta = 0;
        for (const s of states) {
          if (s === currentScenario.goalState) continue;
          const v = V[s];
          const a = pol[s];
          let total = 0;
          for (const [nextS, prob] of transition(s, a)) {
            const r = reward(s, a, nextS);
            total += prob * (r + gamma * V[nextS]);
          }
          V[s] = total;
          delta = Math.max(delta, Math.abs(v - V[s]));
        }
        if (delta < theta) break;
      }
      
      let policyStable = true;
      for (const s of states) {
        if (s === currentScenario.goalState) continue;
        const oldAction = pol[s];
        let bestAction = 'RIGHT';
        let bestValue = -Infinity;
        
        for (const a of actions) {
          let total = 0;
          for (const [nextS, prob] of transition(s, a)) {
            const r = reward(s, a, nextS);
            total += prob * (r + gamma * V[nextS]);
          }
          Q[s][a] = total;
          if (total > bestValue) {
            bestValue = total;
            bestAction = a;
          }
        }
        
        pol[s] = bestAction;
        if (oldAction !== bestAction) policyStable = false;
      }
      
      if (policyStable) break;
    }
    
    const endTime = performance.now();
    setConvergenceTime(parseFloat((endTime - startTime).toFixed(2)));
    setIterations(iter);
    setValues(V);
    setQValues(Q);
    setPolicy(pol);
    setIsComputed(true);
  };

  useEffect(() => {
    if (algorithm === 'value') {
      valueIteration();
    } else {
      policyIteration();
    }
  }, [gamma, algorithm, scenario]);

  useEffect(() => {
    reset(0);
  }, [scenario]);

  const simulateStep = () => {
    if (robotPosition === currentScenario.goalState) {
      setIsRunning(false);
      return;
    }

    const action = policy[robotPosition];
    const transitions = transition(robotPosition, action);
    
    const rand = Math.random();
    let cumProb = 0;
    let nextState = robotPosition;
    
    for (const [ns, prob] of transitions) {
      cumProb += prob;
      if (rand <= cumProb) {
        nextState = ns;
        break;
      }
    }

    const r = reward(robotPosition, action, nextState);
    
    setHistory(prev => [...prev, {
      step: stepCount,
      from: robotPosition,
      action: action,
      to: nextState,
      reward: r,
      wasMoved: nextState !== robotPosition
    }]);
    
    setRobotPosition(nextState);
    setStepCount(prev => prev + 1);
    setTotalReward(prev => prev + r);
  };

  useEffect(() => {
    if (isRunning && robotPosition !== currentScenario.goalState) {
      const timer = setTimeout(simulateStep, speed);
      return () => clearTimeout(timer);
    } else if (robotPosition === currentScenario.goalState) {
      setIsRunning(false);
    }
  }, [isRunning, robotPosition, stepCount, speed]);

  const reset = (startPos) => {
    setRobotPosition(startPos);
    setIsRunning(false);
    setHistory([]);
    setStepCount(0);
    setTotalReward(0);
  };

  const toggleRunning = () => {
    if (robotPosition === currentScenario.goalState) return;
    setIsRunning(!isRunning);
  };

  const stats = history.reduce((acc, h) => {
    if (!h.wasMoved) acc.stuckCount++;
    return acc;
  }, { stuckCount: 0 });

  const getCellColor = (s) => {
    if (s === currentScenario.goalState) {
      return 'bg-gradient-to-br from-green-500/20 to-emerald-600/20 border-green-400 shadow-green-500/50 shadow-lg';
    }
    if (currentScenario.hazards[s]) {
      return 'bg-gradient-to-br from-red-500/20 to-red-600/20 border-red-400 shadow-red-500/50 shadow-lg';
    }
    if (currentScenario.rewards[s] && s !== currentScenario.goalState) {
      return 'bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border-yellow-400 shadow-yellow-500/50 shadow-lg';
    }
    return 'bg-slate-700/50 border-slate-600';
  };

  const getCellIcon = (s) => {
    if (robotPosition === s) return '🤖';
    if (s === currentScenario.goalState) return currentScenario.icon;
    if (currentScenario.hazards[s]) return '☠️';
    if (currentScenario.rewards[s]) return '💎';
    return '📍';
  };

  const getCellLabel = (s) => {
    if (s === currentScenario.goalState) {
      return <span className="text-green-400 text-sm font-semibold flex items-center gap-1">
        <Target size={14} /> Goal {currentScenario.rewards[s] > 0 ? `+${currentScenario.rewards[s]}` : '+10'}
      </span>;
    }
    if (currentScenario.hazards[s]) {
      return <span className="text-red-400 text-sm font-semibold">
        Hazard {currentScenario.hazards[s]}
      </span>;
    }
    if (currentScenario.rewards[s]) {
      return <span className="text-yellow-400 text-sm font-semibold">
        Reward +{currentScenario.rewards[s]}
      </span>;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-slate-800/50 backdrop-blur rounded-2xl shadow-2xl p-8 border border-slate-700">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-white mb-3 flex items-center justify-center gap-3">
              <span className="text-4xl">🤖</span>
              Adaptive Robot MDP
              <span className="text-4xl">{currentScenario.icon}</span>
            </h1>
            <p className="text-slate-300 text-lg mb-2">
              {currentScenario.description}
            </p>
            <div className="flex gap-2 justify-center mt-4 text-sm flex-wrap">
              <span className="px-3 py-1 bg-blue-600/30 text-blue-300 rounded-full border border-blue-500/50">
                Discount γ = {gamma}
              </span>
              <span className="px-3 py-1 bg-purple-600/30 text-purple-300 rounded-full border border-purple-500/50">
                {iterations} iterations
              </span>
              <span className="px-3 py-1 bg-green-600/30 text-green-300 rounded-full border border-green-500/50">
                {convergenceTime}ms
              </span>
            </div>
          </div>

          {/* Scenario Selector */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Target size={24} />
              Select Scenario
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {Object.entries(scenarios).map(([key, scen]) => (
                <button
                  key={key}
                  onClick={() => setScenario(key)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    scenario === key
                      ? 'bg-blue-600/30 border-blue-400 shadow-lg shadow-blue-500/30'
                      : 'bg-slate-700/30 border-slate-600 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{scen.icon}</span>
                    <span className="text-white font-semibold">{scen.name}</span>
                  </div>
                  <p className="text-slate-300 text-sm">{scen.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Settings Toggle */}
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              <Settings size={18} />
              {showSettings ? 'Hide' : 'Show'} Settings
            </button>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="mb-8 bg-slate-700/50 rounded-xl p-6 border border-slate-600">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Settings size={20} />
                Configuration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-slate-300 text-sm mb-2 block">
                    Discount Factor (γ): {gamma}
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="0.99"
                    step="0.01"
                    value={gamma}
                    onChange={(e) => setGamma(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-slate-300 text-sm mb-2 block">
                    Animation Speed: {speed}ms
                  </label>
                  <input
                    type="range"
                    min="200"
                    max="2000"
                    step="100"
                    value={speed}
                    onChange={(e) => setSpeed(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-slate-300 text-sm mb-2 block">
                    Algorithm
                  </label>
                  <select
                    value={algorithm}
                    onChange={(e) => setAlgorithm(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-600 text-white rounded-lg border border-slate-500"
                  >
                    <option value="value">Value Iteration</option>
                    <option value="policy">Policy Iteration</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Hallway Visualization */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart3 size={24} />
              Environment
            </h2>
            <div className="flex gap-3 justify-center">
              {states.map(s => (
                <div
                  key={s}
                  className={`relative w-40 h-40 rounded-xl border-4 flex flex-col items-center justify-center transition-all duration-500 ${getCellColor(s)} ${
                    robotPosition === s ? 'ring-4 ring-blue-400 scale-110 shadow-blue-500/50 shadow-xl' : ''
                  }`}
                >
                  <div className="text-5xl mb-2 transition-transform duration-300">
                    {getCellIcon(s)}
                  </div>
                  <div className="text-white font-bold text-xl mb-1">
                    Position {s}
                  </div>
                  {getCellLabel(s)}
                  {s !== currentScenario.goalState && isComputed && (
                    <div className="text-blue-400 text-sm mt-1">
                      V = {values[s]?.toFixed(2)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-3 justify-center mb-8">
            <button
              onClick={toggleRunning}
              disabled={robotPosition === currentScenario.goalState}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-slate-600 disabled:to-slate-700 text-white rounded-lg font-semibold transition-all shadow-lg disabled:shadow-none"
            >
              {isRunning ? <Pause size={20} /> : <Play size={20} />}
              {isRunning ? 'Pause' : 'Start'}
            </button>
            <button
              onClick={() => reset(0)}
              className="flex items-center gap-2 px-5 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-semibold transition-colors"
            >
              <RotateCcw size={18} />
              Start: 0
            </button>
            <button
              onClick={() => reset(1)}
              className="flex items-center gap-2 px-5 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-semibold transition-colors"
            >
              <RotateCcw size={18} />
              Start: 1
            </button>
            <button
              onClick={() => reset(2)}
              className="flex items-center gap-2 px-5 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-semibold transition-colors"
            >
              <RotateCcw size={18} />
              Start: 2
            </button>
          </div>

          {/* Enhanced Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-600/20 to-blue-700/20 rounded-lg p-4 border border-blue-500/50">
              <div className="text-blue-300 text-sm mb-1 font-semibold">Steps Taken</div>
              <div className="text-white text-3xl font-bold">{stepCount}</div>
            </div>
            <div className="bg-gradient-to-br from-purple-600/20 to-purple-700/20 rounded-lg p-4 border border-purple-500/50">
              <div className="text-purple-300 text-sm mb-1 font-semibold">Total Reward</div>
              <div className={`text-3xl font-bold ${totalReward >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {totalReward > 0 ? '+' : ''}{totalReward}
              </div>
            </div>
            <div className="bg-gradient-to-br from-amber-600/20 to-amber-700/20 rounded-lg p-4 border border-amber-500/50">
              <div className="text-amber-300 text-sm mb-1 font-semibold">Got Stuck</div>
              <div className="text-white text-3xl font-bold">{stats.stuckCount}×</div>
            </div>
            <div className="bg-gradient-to-br from-green-600/20 to-green-700/20 rounded-lg p-4 border border-green-500/50">
              <div className="text-green-300 text-sm mb-1 font-semibold">Status</div>
              <div className="text-white text-2xl font-bold">
                {robotPosition === currentScenario.goalState ? '✓ Done' : isRunning ? '▶ Run' : '⏸ Stop'}
              </div>
            </div>
          </div>

          {/* Optimal Policy Display */}
          {isComputed && (
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Optimal Policy π*(s)</h2>
              <div className="flex gap-4 justify-center">
                {states.map(s => (
                  <div key={s} className={`rounded-lg p-5 border-2 ${
                    s === currentScenario.goalState ? 'bg-green-600/20 border-green-500' : 'bg-blue-600/20 border-blue-500'
                  }`}>
                    <div className="text-slate-300 text-sm mb-2">State {s}</div>
                    <div className="text-white font-bold text-2xl flex items-center gap-1">
                      {policy[s] === 'LEFT' && <><ChevronLeft size={24} /> LEFT</>}
                      {policy[s] === 'RIGHT' && <><ChevronRight size={24} /> RIGHT</>}
                      {policy[s] === 'TERMINAL' && <>🎯 GOAL</>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Q-Values Table */}
          {isComputed && (
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Q-Values (State-Action Values)</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {states.map(s => (
                  <div key={s} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                    <div className="text-slate-300 font-bold text-lg mb-3">State {s}</div>
                    {s !== currentScenario.goalState ? (
                      <div className="space-y-2">
                        {actions.map(a => (
                          <div key={a} className={`flex justify-between items-center p-2 rounded ${
                            policy[s] === a ? 'bg-blue-600/30 border border-blue-500/50' : 'bg-slate-600/30'
                          }`}>
                            <span className="text-sm text-slate-300 flex items-center gap-1">
                              {a === 'LEFT' ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                              {a}
                              {policy[s] === a && <span className="text-xs">★</span>}
                            </span>
                            <span className="text-white font-mono text-sm">
                              {qValues[s]?.[a]?.toFixed(2) || '0.00'}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-green-400 text-sm">Terminal State</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* History Log */}
          {history.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold text-white mb-4">Movement History</h2>
              <div className="bg-slate-700/30 rounded-lg p-4 max-h-80 overflow-y-auto border border-slate-600">
                {history.map((entry, idx) => (
                  <div key={idx} className={`py-3 px-4 mb-2 rounded-lg ${
                    entry.wasMoved ? 'bg-blue-600/10 border-l-4 border-blue-500' : 'bg-red-600/10 border-l-4 border-red-500'
                  }`}>
                    <div className="flex items-center justify-between text-slate-200">
                      <span>
                        <span className="text-slate-400 font-semibold">Step {entry.step + 1}:</span>{' '}
                        Pos {entry.from} →{' '}
                        <span className="text-blue-400 font-semibold">{entry.action}</span>
                        {' '}→ Pos {entry.to}
                      </span>
                      <span className="flex items-center gap-3">
                        {!entry.wasMoved && <span className="text-red-400 text-xs">⚠ Stuck</span>}
                        <span className={`font-bold ${entry.reward > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {entry.reward > 0 ? '+' : ''}{entry.reward}
                        </span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RobotHallwayMDP;