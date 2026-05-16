import { MarkerType } from 'reactflow';
import type { Node, Edge } from 'reactflow';
import { getNodeDef } from './registry';
import { HANDLE_TYPE_COLORS } from './types';
import type { CommandNodeData } from './CommandNode';

export interface ParsedStatement {
  command: string;
  args: string;
  children: ParsedStatement[];
}

export interface ParsedModule {
  name: string;
  desc: string;
  author: string;
  statements: ParsedStatement[];
}

export function resolveCommand(token: string, restStr: string): string {
  if (token === 'on') return 'on';
  if (token === 'module') {
    const sub = restStr.trim().split(/\s+/)[0];
    if (sub === 'enable')  return 'module_enable';
    if (sub === 'disable') return 'module_disable';
    if (sub === 'create')  return 'module_create';
    return '__def_module';
  }
  if (token === 'config') {
    const sub = restStr.trim().split(/\s+/)[0];
    if (['save', 'load', 'reload'].includes(sub)) return `config_${sub}`;
  }
  if (token === 'def') {
    const sub = restStr.trim().split(/\s+/)[0];
    if (sub === 'module') return '__def_module';
    if (sub === 'desc')   return '__def_desc';
    if (sub === 'func')   return 'def_func';
    return '__def_module';
  }
  const aliases: Record<string, string> = {
    '!if':    'if_not',
    '!while': 'while_not',
    func:     'function',
    desc:     '__def_desc',
  };
  return aliases[token] ?? token;
}

export function parseCCS(code: string): ParsedModule[] {
  const modules: ParsedModule[] = [];
  const lines = code.split('\n');

  let author = '@anonymous';
  const authorLine = lines.find(l => l.trim().startsWith('//'));
  if (authorLine) {
    const m = authorLine.match(/\/\/\s*(@\S+)/);
    if (m) author = m[1];
  }

  let current: ParsedModule | null = null;
  let stack: ParsedStatement[][] = [];

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('//')) continue;

    const openings = (line.match(/\{/g) ?? []).length;
    const closings = (line.match(/\}/g) ?? []).length;
    const stripped = line.replace(/[{}]/g, '').trim();

    if (!stripped) {
      for (let i = 0; i < closings && stack.length > 1; i++) stack.pop();
      continue;
    }

    const [token, ...rest] = stripped.split(/\s+/);
    const restStr = rest.join(' ');
    const cmd = resolveCommand(token, restStr);

    if (cmd === '__def_module') {
      const modName = restStr.replace(/^module\s+/, '').trim();
      if (current) modules.push(current);
      current = { name: modName, desc: '', author, statements: [] };
      stack = [current.statements];
      continue;
    }

    if (!current) continue;

    if (cmd === '__def_desc' && stack.length <= 1) {
      const m = stripped.match(/^(?:def\s+)?desc\s+"(.+)"/);
      if (m) { current.desc = m[1]; continue; }
    }

    const stmt: ParsedStatement = { command: cmd, args: restStr, children: [] };
    (stack[stack.length - 1] ?? []).push(stmt);

    if (openings > closings) {
      stack.push(stmt.children);
    } else if (closings > openings) {
      for (let i = 0; i < closings - openings && stack.length > 1; i++) stack.pop();
    }
  }

  if (current) modules.push(current);
  return modules;
}

function stmtToNodeData(stmt: ParsedStatement): CommandNodeData {
  const def = getNodeDef(stmt.command);
  const base: CommandNodeData = {
    command:     def.command,
    label:       def.label,
    description: def.description,
    category:    def.category,
    argHints:    def.argHints,
    inputs:      def.inputs,
    outputs:     def.outputs,
    palette:     def.palette,
  };
  const parsed = def.fromArgs(stmt.args);
  return { ...base, ...parsed };
}

const CONDITION_COMMANDS = new Set(['if', 'if_not', 'while', 'while_not']);

function extractCondition(command: string, args: string): { nodeArgs: string; condStr: string } {
  if (command === 'if' || command === 'if_not') {
    return { nodeArgs: '', condStr: args.trim() };
  }
  // while / while_not: first token is the delay arg, rest is the condition
  const parts = args.trim().split(/\s+/);
  return { nodeArgs: parts[0] ?? '', condStr: parts.slice(1).join(' ') };
}

