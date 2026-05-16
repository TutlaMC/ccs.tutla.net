import './App.css'
import CCSFlowWrapper from './components/CCSFlowWrapper'
import CCSTextEditor from './components/CCSTextEditor';
import OnboardingOverlay from './components/OnboardingOverlay';

import { useState, useEffect } from 'react';

const ONBOARDING_KEY = 'ccs-onboarding-done';

const DEFAULT_CODE = `// @anonymous
def module custom-module
def desc "Custom Scripted Module"

on module_enable {
  send "Module enabled!"
}

on module_disable {
  send "Module disabled!"
}
`;

type View = 'nodes' | 'text';

export default function App() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [view, setView] = useState<View>('nodes');
  const [showOnboarding, setShowOnboarding] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem(ONBOARDING_KEY)) {
      setShowOnboarding(true);
    }
  }, []);

  const dismissOnboarding = () => {
    localStorage.setItem(ONBOARDING_KEY, '1');
    setShowOnboarding(false);
  };

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-[#0a0a14] font-mono">

      <header className="flex items-center justify-between px-4 h-11 border-b border-white/5 shrink-0 bg-[#080810]">
        <div className="flex items-center gap-3">
          <span className="text-[#ac8929] text-base">◈</span>
          <span className="text-white/70 text-xs tracking-widest uppercase">CCS Editor</span>
        </div>

        <div className="flex items-center gap-1 bg-[#0d0d1a] border border-white/8 rounded-md p-0.5">
          <button
            onClick={() => setView('nodes')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs transition-all duration-150 ${
              view === 'nodes'
                ? 'bg-[#ac8929] text-black font-bold'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor">
              <circle cx="2" cy="6" r="1.5"/>
              <circle cx="10" cy="2" r="1.5"/>
              <circle cx="10" cy="10" r="1.5"/>
              <line x1="3.4" y1="5.3" x2="8.6" y2="2.7" stroke="currentColor" strokeWidth="1"/>
              <line x1="3.4" y1="6.7" x2="8.6" y2="9.3" stroke="currentColor" strokeWidth="1"/>
            </svg>
            Nodes
          </button>
          <button
            onClick={() => setView('text')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs transition-all duration-150 ${
              view === 'text'
                ? 'bg-[#ac8929] text-black font-bold'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor">
              <rect x="1" y="2" width="10" height="1.2" rx="0.6"/>
              <rect x="1" y="5.4" width="7" height="1.2" rx="0.6"/>
              <rect x="1" y="8.8" width="8.5" height="1.2" rx="0.6"/>
            </svg>
            Text
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowOnboarding(true)}
            className="text-white/20 hover:text-white/50 text-xs px-2 py-1 rounded border border-white/8 hover:border-white/20 transition-all"
            title="Show guide"
          >
            ?
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <div className={`h-full ${view === 'nodes' ? 'block' : 'hidden'}`}>
          <CCSFlowWrapper code={code} onCodeChange={setCode} />
        </div>
        <div className={`h-full ${view === 'text' ? 'block' : 'hidden'}`}>
          <CCSTextEditor code={code} onChange={setCode} />
        </div>
      </main>

      {showOnboarding && <OnboardingOverlay onDismiss={dismissOnboarding} />}
    </div>
  );
}
