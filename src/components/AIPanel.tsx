'use client';

import { useState, useRef, useCallback } from 'react';
import { NODE_REGISTRY, getNodeDef } from '../lib/ccs-nodes/registry';
import { CCS_EVENTS, CCS_CONDITIONS, CONDITION_ARG_SHAPES } from '../lib/ccs-nodes/types';

type Provider = 'claude' | 'openai' | 'gemini' | 'ollama';

const PROVIDER_DEFAULTS: Record<Provider, { model: string; placeholder: string; label: string }> = {
  claude: { model: 'claude-haiku-4-5-20251001', placeholder: 'sk-ant-...', label: 'Anthropic API Key' },
  openai: { model: 'gpt-4o-mini',               placeholder: 'sk-...',     label: 'OpenAI API Key'   },
  gemini: { model: 'gemini-2.5-flash',           placeholder: 'AIza...',    label: 'Gemini API Key'   },
  ollama: { model: 'llama3.1:8b',                placeholder: 'http://localhost:11434', label: 'Ollama Base URL' },
};

interface Message { role: 'user' | 'assistant'; content: string }

function cmdSyntax(command: string): string {
  const d = NODE_REGISTRY.find(n => n.command === command);
  if (!d) return command;
  const def = getNodeDef(command);
  const data: Record<string, string> = { selectedEvent: 'tick' };
  d.argHints.forEach((h, i) => {
    data[`arg${i + 1}`] = h.startsWith('"') ? h.slice(1, -1) : h;
  });
  return def.toText(data);
}

function condSyntax(cond: string): string {
  const shape = CONDITION_ARG_SHAPES[cond as keyof typeof CONDITION_ARG_SHAPES];
  if (!shape) return cond;
  switch (shape.type) {
    case 'none':      return cond;
    case 'id':        return `${cond} <:exact_id or #partial>`;
    case 'range':     return `${cond} <>=N or <=N or >N or <N or =N>`;
    case 'n':         return `${cond} <N>`;
    case 'id+range':  return `${cond} <:exact_id or #partial> <>=N or <=N ...>`;
    case 'xyz+id':    return `${cond} <~x> <~y> <~z> <:id>`;
    case 'dimension': return `${cond} <overworld or the_nether or the_end>`;
    case 'input':     return `${cond} <attack or use or forward or backward or strafe_left or strafe_right or jump or sprint or sneak or lock_cursor or unlock_cursor or left or right or middle or inventory>`;
    default:          return cond;
  }
}

function buildSystemPrompt(currentCode: string): string {
  const commandLines = NODE_REGISTRY
    .filter(d => d.palette && d.command !== 'def_module' && d.command !== 'condition')
    .map(d => `  ${cmdSyntax(d.command)}`)
    .join('\n');

  const conditionLines = CCS_CONDITIONS
    .map(c => `  ${condSyntax(c)}`)
    .join('\n');

  return `You are a CCS (ClickCrystalsScript) coding assistant for the ClickCrystals Minecraft client mod.

============================
STRICT RULE: You MUST ONLY use the exact commands, events, and conditions listed in this prompt. You MUST NOT invent, guess, or use anything not listed here. If the user asks for something that needs a command, event, or condition not in these lists, tell them it is not supported in CCS.
============================

## SCRIPT STRUCTURE

Every script contains one or more modules. A module starts with a header, then event handlers inside { } blocks.

// @author
def module <module-id>
def desc "<description>"

on <event> {
  <commands>
}

Rules:
- Module IDs use lowercase letters and hyphens only, e.g. my-module
- def desc is optional
- Lines starting with // are comments and are ignored by the runtime
- Blocks open with { and close with }
- Indentation is optional but recommended for readability

## EVENTS

These are the ONLY valid events. No other events exist:

  ${CCS_EVENTS.join('\n  ')}

Special: on key_press and on key_release take one extra argument — the key character.
  on key_press <key>      example: on key_press e
  on key_release <key>    example: on key_release r
All other events take no extra argument.

## COMMANDS

These are the ONLY valid commands. No other commands exist.
Text in < > is a placeholder — replace it with real values. Quoted args need double quotes in real code.

${commandLines}

ID prefixes:
  :item_id   exact match (e.g. :diamond_sword, :player, :stone)
  #partial   partial name match (e.g. #sword matches any sword)

Tilde prefix ~ means relative coordinate (e.g. ~5 means 5 above current Y).

## CONDITIONS

These are the ONLY valid conditions. No other conditions exist.
Use conditions after: if, !if, while, !while

${conditionLines}

Range operators for conditions: >=  <=  >  <  =
  Examples: health >=10   pos_y <=64   attack_progress >=0.9   entity_in_range :player >=5

## CONTROL FLOW

Commands that take a block body use { } syntax:

  if <condition> { ... }                        run body if condition is true
  !if <condition> { ... }                       run body if condition is false
  while <delay_s> <condition> { ... }           loop every delay_s seconds while condition is true
  !while <delay_s> <condition> { ... }          loop every delay_s seconds while condition is false
  loop <n> { ... }                              repeat n times immediately
  loop_period <n> <period_s> { ... }            repeat n times with a delay between each
  execute { ... }                               run the block
  execute_random { ... }                        run one random line from the block
  execute_period <N (seconds)> { ... }          run block with delay between each line
  def func <function-name> { ... }              define a reusable function
  turn_to <target_type> <ID> then { ... }       turn toward target, then run block
  snap_to <target_type> <ID> then { ... }       snap toward target, then run block
  on <event> { ... }                            event handler

Call a defined function with: func <function-name>

## EXAMPLES

Example 1 — greet on server join:
// @player
def module greet-on-join
def desc "Sends a greeting when joining a server"

on game_join {
  wait 2
  say "Hello everyone!"
}

Example 2 — swap totem when health is low:
// @player
def module auto-totem
def desc "Swaps totem to offhand when health drops low"

on tick {
  if health <=6 {
    switch :totem_of_undying
    swap
  }
}

Example 3 — switch to sword if not holding it:
// @player
def module sword-swap
def desc "Switches to diamond sword on left click"

on left_click {
  !if holding :diamond_sword {
    switch :diamond_sword
  }
}

## OUTPUT FORMAT

When writing or modifying a script, output ONLY the complete CCS code inside a code block:
\`\`\`
<code here>
\`\`\`

Do not add explanation inside the code block. Explanation goes outside it.
NEVER use a command, event, or condition not listed above.

## CURRENT SCRIPT

\`\`\`
${currentCode}
\`\`\``;
}

