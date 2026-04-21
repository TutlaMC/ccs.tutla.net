'use client';

import { useState } from 'react';
import { NODE_REGISTRY } from './registry';
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  CATEGORY_DESCRIPTIONS,
  type Category,
  type NodeDefinition,
} from './types';

const CATEGORY_ORDER: Category[] = ['module', 'event', 'flow', 'condition', 'client', 'macro', 'packet'];

const grouped = CATEGORY_ORDER.reduce((acc, cat) => {
  acc[cat] = NODE_REGISTRY.filter(n => n.palette && n.category === cat);
  return acc;
}, {} as Record<Category, NodeDefinition[]>);

function PaletteItem({ node }: { node: NodeDefinition }) {
  const color = CATEGORY_COLORS[node.category];
  return (
    <div
      draggable
      onDragStart={e => {
        e.dataTransfer.setData('application/ccs-node', JSON.stringify(node));
        e.dataTransfer.effectAllowed = 'move';
      }}
      title={node.description}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 8px',
        marginBottom: 2,
        borderRadius: 4,
        cursor: 'grab',
        background: '#111120',
        border: `1px solid ${color}22`,
        borderLeft: `2px solid ${color}88`,
        userSelect: 'none',
        transition: 'background 0.12s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = `${color}14`)}
      onMouseLeave={e => (e.currentTarget.style.background = '#111120')}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: '#ddd', fontSize: 11, fontWeight: 600, fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {node.label}
        </div>
        {node.argHints.length > 0 && (
          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 2 }}>
            {node.argHints.slice(0, 3).map((hint, i) => (
              <span key={i} style={{ background: `${color}18`, color: `${color}cc`, fontSize: 8, padding: '1px 4px', borderRadius: 2, fontFamily: 'monospace' }}>
                {hint}
              </span>
            ))}
          </div>
        )}
      </div>
      <span style={{ color: '#333', fontSize: 10 }}>⠿</span>
    </div>
  );
}

function CategorySection({ cat, nodes }: { cat: Category; nodes: NodeDefinition[] }) {
  const [open, setOpen] = useState(['module', 'event', 'flow'].includes(cat));
  const color = CATEGORY_COLORS[cat];
  if (nodes.length === 0) return null;
  return (
    <div style={{ marginBottom: 4 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          width: '100%',
          padding: '5px 8px',
          background: 'transparent',
          border: 'none',
          borderBottom: `1px solid ${color}22`,
          cursor: 'pointer',
          textAlign: 'left',
          marginBottom: open ? 5 : 0,
        }}
      >
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
        <div style={{ flex: 1 }} className='leading-4'>
          <div style={{ color, fontSize: 9, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'monospace' }}>
            {CATEGORY_LABELS[cat]}
          </div>
          <div style={{ color: '#444', fontSize: 9 }}>{CATEGORY_DESCRIPTIONS[cat]}</div>
        </div>
        <span style={{ color: '#444', fontSize: 10 }}>{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div style={{ paddingLeft: 4 }}>
          {nodes.map(n => <PaletteItem key={n.command} node={n} />)}
        </div>
      )}
    </div>
  );
}

export function NodePalette() {
  const [search, setSearch] = useState('');
  const filtered = search.trim()
    ? NODE_REGISTRY.filter(n => n.palette && (n.label.toLowerCase().includes(search.toLowerCase()) || n.description.toLowerCase().includes(search.toLowerCase())))
    : null;

  return (
    <div style={{ width: 200, flexShrink: 0, background: '#0a0a14', borderRight: '1px solid #1a1a2a', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: 'monospace' }}>
      <div style={{ padding: '10px 10px 6px', borderBottom: '1px solid #1a1a2a', flexShrink: 0 }}>
        <div style={{ color: '#ac8929', fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>
          Nodes
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search..."
          style={{ width: '100%', background: '#111120', border: '1px solid #2a2a3a', borderRadius: 4, color: '#ccc', fontSize: 11, padding: '4px 8px', outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }}
        />
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 6px', scrollbarWidth: 'thin' }}>
        {filtered
          ? filtered.length === 0
            ? <div style={{ color: '#333', fontSize: 11, padding: 8, textAlign: 'center' }}>No results</div>
            : filtered.map(n => <PaletteItem key={n.command} node={n} />)
          : CATEGORY_ORDER.map(cat => <CategorySection key={cat} cat={cat} nodes={grouped[cat]} />)
        }
      </div>
      <div style={{ padding: '6px 8px', borderTop: '1px solid #1a1a2a', color: '#2a2a3a', fontSize: 9, textAlign: 'center', flexShrink: 0 }}>
        drag onto canvas
      </div>
    </div>
  );
}