'use client';

import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { CATEGORY_COLORS } from './types';

interface ModuleNodeData {
  name: string;
  desc: string;
  author: string;
}

export const ModuleNode = memo(({ data }: { data: ModuleNodeData }) => {
  const color = CATEGORY_COLORS['module'];

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        border: `1px solid ${color}`,
        borderRadius: 8,
        padding: '12px 18px',
        minWidth: 200,
        boxShadow: `0 0 24px ${color}30`,
        fontFamily: 'monospace',
      }}
    >
      <div
        style={{
          color,
          fontSize: 9,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: 2,
          marginBottom: 4,
        }}
      >
        MODULE
      </div>
      <div style={{ color: '#f0e6c8', fontSize: 15, fontWeight: 700 }}>
        {data.name}
      </div>
      {data.desc && (
        <div style={{ color: '#8a8a9a', fontSize: 11, marginTop: 4 }}>
          {data.desc}
        </div>
      )}
      {data.author && (
        <div style={{ color, fontSize: 10, marginTop: 6, opacity: 0.6 }}>
          {data.author}
        </div>
      )}

      {/* Only output — connects to event nodes */}
      <Handle
        type="source"
        position={Position.Right}
        id="events"
        style={{
          background: color,
          border: '2px solid #0a0a14',
          width: 10,
          height: 10,
        }}
        title="events"
      />
    </div>
  );
});

ModuleNode.displayName = 'ModuleNode';