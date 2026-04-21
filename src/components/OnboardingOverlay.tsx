'use client';

import { useState } from 'react';
import { tokenizeLine } from './CCSTextEditor';
import { GitBranch, HandCoins } from 'lucide-react';

interface Step {
  icon: string;
  title: string;
  body: string;
  code?: string;
  gif?: string;
}

const STEPS: Step[] = [
  {
    icon: '◈',
    title: "Welcome to the Tutla's CCS Editor",
    body: 'ClickCrystals Script lets you build powerful in-game modules without having to learn goofy ass java. Automate anything within this editor.',
    code: `// @yourname
def module my-module
def desc "My first module"`,
  },
  {
    icon: '⬡',
    title: 'Node View',
    body: 'The right panel is a visual node graph. Each line of your script becomes a connected node. Drag nodes from the palette on the left, connect handles, and the code writes itself (you can copy it  from the Text panel).',
    gif:"connect.gif",
  },
  {
    icon: '⟡',
    title: 'Connecting Multiple Nodes',
    body: 'To chain multiple actions or conditions, connect them all to the same parent node. This builds a sequence — each node runs in order.',
    gif: "multiple.gif",
    },
    {
    icon: '⟁',
    title: 'Connect correctly!',
    body: 'Not all handles are compatible. Connections must follow the script syntax for example, events should connect into the module node. If a connection doesn’t work, it does not match syntax',
    gif: "incompatible.gif",
    },
  {
    icon: '⬢',
    title: 'Deleting Nodes',
    body: "Click on a node, and press delete (on your keyboard). That's it!",
    gif: "delete.gif"
  },
  {
    icon: '⌥',
    title: 'Text View',
    body: 'Switch to Text View for raw script editing with syntax highlighting. Both views stay in sync; edit one and the other updates instantly (WIP).',
    code: `on right_click if holding #sword {
  turn_to nearest_entity :player then {
    if attack_progress >=0.9 input attack
  }
}`,
  },
];

interface Props {
  onDismiss: () => void;
}

export default function OnboardingOverlay({ onDismiss }: Props) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl mx-4">

        <div className="absolute -inset-px rounded-xl bg-gradient-to-br from-[#ac8929]/40 via-transparent to-[#5b8dd9]/20 pointer-events-none" />

        <div className="relative bg-[#0a0a14] rounded-xl border border-[#ac8929]/30 overflow-hidden">

          <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === step
                      ? 'w-6 bg-[#ac8929]'
                      : i < step
                      ? 'w-3 bg-[#ac8929]/40'
                      : 'w-3 bg-white/10'
                  }`}
                />
              ))}
            </div>
            <span className="font-mono text-[10px] text-white/20 tracking-widest uppercase">
              {step + 1} / {STEPS.length}
            </span>
          </div>

          <div className="px-6 pt-6 pb-2">
            <div className="flex items-start gap-4">
              <div className="text-3xl text-[#ac8929] mt-0.5 w-8 shrink-0 font-light">
                {current.icon}
              </div>
              <div>
                <h2 className="text-white font-bold text-xl mb-2 tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
                  {current.title}
                </h2>
                <p className="text-white/50 text-sm leading-relaxed font-mono">
                  {current.body}
                </p>
              </div>
            </div>
          </div>

          {current.code && (
            <div className="mx-6 my-4 rounded-lg border border-white/5 bg-[#060610] overflow-hidden">
              <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/5">
                <div className="w-2 h-2 rounded-full bg-[#ac8929]/60" />
                <div className="w-2 h-2 rounded-full bg-white/10" />
                <div className="w-2 h-2 rounded-full bg-white/10" />
                <span className="ml-2 font-mono text-[10px] text-white/20 tracking-widest">example.ccs</span>
              </div>
              <pre className="px-4 py-3 text-xs font-mono leading-relaxed overflow-x-auto">
                <CCSHighlight code={current.code} />
              </pre>
            </div>
          )}
          {current.gif && (
            <div className="mx-6 my-4 rounded-lg border border-white/5 bg-[#060610] overflow-hidden">
              <img src={current.gif} />
            </div>
          )}

          <div className="flex items-center justify-between px-6 py-4 border-t border-white/5">
            <button
              onClick={onDismiss}
              className="font-mono text-xs text-white/20 hover:text-white/40 transition-colors tracking-wider uppercase"
            >
              Skip
            </button>
            <div className="flex gap-2">
              {step > 0 && (
                <button
                  onClick={() => setStep(s => s - 1)}
                  className="font-mono text-xs px-4 py-2 rounded border border-white/10 text-white/40 hover:text-white/70 hover:border-white/20 transition-all"
                >
                  Back
                </button>
              )}
              {isLast ? <>
                <button
                    onClick={() => window.open('https://donatr.ee/tutlamc?utm_source=copy&utm_medium=share', '_blank')}
                    className="font-mono text-xs px-5 py-2 rounded bg-[#111120] hover:bg-[#1a1a2e] text-[#ac8929] border border-[#ac892930] hover:border-[#ac8929] transition-all tracking-wider flex items-center gap-2"
                    >
                    <HandCoins size={14} strokeWidth={2} />
                    Donate
                </button>
                <button
                    onClick={() => window.open('https://github.com/TutlaMC/ccs.tutla.net', '_blank')}
                    className="font-mono text-xs px-5 py-2 rounded bg-[#111120] hover:bg-[#1a1a2e] text-[#ac8929] border border-[#ac892930] hover:border-[#ac8929] transition-all tracking-wider flex items-center gap-2"
                    >
                    <GitBranch size={14} strokeWidth={2} />
                    Check GitHub
                </button>
                
              </> : <></>}
              <button
                onClick={() => isLast ? onDismiss() : setStep(s => s + 1)}
                className="font-mono text-xs px-5 py-2 rounded bg-[#ac8929] hover:bg-[#c9a030] text-black font-bold transition-all tracking-wider"
              >
                {isLast ? 'Start Editing →' : 'Next →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CCSHighlight({ code }: { code: string }) {
  const lines = code.split('\n');
  return (
    <>
      {lines.map((line, i) => (
        <div key={i}>
          {tokenizeLine(line)}
        </div>
      ))}
    </>
  );
}

