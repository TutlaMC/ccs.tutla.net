import type { Node, Edge } from 'reactflow';
import type { CommandNodeData } from './CommandNode';
import { getNodeDef } from './registry';

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
  const condStr = condNode ? getNodeDef('condition').toText(condNode.data) : '';

  const line = getNodeDef(data.command).toText(data);

  if (!hasBlockOutput(data)) {
    lines.push(`${pad}${line}`);
    return lines;
  }

  let header = line;
  if ((data.command === 'if' || data.command === 'if_not') && condStr) header = `${header} ${condStr}`;
  if ((data.command === 'while' || data.command === 'while_not') && condStr) header = `${header} ${condStr}`;

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

  return sections.join('\n');
}
