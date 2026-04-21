import type { Node, Edge } from 'reactflow';
import type { CommandNodeData } from './CommandNode';

function childrenOf(nodeId: string, handle: string, edges: Edge[], nodeMap: Map<string, Node<CommandNodeData>>): Node<CommandNodeData>[] {
  return edges
    .filter(e => e.source === nodeId && e.sourceHandle === handle)
    .map(e => nodeMap.get(e.target))
    .filter((n): n is Node<CommandNodeData> => !!n);
}

function getConditionNode(nodeId: string, edges: Edge[], nodeMap: Map<string, Node<CommandNodeData>>): Node<CommandNodeData> | undefined {
  const edge = edges.find(e => e.target === nodeId && e.targetHandle === 'condition');
  return edge ? nodeMap.get(edge.source) : undefined;
}

function emitConditionStr(data: CommandNodeData): string {
  const cond = data.selectedCondition ?? 'playing';
  const a = (n: number) => (data as any)[`arg${n}`] ?? '';
  return [cond, a(1), a(2), a(3), a(4)].filter(Boolean).join(' ');
}

function a(data: CommandNodeData, n: number): string {
  return (data as any)[`arg${n}`] ?? '';
}

function emitLine(data: CommandNodeData): string {
  switch (data.command) {
    case 'on':            return `on ${data.selectedEvent ?? 'tick'}`;
    case 'if':            return `if`;
    case 'if_not':        return `!if`;
    case 'while':         return `while ${a(data, 1) || '0.05'}`;
    case 'while_not':     return `!while ${a(data, 1) || '0.05'}`;
    case 'loop':          return `loop ${a(data, 1) || 'n'}`;
    case 'loop_period':   return `loop_period ${a(data, 1) || 'n'} ${a(data, 2) || '1'}`;
    case 'execute':       return 'execute';
    case 'execute_random':return 'execute_random';
    case 'execute_period':return `execute_period ${a(data, 1) || '0.25'}`;
    case 'wait':          return `wait ${a(data, 1) || '0.05'}`;
    case 'wait_random':   return `wait_random ${a(data, 1) || '0.05'} ${a(data, 2) || '0.15'}`;
    case 'as':            return `as ${a(data, 1) || 'target_entity'} ${a(data, 2)}`.trim();
    case 'function':      return `func ${a(data, 1) || 'myFunc'}`;
    case 'def_func':      return `def func ${a(data, 1) || 'myFunc'}`;
    case 'send':          return `send "${a(data, 1) || 'Hello World'}"`;
    case 'say':           return `say "${a(data, 1) || 'Hello World'}"`;
    case 'print':         return `print "${a(data, 1) || 'Hello World'}"`;
    case 'throw':         return `throw "${a(data, 1) || 'error'}"`;
    case 'notify':        return `notify ${a(data, 1) || '3'} "${a(data, 2) || 'notification'}"`;
    case 'playsound':     return `playsound ${a(data, 1) || '#block.note_block.pling'} ${a(data, 2) || '1'} ${a(data, 3) || '1'}`;
    case 'exit':          return `exit ${a(data, 1) || '0'}`;
    case 'module_enable':  return `module enable ${a(data, 1) || 'module-id'}`;
    case 'module_disable': return `module disable ${a(data, 1) || 'module-id'}`;
    case 'module_create':  return `module create ${a(data, 1) || 'module-id'}`;
    case 'config_save':    return 'config save';
    case 'config_load':    return 'config load';
    case 'config_reload':  return 'config reload';
    case 'input':          return `input ${a(data, 1) || 'attack'}`;
    case 'hold_input':     return `hold_input ${a(data, 1) || 'attack'} ${a(data, 2) || '1.0'}`;
    case 'switch':         return `switch ${a(data, 1) || '#totem'}`;
    case 'swap':           return 'swap';
    case 'drop':           return `drop ${a(data, 1) || 'all'}`;
    case 'damage':         return `damage ${a(data, 1) || 'nearest_entity'} ${a(data, 2) || ':player'}`.trim();
    case 'turn_to':        return `turn_to ${a(data, 1) || 'nearest_entity'} ${a(data, 2) || ':player'} then`;
    case 'snap_to':        return `snap_to ${a(data, 1) || 'nearest_entity'} ${a(data, 2) || ':player'} then`;
    case 'teleport':       return `teleport ${a(data, 1) || '~'} ${a(data, 2) || '~'} ${a(data, 3) || '~'}`;
    case 'velocity':       return `velocity ${a(data, 1) || '~'} ${a(data, 2) || '~'} ${a(data, 3) || '~'}`;
    case 'gui_drop':       return `gui_drop ${a(data, 1) || ':item'} ${a(data, 2) || 'all'}`;
    case 'gui_switch':     return `gui_switch ${a(data, 1) || ':item'}`;
    case 'gui_swap':       return `gui_swap ${a(data, 1) || ':item'}`;
    case 'gui_quickmove':  return `gui_quickmove ${a(data, 1) || ':item'} ${a(data, 2)}`.trim();
    case 'cancel_packet':  return `cancel_packet ${a(data, 1) || 'c2s'} ${a(data, 2) || 'playerMove'}`;
    case 'uncancel_packet':return `uncancel_packet ${a(data, 1) || 'c2s'} ${a(data, 2) || 'playerMove'}`;
    default:               return `${data.command} ${a(data, 1)} ${a(data, 2)}`.trim();
  }
}

