'use client';

import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  HANDLE_TYPE_COLORS,
  type NodeDefinition,
} from './types';
import type { UIField } from './builder';
import { getNodeDef } from './registry';

export interface CommandNodeData extends NodeDefinition {
  selectedEvent?: string;
  selectedCondition?: string;
  moduleName?: string;
  moduleDesc?: string;
  author?: string;
  arg1?: string;
  arg2?: string;
  arg3?: string;
  arg4?: string;
  _onChange?: (patch: Partial<CommandNodeData>) => void;
}

const inputStyle: React.CSSProperties = {
  background: '#0a0a14',
  border: '1px solid #2a2a3a',
  borderRadius: 3,
  color: '#ccc',
  fontSize: 11,
  padding: '3px 6px',
  width: '100%',
  outline: 'none',
  fontFamily: 'monospace',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  color: '#555',
  fontSize: 9,
  letterSpacing: 0.8,
  marginBottom: 2,
  textTransform: 'uppercase' as const,
};

function TextField({ field, value, onChange }: { field: UIField & { kind: 'text' }; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ marginBottom: 5 }}>
      <div style={labelStyle}>{field.label}</div>
      <input className="nodrag" value={value} onChange={e => onChange(e.target.value)} placeholder={field.placeholder} style={inputStyle} />
    </div>
  );
}

function SelectField({ field, value, onChange }: { field: UIField & { kind: 'select' }; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ marginBottom: 5 }}>
      <div style={labelStyle}>{field.label}</div>
      <select className="nodrag" value={value} onChange={e => onChange(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
        {field.options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function handlePos(index: number, total: number): string {
  if (total <= 1) return '50%';
  return `${15 + (index * 70) / Math.max(total - 1, 1)}%`;
}

export const CommandNode = memo(({ data }: NodeProps<CommandNodeData>) => {
  const color = CATEGORY_COLORS[data.category];
  const catLabel = CATEGORY_LABELS[data.category];
  const def = getNodeDef(data.command);

  const onChange = (patch: Partial<CommandNodeData>) => data._onChange?.(patch);

  const renderBody = () => {
    const fields = def.getFields(data);
    if (!fields.length) return null;
    return (
      <>
        {fields.map((field, i) => {
          if (field.kind === 'text') {
            return (
              <TextField
                key={i}
                field={field}
                value={(data as any)[field.key] ?? ''}
                onChange={v => onChange({ [field.key]: v } as any)}
              />
            );
          }
          return (
            <SelectField
              key={i}
              field={field}
              value={(data as any)[field.key] ?? field.default}
              onChange={v => {
                const p: any = { [field.key]: v };
                for (const k of field.clearOnChange ?? []) p[k] = '';
                onChange(p);
              }}
            />
          );
        })}
      </>
    );
  };

  const displayLabel = def.displayLabel(data);

  return (
    <div style={{
      background: '#0d0d1a',
      border: `1px solid ${color}44`,
      borderLeft: `3px solid ${color}`,
      borderRadius: 6,
      minWidth: 210,
      maxWidth: 280,
      fontFamily: 'monospace',
      boxShadow: `0 2px 16px ${color}12`,
      position: 'relative',
    }}>
      {data.inputs.map((port, i) => (
        <Handle
          key={port.id}
          type="target"
          position={Position.Left}
          id={port.id}
          title={`${port.label} [${port.dataType}]`}
          style={{
            top: handlePos(i, data.inputs.length),
            background: HANDLE_TYPE_COLORS[port.dataType],
            border: '2px solid #0a0a14',
            width: 10,
            height: 10,
          }}
        />
      ))}

      <div style={{ padding: '6px 10px 4px', borderBottom: `1px solid ${color}1a` }}>
        <div style={{ color, fontSize: 9, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 2, opacity: 0.7 }}>
          {catLabel}
        </div>
        <div style={{ color: '#f0e6c8', fontSize: 13, fontWeight: 700 }}>
          {displayLabel}
        </div>
      </div>

      <div style={{ padding: '6px 10px 8px' }}>
        {renderBody()}
      </div>

      {data.outputs.map((port, i) => (
        <Handle
          key={port.id}
          type="source"
          position={Position.Right}
          id={port.id}
          title={`${port.label} [${port.dataType}]`}
          style={{
            top: handlePos(i, data.outputs.length),
            background: HANDLE_TYPE_COLORS[port.dataType],
            border: '2px solid #0a0a14',
            width: 10,
            height: 10,
          }}
        />
      ))}

      {data.outputs.length > 1 && (
        <div style={{
          position: 'absolute',
          right: 16,
          top: 0,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-around',
          pointerEvents: 'none',
        }}>
          {data.outputs.map(port => (
            <span key={port.id} style={{
              color: `${HANDLE_TYPE_COLORS[port.dataType]}99`,
              fontSize: 8,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              textAlign: 'right',
            }}>
              {port.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
});

CommandNode.displayName = 'CommandNode';
