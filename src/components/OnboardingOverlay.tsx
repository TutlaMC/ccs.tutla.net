'use client';

import { useState } from 'react';

interface Step {
  icon: string;
  title: string;
  body: string;
  code?: string;
}

const STEPS: Step[] = [
  {
    icon: '◈',
    title: 'Welcome to the CCS Editor',
    body: 'ClickCrystals Script lets you build powerful in-game modules without compiling. Define modules, listen to events, and automate anything — all from this editor.',
    code: `// @yourname
def module my-module
def desc "My first module"`,
  },
  {
    icon: '⬡',
    title: 'Node View',
    body: 'The right panel is a visual node graph. Each line of your script becomes a connected node. Drag nodes from the palette on the left, connect handles, and the code writes itself.',
    code: `on module_enable {
  send "Module is on!"
}`,
  },
  {
    icon: '⌥',
    title: 'Text View',
    body: 'Switch to Text View for raw script editing with syntax highlighting. Both views stay in sync — edit in one and the other updates instantly.',
    code: `on right_click if holding #sword {
  turn_to nearest_entity :player then {
    if attack_progress >=0.9 input attack
  }
}`,
  },
  {
    icon: '⬢',
    title: 'Conditions & Flow',
    body: 'Use if, while, and condition nodes to build logic. Connect a condition node\'s teal handle into any if or while node. Handles enforce types — wrong connections are blocked.',
    code: `on tick if playing {
  if health <=5.0 {
    notify 3 "Low health!"
    playsound #block.note_block.bass 1 0.5
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

function tokenizeLine(line: string): React.ReactNode {
  const tokens: React.ReactNode[] = [];
  let remaining = line;
  let key = 0;

  while (remaining.length > 0) {
    const commentMatch = remaining.match(/^(\/\/.*)/);
    if (commentMatch) {
      tokens.push(<span key={key++} className="text-white/25 italic">{commentMatch[1]}</span>);
      break;
    }

    const stringMatch = remaining.match(/^("[^"]*")/);
    if (stringMatch) {
      tokens.push(<span key={key++} className="text-[#6db36d]">{stringMatch[1]}</span>);
      remaining = remaining.slice(stringMatch[1].length);
      continue;
    }

    const numMatch = remaining.match(/^([+\-<>=!]+[0-9]*\.?[0-9]+)/);
    if (numMatch) {
      tokens.push(<span key={key++} className="text-[#5b8dd9]">{numMatch[1]}</span>);
      remaining = remaining.slice(numMatch[1].length);
      continue;
    }

    const kwMatch = remaining.match(/^(def|on|if_not|if|while_not|while|loop_period|loop|execute_random|execute_period|execute|wait_random|wait|as|func|function|!if|!while)\b/);
    if (kwMatch) {
      tokens.push(<span key={key++} className="text-[#9d6fd4] font-semibold">{kwMatch[1]}</span>);
      remaining = remaining.slice(kwMatch[1].length);
      continue;
    }

    const cmdMatch = remaining.match(/^(module|desc|send|say|notify|input|switch|damage|turn_to|snap_to|playsound|config|drop|swap|teleport|velocity|hold_input|print|throw|exit)\b/);
    if (cmdMatch) {
      tokens.push(<span key={key++} className="text-[#ac8929]">{cmdMatch[1]}</span>);
      remaining = remaining.slice(cmdMatch[1].length);
      continue;
    }

    const condMatch = remaining.match(/^(holding|health|attack_progress|playing|in_game|on_ground|moving|jumping|targeting_entity|targeting_block|entity_in_range|block_in_range|module_enabled|module_disabled|inventory_has|hotbar_has|target_block|target_entity|input_active|armor|hunger|pos_x|pos_y|pos_z|dimension|effect_duration|effect_amplifier|in_singleplayer|chance_of|on_fire|frozen|blocking|dead|colliding|has_equipment|hurt_time|cursor_item|hovering_over|reference_entity|item_count|item_durability)\b/);
    if (condMatch) {
      tokens.push(<span key={key++} className="text-[#3bb8a0]">{condMatch[1]}</span>);
      remaining = remaining.slice(condMatch[1].length);
      continue;
    }

    const idMatch = remaining.match(/^([:#][a-zA-Z0-9_./]+)/);
    if (idMatch) {
      tokens.push(<span key={key++} className="text-[#d4a45b]">{idMatch[1]}</span>);
      remaining = remaining.slice(idMatch[1].length);
      continue;
    }

    const bracketMatch = remaining.match(/^([{}])/);
    if (bracketMatch) {
      tokens.push(<span key={key++} className="text-white/30">{bracketMatch[1]}</span>);
      remaining = remaining.slice(1);
      continue;
    }

    tokens.push(<span key={key++} className="text-white/60">{remaining[0]}</span>);
    remaining = remaining.slice(1);
  }

  return <>{tokens}</>;
}