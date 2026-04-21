'use client';

import { memo } from 'react';
import { Handle, Position} from 'reactflow';
import type { NodeProps } from 'reactflow';
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  HANDLE_TYPE_COLORS,
  CCS_EVENTS,
  CCS_CONDITIONS,
  CONDITION_ARG_SHAPES,
  type NodeDefinition,
  type HandleDataType,
  type CCSEvent,
  type CCSCondition,
} from './types';

export interface CommandNodeData extends NodeDefinition {
  selectedEvent?: CCSEvent;
  selectedCondition?: CCSCondition;
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

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div style={{ marginBottom: 5 }}>
      <div style={labelStyle}>{label}</div>
      <input className="nodrag" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder ?? label} style={inputStyle} />
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: readonly string[] }) {
  return (
    <div style={{ marginBottom: 5 }}>
      <div style={labelStyle}>{label}</div>
      <select className="nodrag" value={value} onChange={e => onChange(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
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
  const onChange = (patch: Partial<CommandNodeData>) => data._onChange?.(patch);

  const renderBody = () => {
    if (data.command === 'def_module') {
      return (
        <>
          <Field label="Module ID" value={data.moduleName ?? ''} onChange={v => onChange({ moduleName: v })} placeholder="my-module" />
          <Field label="Description" value={data.moduleDesc ?? ''} onChange={v => onChange({ moduleDesc: v })} placeholder="Module description" />
          <Field label="Author" value={data.author ?? '@anonymous'} onChange={v => onChange({ author: v })} placeholder="@anonymous" />
        </>
      );
    }

    if (data.command === 'on') {
      return (
        <Select label="Event" value={data.selectedEvent ?? CCS_EVENTS[0]} onChange={v => onChange({ selectedEvent: v as CCSEvent })} options={CCS_EVENTS} />
      );
    }

    if (data.command === 'condition') {
      const cond = (data.selectedCondition ?? 'playing') as CCSCondition;
      const shape = CONDITION_ARG_SHAPES[cond];
      return (
        <>
          <Select label="Condition" value={cond} onChange={v => onChange({ selectedCondition: v as CCSCondition, arg1: '', arg2: '', arg3: '', arg4: '' })} options={CCS_CONDITIONS} />
          {shape.type === 'id' && <Field label={shape.label} value={data.arg1 ?? ''} onChange={v => onChange({ arg1: v })} placeholder=":item_id or #partial" />}
          {shape.type === 'range' && <Field label={shape.label} value={data.arg1 ?? ''} onChange={v => onChange({ arg1: v })} placeholder=">=0.9" />}
          {shape.type === 'n' && <Field label={shape.label} value={data.arg1 ?? ''} onChange={v => onChange({ arg1: v })} placeholder="50" />}
          {shape.type === 'id+range' && (
            <>
              <Field label={shape.idLabel} value={data.arg1 ?? ''} onChange={v => onChange({ arg1: v })} placeholder=":id or #partial" />
              <Field label={shape.rangeLabel} value={data.arg2 ?? ''} onChange={v => onChange({ arg2: v })} placeholder=">=1.0" />
            </>
          )}
          {shape.type === 'xyz+id' && (
            <>
              <Field label="X" value={data.arg1 ?? ''} onChange={v => onChange({ arg1: v })} placeholder="~ or ^1" />
              <Field label="Y" value={data.arg2 ?? ''} onChange={v => onChange({ arg2: v })} placeholder="~" />
              <Field label="Z" value={data.arg3 ?? ''} onChange={v => onChange({ arg3: v })} placeholder="~" />
              <Field label="Block/Entity ID" value={data.arg4 ?? ''} onChange={v => onChange({ arg4: v })} placeholder=":diamond_block" />
            </>
          )}
          {shape.type === 'dimension' && (
            <Select label="Dimension" value={data.arg1 ?? 'overworld'} onChange={v => onChange({ arg1: v })} options={['overworld', 'the_nether', 'the_end']} />
          )}
          {shape.type === 'input' && (
            <Select label="Input" value={data.arg1 ?? 'attack'} onChange={v => onChange({ arg1: v })} options={['attack','use','forward','backward','strafe_left','strafe_right','jump','sprint','sneak','lock_cursor','unlock_cursor','left','right','middle','inventory']} />
          )}
        </>
      );
    }

    if (data.argHints.length === 0) return null;

    return (
      <>
        {data.argHints.map((hint, i) => (
          <Field key={i} label={hint} value={(data as any)[`arg${i + 1}`] ?? ''} onChange={v => onChange({ [`arg${i + 1}`]: v } as any)} placeholder={hint} />
        ))}
      </>
    );
  };

  const displayLabel =
    data.command === 'on' && data.selectedEvent
      ? `on ${data.selectedEvent}`
      : data.command === 'condition' && data.selectedCondition
      ? data.selectedCondition
      : data.label;

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