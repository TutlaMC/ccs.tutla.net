'use client';

import { useCallback, useEffect, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,

  BackgroundVariant,
  useReactFlow,
} from 'reactflow';
import type {
  Node,
  Edge,
  Connection,
} from 'reactflow';

import { CommandNode, type CommandNodeData } from '../../../../lib/ccs-nodes/CommandNode';
import { NodePalette } from '../../../../lib/ccs-nodes/NodePalette';
import { getNodeDef } from '../../../../lib/ccs-nodes/registry';
import { parseCCS, buildGraph, uid } from '../../../../lib/ccs-nodes/parser';
import { generateCCS } from '../../../../lib/ccs-nodes/generator';
import { CATEGORY_COLORS, HANDLE_TYPE_COLORS, type HandleDataType } from '../../../../lib/ccs-nodes/types';

const nodeTypes = { command: CommandNode };

const COMPATIBLE: Record<HandleDataType, HandleDataType[]> = {
  flow:      ['flow'],
  event:     ['event'],
  condition: ['condition'],
  body:      ['body', 'flow'],
  callback:  ['callback', 'flow'],
};

function getPortDataType(nodeId: string, handleId: string | null | undefined, nodes: Node[]): HandleDataType | null {
  const node = nodes.find(n => n.id === nodeId);
  if (!node) return null;
  const data = node.data as CommandNodeData;
  return [...data.inputs, ...data.outputs].find(p => p.id === handleId)?.dataType ?? null;
}

interface Props {
  code: string;
  onCodeChange?: (code: string) => void;
}

function CCSFlowViewInner({ code, onCodeChange }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { project, getNodes, getEdges } = useReactFlow();

  const fromCode = useRef(false);
  const lastEmitted = useRef('');

  const injectOnChange = useCallback((rawNodes: Node[]): Node[] => {
    return rawNodes.map(n => ({
      ...n,
      data: {
        ...n.data,
        _onChange: (patch: Partial<CommandNodeData>) => {
          setNodes(prev => {
            const next = prev.map(p => p.id === n.id ? { ...p, data: { ...p.data, ...patch } } : p);
            const newCode = generateCCS(next, getEdges());
            console.log(newCode);
            if (newCode !== lastEmitted.current) {
              lastEmitted.current = newCode;
              onCodeChange?.(newCode);
            }
            return next;
          });
        },
      },
    }));
  }, [setNodes, getEdges, onCodeChange]);

  useEffect(() => {
    if (code === lastEmitted.current) return;
    fromCode.current = true;
    const mods = parseCCS(code);
    const { nodes: n, edges: e } = buildGraph(mods);
    setNodes(injectOnChange(n));
    setEdges(e);
    setTimeout(() => { fromCode.current = false; }, 0);
  }, [code]);

  const emitCode = useCallback(() => {
    if (fromCode.current) return;
    const newCode = generateCCS(getNodes(), getEdges());
    console.log(newCode)
    if (newCode !== lastEmitted.current) {
      lastEmitted.current = newCode;
      onCodeChange?.(newCode);
    }
  }, [getNodes, getEdges, onCodeChange]);

  const isValidConnection = useCallback((conn: Connection): boolean => {
    if (conn.source === conn.target) return false;
    const srcType = getPortDataType(conn.source!, conn.sourceHandle, getNodes());
    const tgtType = getPortDataType(conn.target!, conn.targetHandle, getNodes());
    if (!srcType || !tgtType) return true;
    return COMPATIBLE[srcType]?.includes(tgtType) ?? false;
  }, [getNodes]);

  const onConnect = useCallback((conn: Connection) => {
    if (!isValidConnection(conn)) return;
    const srcType = getPortDataType(conn.source!, conn.sourceHandle, getNodes());
    const color = srcType ? HANDLE_TYPE_COLORS[srcType] : '#aaaacc';
    setEdges(eds => addEdge({ ...conn, type: 'smoothstep', style: { stroke: color, strokeWidth: 1.5, opacity: 0.6 } }, eds));
    setTimeout(emitCode, 0);
  }, [isValidConnection, getNodes, setEdges, emitCode]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData('application/ccs-node');
    if (!raw) return;
    const def = JSON.parse(raw);
    const bounds = e.currentTarget.getBoundingClientRect();
    const position = project({ x: e.clientX - bounds.left, y: e.clientY - bounds.top });
    const nodeId = uid();
    const newNode: Node<CommandNodeData> = {
      id: nodeId,
      type: 'command',
      position,
      data: {
        ...def,
        _onChange: (patch: Partial<CommandNodeData>) => {
          setNodes(prev => {
            const next = prev.map(p => p.id === nodeId ? { ...p, data: { ...p.data, ...patch } } : p);
            const newCode = generateCCS(next, getEdges());
            console.log(newCode);
            if (newCode !== lastEmitted.current) {
              lastEmitted.current = newCode;
              onCodeChange?.(newCode);
            }
            return next;
          });
        },
      },
    };
    setNodes(prev => [...prev, newNode]);
    setTimeout(emitCode, 50);
  }, [project, setNodes, getEdges, onCodeChange, emitCode]);

  const wrappedNodesChange: typeof onNodesChange = useCallback(changes => {
    onNodesChange(changes);
    if (changes.some(c => c.type === 'remove')) setTimeout(emitCode, 0);
  }, [onNodesChange, emitCode]);

  const wrappedEdgesChange: typeof onEdgesChange = useCallback(changes => {
    onEdgesChange(changes);
    if (changes.some(c => c.type === 'remove')) setTimeout(emitCode, 0);
  }, [onEdgesChange, emitCode]);

  return (
    <div style={{ display: 'flex', height: '100%', background: '#0a0a14' }} className='bg-red'>
      <NodePalette />
      <div style={{ flex: 1, position: 'relative' }} onDrop={onDrop} onDragOver={onDragOver}>
        {nodes.length === 0 && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            color: '#2a2a3a', fontFamily: 'monospace', gap: 8,
            pointerEvents: 'none',
          }}>
            <span style={{ fontSize: 32 }}>◈</span>
            <span style={{ fontSize: 13 }}>No modules found</span>
            <span style={{ fontSize: 10 }}>Write `def module my-module` or drag a Module node</span>
          </div>
        )}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={wrappedNodesChange}
          onEdgesChange={wrappedEdgesChange}
          onConnect={onConnect}
          isValidConnection={isValidConnection}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.25 }}
          deleteKeyCode="Delete"
          attributionPosition="bottom-left"
        >
          <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#141424" />
          <Controls style={{ background: '#111120', border: '1px solid #ac892930', borderRadius: 6 }} />
          <MiniMap
            style={{ background: '#0a0a14', border: '1px solid #1e1e2e' }}
            nodeColor={n => CATEGORY_COLORS[(n.data as CommandNodeData)?.category] ?? '#333'}
          />
        </ReactFlow>
      </div>
    </div>
  );
}

export default function CCSFlowView(props: Props) {
  return <CCSFlowViewInner {...props} />;
}