async function callClaude(key: string, model: string, system: string, msgs: Message[]): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
      'content-type': 'application/json',
    },
    body: JSON.stringify({ model, max_tokens: 2048, system, messages: msgs }),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.error?.message ?? `HTTP ${res.status}`); }
  const d = await res.json();
  return d.content?.[0]?.text ?? '';
}

async function callOpenAI(key: string, model: string, system: string, msgs: Message[]): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({ model, messages: [{ role: 'system', content: system }, ...msgs] }),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.error?.message ?? `HTTP ${res.status}`); }
  const d = await res.json();
  return d.choices?.[0]?.message?.content ?? '';
}

async function callGemini(key: string, model: string, system: string, msgs: Message[]): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents: msgs.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
    }),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.error?.message ?? `HTTP ${res.status}`); }
  const d = await res.json();
  return d.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

async function callOllama(base: string, model: string, system: string, msgs: Message[]): Promise<string> {
  const url = `${(base || 'http://localhost:11434').replace(/\/$/, '')}/api/chat`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model, stream: false, messages: [{ role: 'system', content: system }, ...msgs] }),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.error?.message ?? `HTTP ${res.status}`); }
  const d = await res.json();
  return d.message?.content ?? '';
}

function renderMessage(content: string) {
  const parts = content.split(/(```(?:ccs|text|plaintext|)?\n?[\s\S]*?```)/g);
  return parts.map((part, i) => {
    const codeMatch = part.match(/^```(?:ccs|text|plaintext)?\n?([\s\S]*?)```$/);
    if (codeMatch) {
      return (
        <pre key={i} className="bg-[#060610] border border-white/10 rounded p-2 text-[11px] text-[#9090b0] overflow-x-auto whitespace-pre">
          {codeMatch[1]}
        </pre>
      );
    }
    return part ? <span key={i}>{part}</span> : null;
  });
}

function extractCode(content: string): string | null {
  const m = content.match(/```(?:ccs|text|plaintext)?\n?([\s\S]*?)```/);
  return m ? m[1].trim() : null;
}

interface Props {
  code: string;
  onCodeChange: (c: string) => void;
}