function makeConditionNodeData(condStr: string): CommandNodeData {
  const def = getNodeDef('condition');
  const base: CommandNodeData = {
    command:     def.command,
    label:       def.label,
    description: def.description,
    category:    def.category,
    argHints:    def.argHints,
    inputs:      def.inputs,
    outputs:     def.outputs,
    palette:     def.palette,
  };
  const parts = condStr.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return base;
  return {
    ...base,
    selectedCondition: parts[0],
    ...(parts[1] ? { arg1: parts[1] } : {}),
    ...(parts[2] ? { arg2: parts[2] } : {}),
    ...(parts[3] ? { arg3: parts[3] } : {}),
    ...(parts.length > 4 ? { arg4: parts.slice(4).join(' ') } : {}),
  };
}

let _id = 0;
export const resetId = () => { _id = 0; };
export const uid = () => `n${_id++}`;

function mkEdge(srcId: string, srcHandle: string, tgtId: string, tgtHandle: string | undefined, dataType: string): Edge {
  const color = (HANDLE_TYPE_COLORS as any)[dataType] ?? '#aaaacc';
  return {
    id: `e-${srcId}-${tgtId}-${srcHandle}`,
    source: srcId,
    sourceHandle: srcHandle,
    target: tgtId,
    targetHandle: tgtHandle,
    type: 'smoothstep',
    style: { stroke: color, strokeWidth: 1.5, opacity: 0.55 },
    markerEnd: { type: MarkerType.ArrowClosed, color, width: 10, height: 10 },
  };
}

function statementsToGraph(
  stmts: ParsedStatement[],
  baseX: number,
  startY: number,
  parentId: string,
  parentHandle: string,
  parentDT: string,
  nodes: Node[],
  edges: Edge[],
): number {
  let y = startY;
  for (const stmt of stmts) {
    const isCondCmd = CONDITION_COMMANDS.has(stmt.command);
    const { nodeArgs, condStr } = isCondCmd
      ? extractCondition(stmt.command, stmt.args)
      : { nodeArgs: stmt.args, condStr: '' };

    const nodeData = stmtToNodeData(isCondCmd ? { ...stmt, args: nodeArgs } : stmt);
    const nodeId = uid();

    nodes.push({ id: nodeId, type: 'command', position: { x: baseX, y }, data: nodeData });
    edges.push(mkEdge(parentId, parentHandle, nodeId, nodeData.inputs[0]?.id, parentDT));

    if (condStr) {
      const condData = makeConditionNodeData(condStr);
      const condId = uid();
      nodes.push({ id: condId, type: 'command', position: { x: baseX - 250, y: y - 60 }, data: condData });
      edges.push(mkEdge(condId, 'out', nodeId, 'condition', 'condition'));
    }

    y += 130;

    if (stmt.children.length) {
      const outPort = nodeData.outputs[0];
      y = statementsToGraph(stmt.children, baseX + 300, y, nodeId, outPort?.id ?? 'out', outPort?.dataType ?? 'flow', nodes, edges);
    }
  }
  return y;
}

export function buildGraph(modules: ParsedModule[]): { nodes: Node[]; edges: Edge[] } {
  resetId();
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  modules.forEach((mod, mi) => {
    const moduleId = uid();
    const modDef = getNodeDef('def_module');
    nodes.push({
      id: moduleId,
      type: 'command',
      position: { x: mi * 560, y: 80 },
      data: {
        command:     modDef.command,
        label:       modDef.label,
        description: modDef.description,
        category:    modDef.category,
        argHints:    modDef.argHints,
        inputs:      modDef.inputs,
        outputs:     modDef.outputs,
        palette:     modDef.palette,
        moduleName:  mod.name,
        moduleDesc:  mod.desc,
        author:      mod.author,
      } as CommandNodeData,
    });

    statementsToGraph(mod.statements, mi * 560 + 300, 80, moduleId, 'events', 'event', nodes, edges);
  });

  return { nodes, edges };
}