function hasBlockOutput(data: CommandNodeData): boolean {
  return data.outputs.some(o => o.dataType === 'body' || o.dataType === 'callback');
}

function emitNode(
  node: Node<CommandNodeData>,
  edges: Edge[],
  nodeMap: Map<string, Node<CommandNodeData>>,
  indent: number,
): string[] {
  const data = node.data;
  if (data.command === 'def_module' || data.command === 'condition') return [];

  const pad = '  '.repeat(indent);
  const lines: string[] = [];

  const condNode = getConditionNode(node.id, edges, nodeMap);
  const condStr = condNode ? emitConditionStr(condNode.data) : '';

  if (!hasBlockOutput(data)) {
    lines.push(`${pad}${emitLine(data)}`);
    return lines;
  }

  let header = emitLine(data);
  if ((data.command === 'if' || data.command === 'if_not') && condStr) {
    header = `${header} ${condStr}`;
  }
  if ((data.command === 'while' || data.command === 'while_not') && condStr) {
    header = `${header} ${condStr}`;
  }
  lines.push(`${pad}${header} {`);

  const bodyPort = data.outputs.find(o => o.dataType === 'body' || o.dataType === 'callback');
  if (bodyPort) {
    for (const child of childrenOf(node.id, bodyPort.id, edges, nodeMap)) {
      lines.push(...emitNode(child, edges, nodeMap, indent + 1));
    }
  }

  lines.push(`${pad}}`);

  const elseChildren = childrenOf(node.id, 'else', edges, nodeMap);
  if (elseChildren.length > 0) {
    lines.push(`${pad}// else:`);
    for (const child of elseChildren) {
      lines.push(...emitNode(child, edges, nodeMap, indent));
    }
  }

  const flowPort = data.outputs.find(o => o.dataType === 'flow');
  if (flowPort) {
    for (const child of childrenOf(node.id, flowPort.id, edges, nodeMap)) {
      lines.push(...emitNode(child, edges, nodeMap, indent));
    }
  }

  return lines;
}

export function generateCCS(nodes: Node[], edges: Edge[]): string {
  const nodeMap = new Map(nodes.map(n => [n.id, n as Node<CommandNodeData>]));
  const sections: string[] = [];

  for (const modNode of nodes.filter(n => n.data.command === 'def_module')) {
    const data = modNode.data as CommandNodeData;
    const moduleLines: string[] = [
      `// ${data.author ?? '@anonymous'}`,
      `def module ${data.moduleName ?? 'unnamed-module'}`,
    ];
    if (data.moduleDesc) moduleLines.push(`def desc "${data.moduleDesc}"`);
    moduleLines.push('');

    for (const evtNode of childrenOf(modNode.id, 'events', edges, nodeMap)) {
      moduleLines.push(...emitNode(evtNode, edges, nodeMap, 0), '');
    }

    sections.push(moduleLines.join('\n'));
  }
  let e = sections.join('\n');
  console.log(e);
  return e;
}