export default function AIPanel({ code, onCodeChange }: Props) {
  const [provider, setProvider] = useState<Provider>('claude');
  const [model, setModel] = useState(PROVIDER_DEFAULTS.claude.model);
  const [apiKey, setApiKey] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSettings, setShowSettings] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const handleProviderChange = (p: Provider) => {
    setProvider(p);
    setModel(PROVIDER_DEFAULTS[p].model);
    setApiKey('');
    setError('');
  };

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    if (!apiKey && provider !== 'ollama') { setError('Enter an API key first'); return; }

    const updated: Message[] = [...messages, { role: 'user', content: text }];
    setMessages(updated);
    setInput('');
    setLoading(true);
    setError('');

    const system = buildSystemPrompt(code);

    try {
      let reply = '';
      if (provider === 'claude') reply = await callClaude(apiKey, model, system, updated);
      else if (provider === 'openai') reply = await callOpenAI(apiKey, model, system, updated);
      else if (provider === 'gemini') reply = await callGemini(apiKey, model, system, updated);
      else reply = await callOllama(apiKey, model, system, updated);
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch (e: any) {
      setError(e.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, code, provider, model, apiKey]);

  const cfg = PROVIDER_DEFAULTS[provider];

  return (
    <div className="flex flex-col h-full bg-[#07070f] border-l border-white/5 w-[340px] shrink-0 font-mono">

      <div className="flex items-center justify-between px-3 h-9 border-b border-white/5 shrink-0">
        <span className="text-white/50 text-[10px] tracking-widest uppercase">AI</span>
        <div className="flex gap-1">
          {messages.length > 0 && (
            <button
              onClick={() => { setMessages([]); setError(''); }}
              className="text-white/25 hover:text-white/50 text-[10px] px-2 py-0.5 rounded border border-white/8 hover:border-white/20 transition-all"
            >
              clear
            </button>
          )}
          <button
            onClick={() => setShowSettings(s => !s)}
            className="text-white/25 hover:text-white/50 text-[10px] px-2 py-0.5 rounded border border-white/8 hover:border-white/20 transition-all"
          >
            {showSettings ? 'hide' : 'settings'}
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="p-3 border-b border-white/5 space-y-2 shrink-0">
          <div className="flex gap-1">
            {(['claude', 'openai', 'gemini', 'ollama'] as Provider[]).map(p => (
              <button
                key={p}
                onClick={() => handleProviderChange(p)}
                className={`flex-1 py-1 text-[10px] rounded transition-all ${
                  provider === p
                    ? 'bg-[#ac8929] text-black font-bold'
                    : 'text-white/35 hover:text-white/60 border border-white/8 hover:border-white/20'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={model}
            onChange={e => setModel(e.target.value)}
            placeholder="model"
            className="w-full bg-[#0d0d1a] border border-white/10 text-white/60 text-[11px] px-2 py-1.5 rounded outline-none focus:border-[#ac8929]/40 transition-colors"
          />

          <input
            type="password"
            value={apiKey}
            onChange={e => { setApiKey(e.target.value); setError(''); }}
            placeholder={cfg.placeholder}
            className="w-full bg-[#0d0d1a] border border-white/10 text-white/60 text-[11px] px-2 py-1.5 rounded outline-none focus:border-[#ac8929]/40 transition-colors"
          />

          <p className="text-white/20 text-[10px]">{cfg.label} — session only, never stored</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <p className="text-white/20 text-[11px] text-center mt-10 leading-relaxed">
            Ask the AI to write or edit your CCS script.<br/>
            <span className="text-white/15">The current script is always sent as context.</span>
          </p>
        )}

        {messages.map((msg, i) => {
          const extracted = msg.role === 'assistant' ? extractCode(msg.content) : null;
          return (
            <div key={i} className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div
                className={`max-w-full text-[11px] px-3 py-2 rounded-lg leading-relaxed break-words ${
                  msg.role === 'user'
                    ? 'bg-[#ac8929]/15 text-white/75 border border-[#ac8929]/20'
                    : 'bg-[#0d0d1a] text-white/65 border border-white/8'
                }`}
              >
                {renderMessage(msg.content)}
              </div>
              {extracted && (
                <button
                  onClick={() => onCodeChange(extracted)}
                  className="text-[10px] text-[#ac8929] hover:text-[#c8a030] border border-[#ac8929]/30 hover:border-[#ac8929]/60 px-2 py-0.5 rounded transition-all"
                >
                  Apply to editor
                </button>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start">
            <div className="bg-[#0d0d1a] border border-white/8 text-white/30 text-[11px] px-3 py-2 rounded-lg animate-pulse">
              thinking...
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="px-3 py-1.5 text-[10px] text-red-400/80 bg-red-950/20 border-t border-red-900/20 shrink-0">
          {error}
        </div>
      )}

      <div className="p-3 border-t border-white/5 flex gap-2 shrink-0">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Ask anything... (Enter to send, Shift+Enter for newline)"
          rows={2}
          className="flex-1 bg-[#0d0d1a] border border-white/10 text-white/65 text-[11px] px-2 py-1.5 rounded outline-none focus:border-[#ac8929]/40 resize-none transition-colors placeholder:text-white/20"
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="px-3 bg-[#ac8929] hover:bg-[#c8a030] disabled:opacity-25 text-black text-xs font-bold rounded transition-all self-end pb-1.5 pt-1.5"
        >
          →
        </button>
      </div>
    </div>
  );
}
