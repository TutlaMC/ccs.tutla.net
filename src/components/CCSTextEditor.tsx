'use client';

import { useRef, useCallback } from 'react';

interface Props {
  code: string;
  onChange: (code: string) => void;
}

function tokenizeLine(line: string): React.ReactNode {
  const tokens: React.ReactNode[] = [];
  let remaining = line;
  let key = 0;

  if (remaining.length === 0) {
    return <span key={key++}>{'\u00A0'}</span>;
  }

  while (remaining.length > 0) {
    const commentMatch = remaining.match(/^(\/\/.*)/);
    if (commentMatch) {
      tokens.push(<span key={key++} style={{ color: '#4a4a6a', fontStyle: 'italic' }}>{commentMatch[1]}</span>);
      break;
    }

    const stringMatch = remaining.match(/^("[^"]*")/);
    if (stringMatch) {
      tokens.push(<span key={key++} style={{ color: '#6db36d' }}>{stringMatch[1]}</span>);
      remaining = remaining.slice(stringMatch[1].length);
      continue;
    }

    const numMatch = remaining.match(/^([+\-<>=!]+[0-9]*\.?[0-9]+)/);
    if (numMatch) {
      tokens.push(<span key={key++} style={{ color: '#5b8dd9' }}>{numMatch[1]}</span>);
      remaining = remaining.slice(numMatch[1].length);
      continue;
    }

    const opMatch = remaining.match(/^([><=!]+)/);
    if (opMatch) {
      tokens.push(<span key={key++} style={{ color: '#5b8dd9' }}>{opMatch[1]}</span>);
      remaining = remaining.slice(opMatch[1].length);
      continue;
    }

    const kwMatch = remaining.match(/^(def|on|if_not|if|while_not|while|loop_period|loop|execute_random|execute_period|execute|wait_random|wait|as|func|function|!if|!while)(?=\s|$|{)/);
    if (kwMatch) {
      tokens.push(<span key={key++} style={{ color: '#9d6fd4', fontWeight: 600 }}>{kwMatch[1]}</span>);
      remaining = remaining.slice(kwMatch[1].length);
      continue;
    }

    const cmdMatch = remaining.match(/^(module|desc|description|send|say|notify|input|switch|damage|turn_to|snap_to|playsound|config|drop|swap|teleport|velocity|hold_input|print|throw|exit|gui_drop|gui_switch|gui_swap|gui_quickmove|cancel_packet|uncancel_packet)(?=\s|$)/);
    if (cmdMatch) {
      tokens.push(<span key={key++} style={{ color: '#ac8929' }}>{cmdMatch[1]}</span>);
      remaining = remaining.slice(cmdMatch[1].length);
      continue;
    }

    const condMatch = remaining.match(/^(holding|off_holding|inventory_has|hotbar_has|target_block|target_entity|targeting_entity|targeting_block|input_active|block_in_range|entity_in_range|attack_progress|health|armor|hunger|pos_x|pos_y|pos_z|module_enabled|module_disabled|block|entity|dimension|effect_duration|effect_amplifier|in_game|playing|in_singleplayer|chance_of|on_ground|on_fire|frozen|blocking|moving|jumping|dead|colliding_horizontally|colliding_vertically|colliding|has_equipment|hurt_time|cursor_item|hovering_over|reference_entity|item_count|item_durability)(?=\s|$)/);
    if (condMatch) {
      tokens.push(<span key={key++} style={{ color: '#3bb8a0' }}>{condMatch[1]}</span>);
      remaining = remaining.slice(condMatch[1].length);
      continue;
    }

    const idMatch = remaining.match(/^([:#][a-zA-Z0-9_./,]+)/);
    if (idMatch) {
      tokens.push(<span key={key++} style={{ color: '#d4a45b' }}>{idMatch[1]}</span>);
      remaining = remaining.slice(idMatch[1].length);
      continue;
    }

    const bracketMatch = remaining.match(/^([{}])/);
    if (bracketMatch) {
      tokens.push(<span key={key++} style={{ color: '#555577' }}>{bracketMatch[1]}</span>);
      remaining = remaining.slice(1);
      continue;
    }

    const wordMatch = remaining.match(/^([a-zA-Z0-9_@\-]+)/);
    if (wordMatch) {
      tokens.push(<span key={key++} style={{ color: '#9090b0' }}>{wordMatch[1]}</span>);
      remaining = remaining.slice(wordMatch[1].length);
      continue;
    }

    tokens.push(<span key={key++} style={{ color: '#555577' }}>{remaining[0]}</span>);
    remaining = remaining.slice(1);
  }

  return <>{tokens}</>;
}

export default function CCSTextEditor({ code, onChange }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lines = code.split('\n');

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const ta = e.currentTarget;
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newVal = code.slice(0, start) + '  ' + code.slice(end);
      onChange(newVal);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2;
      });
    }
  }, [code, onChange]);

  const sharedStyle: React.CSSProperties = {
    fontFamily: '"JetBrains Mono", "Fira Mono", "Cascadia Code", monospace',
    fontSize: 13,
    lineHeight: '1.6',
    letterSpacing: '0.01em',
    padding: '16px 16px 16px 0',
    margin: 0,
    border: 'none',
    outline: 'none',
    whiteSpace: 'pre',
    overflowWrap: 'normal',
    wordBreak: 'normal',
    tabSize: 2,
  };

  return (
    <div className="flex h-full bg-[#060610] overflow-hidden">
      <div
        className="select-none shrink-0 text-right border-r border-white/5"
        style={{
          ...sharedStyle,
          padding: '16px 12px',
          color: '#2a2a4a',
          background: '#060610',
          minWidth: 48,
          overflowY: 'hidden',
        }}
      >
        {lines.map((_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
      </div>

      <div className="relative flex-1 overflow-auto">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            ...sharedStyle,
            padding: '16px 16px',
            color: 'transparent',
            background: 'transparent',
            overflow: 'hidden',
          }}
        >
          {lines.map((line, i) => (
            <div key={i} style={{ minHeight: '1.6em' }}>
              {tokenizeLine(line)}
            </div>
          ))}
        </div>

        <textarea
          ref={textareaRef}
          value={code}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          className="absolute inset-0 w-full h-full resize-none bg-transparent caret-[#ac8929] selection:bg-[#ac8929]/25"
          style={{
            ...sharedStyle,
            padding: '16px 16px',
            color: 'transparent',
            caretColor: '#ac8929',
            minHeight: '100%',
            minWidth: '100%',
          }}
        />
      </div>
    </div>
  );
}