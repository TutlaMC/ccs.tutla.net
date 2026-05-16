import { define, lit, text, quoted, sel, when, type UIField, type CompiledNodeDef } from './builder';
import { CCS_EVENTS, CCS_CONDITIONS, CONDITION_ARG_SHAPES, type CCSCondition } from './types';
import type { PortDef } from './types';

const f  = (id: string, label = id): PortDef => ({ id, label, dataType: 'flow' });
const ev = (id: string, label = id): PortDef => ({ id, label, dataType: 'event' });
const co = (id: string, label = id): PortDef => ({ id, label, dataType: 'condition' });
const bd = (id: string, label = id): PortDef => ({ id, label, dataType: 'body' });
const cb = (id: string, label = id): PortDef => ({ id, label, dataType: 'callback' });

const INPUT_OPTIONS = ['attack','use','forward','backward','strafe_left','strafe_right','jump','sprint','sneak','lock_cursor','unlock_cursor','left','right','middle','inventory'] as const;

export const NODE_REGISTRY: CompiledNodeDef[] = [

  // ---- Module ----

  define('def_module', 'Module')
    .description('Declares a custom CCS module')
    .category('module')
    .out(ev('events', 'events'))
    .customText(d => `def module ${d.moduleName ?? 'unnamed-module'}`)
    .customFields(() => [
      { kind: 'text', key: 'moduleName',  label: 'Module ID',   placeholder: 'my-module' },
      { kind: 'text', key: 'moduleDesc',  label: 'Description', placeholder: 'Module description' },
      { kind: 'text', key: 'author',      label: 'Author',      placeholder: '@anonymous' },
    ])
    .customLabel(d => d.moduleName ?? 'Module')
    .hints('module-id', 'description')
    .palette()
    .build(),

  // ---- Event ----

  define('on', 'on event')
    .description('Register an event listener')
    .category('event')
    .in(ev('module', 'module'))
    .out(bd('body', 'body'))
    .cmd('on')
    .syntax(
      sel('selectedEvent', 'Event', CCS_EVENTS, 'tick', ['arg1']),
      when('selectedEvent', ['key_press', 'key_release'], text('arg1', 'Key', 'e')),
    )
    .customLabel(d => {
      const evt = d.selectedEvent ?? 'tick';
      const needsKey = evt === 'key_press' || evt === 'key_release';
      return `on ${evt}${needsKey && d.arg1 ? ` ${d.arg1}` : ''}`;
    })
    .palette()
    .build(),

  // ---- Condition ----

  define('condition', 'condition')
    .description('A condition node for if / while')
    .category('condition')
    .out(co('out', 'out'))
    .customText(d => {
      const cond = d.selectedCondition ?? 'playing';
      return [cond, d.arg1, d.arg2, d.arg3, d.arg4].filter(Boolean).join(' ');
    })
    .customFields(d => {
      const cond = (d.selectedCondition ?? 'playing') as CCSCondition;
      const shape = CONDITION_ARG_SHAPES[cond];
      const fields: UIField[] = [
        { kind: 'select', key: 'selectedCondition', label: 'Condition', options: CCS_CONDITIONS, default: 'playing', clearOnChange: ['arg1','arg2','arg3','arg4'] },
      ];
      if (shape.type === 'id')
        fields.push({ kind: 'text', key: 'arg1', label: shape.label, placeholder: ':item_id or #partial' });
      else if (shape.type === 'range')
        fields.push({ kind: 'text', key: 'arg1', label: shape.label, placeholder: '>=0.9' });
      else if (shape.type === 'n')
        fields.push({ kind: 'text', key: 'arg1', label: shape.label, placeholder: '50' });
      else if (shape.type === 'id+range') {
        fields.push({ kind: 'text', key: 'arg1', label: shape.idLabel,    placeholder: ':id or #partial' });
        fields.push({ kind: 'text', key: 'arg2', label: shape.rangeLabel, placeholder: '>=1.0' });
      } else if (shape.type === 'xyz+id') {
        fields.push({ kind: 'text', key: 'arg1', label: 'X',              placeholder: '~ or ^1' });
        fields.push({ kind: 'text', key: 'arg2', label: 'Y',              placeholder: '~' });
        fields.push({ kind: 'text', key: 'arg3', label: 'Z',              placeholder: '~' });
        fields.push({ kind: 'text', key: 'arg4', label: 'Block/Entity ID',placeholder: ':diamond_block' });
      } else if (shape.type === 'dimension')
        fields.push({ kind: 'select', key: 'arg1', label: 'Dimension', options: ['overworld','the_nether','the_end'], default: 'overworld' });
      else if (shape.type === 'input')
        fields.push({ kind: 'select', key: 'arg1', label: 'Input', options: INPUT_OPTIONS, default: 'attack' });
      return fields;
    })
    .customLabel(d => d.selectedCondition ?? 'condition')
    .palette()
    .build(),

  // ---- Flow ----

  define('if', 'if')
    .description('Branch if condition is true')
    .category('flow')
    .in(f('in'), co('condition', 'condition'))
    .out(bd('then', 'then'), bd('else', 'else'))
    .customText(() => 'if')
    .palette()
    .build(),

  define('if_not', 'if_not  (!if)')
    .description('Branch if condition is false')
    .category('flow')
    .in(f('in'), co('condition', 'condition'))
    .out(bd('then', 'then'), bd('else', 'else'))
    .customText(() => '!if')
    .palette()
    .build(),

  define('while', 'while')
    .description('Loop while condition is true')
    .category('flow')
    .in(f('in'), co('condition', 'condition'))
    .out(bd('loop', 'loop'), f('exit', 'exit'))
    .cmd('while')
    .syntax(text('arg1', 'N delay (s)', '0.05'))
    .palette()
    .build(),

  define('while_not', 'while_not  (!while)')
    .description('Loop while condition is false')
    .category('flow')
    .in(f('in'), co('condition', 'condition'))
    .out(bd('loop', 'loop'), f('exit', 'exit'))
    .cmd('!while')
    .syntax(text('arg1', 'N delay (s)', '0.05'))
    .palette()
    .build(),

  define('loop', 'loop')
    .description('Repeat N times')
    .category('flow')
    .in(f('in'))
    .out(bd('body'), f('done'))
    .cmd('loop')
    .syntax(text('arg1', 'n (count)', 'n'))
    .palette()
    .build(),

  define('loop_period', 'loop_period')
    .description('Repeat N times with delay')
    .category('flow')
    .in(f('in'))
    .out(bd('body'), f('done'))
    .cmd('loop_period')
    .syntax(text('arg1', 'n (times)', 'n'), text('arg2', 'N (period s)', '1'))
    .palette()
    .build(),

  define('execute', 'execute')
    .description('Execute a script block')
    .category('flow')
    .in(f('in'))
    .out(bd('out'))
    .customText(() => 'execute')
    .palette()
    .build(),

  define('execute_random', 'execute_random')
    .description('Execute one random line from block')
    .category('flow')
    .in(f('in'))
    .out(bd('out'))
    .customText(() => 'execute_random')
    .palette()
    .build(),

  define('execute_period', 'execute_period')
    .description('Execute block with delay per line')
    .category('flow')
    .in(f('in'))
    .out(bd('out'))
    .cmd('execute_period')
    .syntax(text('arg1', 'N (seconds)', '0.25'))
    .palette()
    .build(),

  define('wait', 'wait')
    .description('Wait N seconds')
    .category('flow')
    .in(f('in'))
    .out(f('out'))
    .cmd('wait')
    .syntax(text('arg1', 'N (seconds)', '0.05'))
    .palette()
    .build(),

  define('wait_random', 'wait_random')
    .description('Wait random duration')
    .category('flow')
    .in(f('in'))
    .out(f('out'))
    .cmd('wait_random')
    .syntax(text('arg1', 'N (min)', '0.05'), text('arg2', 'N (max)', '0.15'))
    .palette()
    .build(),

  define('as', 'as')
    .description('Set reference entity')
    .category('flow')
    .in(f('in'))
    .out(f('out'))
    .cmd('as')
    .syntax(text('arg1', 'target', 'target_entity'), text('arg2', 'ID', '', true))
    .palette()
    .build(),

  define('function', 'function')
    .description('Call a defined function')
    .category('flow')
    .in(f('in'))
    .out(f('out'))
    .cmd('func')
    .syntax(text('arg1', 'function-name', 'myFunc'))
    .palette()
    .build(),

  define('def_func', 'def func')
    .description('Define a reusable function')
    .category('flow')
    .out(bd('body'))
    .cmd('def')
    .syntax(lit('func'), text('arg1', 'function-name', 'myFunc'))
    .palette()
    .build(),

  // ---- Client ----

  define('send', 'send')
    .description('Send message to client')
    .category('client')
    .in(f('in'))
    .cmd('send')
    .syntax(quoted('arg1', 'message', 'Hello World'))
    .palette()
    .build(),

  define('say', 'say')
    .description('Say in server chat')
    .category('client')
    .in(f('in'))
    .cmd('say')
    .syntax(quoted('arg1', 'message', 'Hello World'))
    .palette()
    .build(),

  define('print', 'print')
    .description('Print to console')
    .category('client')
    .in(f('in'))
    .cmd('print')
    .syntax(quoted('arg1', 'message', 'Hello World'))
    .palette()
    .build(),

  define('throw', 'throw')
    .description('Throw a script exception')
    .category('client')
    .in(f('in'))
    .cmd('throw')
    .syntax(quoted('arg1', 'message', 'error'))
    .palette()
    .build(),

  define('notify', 'notify')
    .description('On-screen notification')
    .category('client')
    .in(f('in'))
    .cmd('notify')
    .syntax(text('arg1', 'N (seconds)', '3'), quoted('arg2', 'message', 'notification'))
    .palette()
    .build(),

  define('playsound', 'playsound')
    .description('Play a sound')
    .category('client')
    .in(f('in'))
    .cmd('playsound')
    .syntax(text('arg1', 'ID', '#block.note_block.pling'), text('arg2', 'N (volume)', '1'), text('arg3', 'N (pitch)', '1'))
    .palette()
    .build(),

  define('module_enable', 'module enable')
    .description('Enable a module')
    .category('client')
    .in(f('in'))
    .cmd('module')
    .syntax(lit('enable'), text('arg1', 'module-id', 'module-id'))
    .palette()
    .build(),

  define('module_disable', 'module disable')
    .description('Disable a module')
    .category('client')
    .in(f('in'))
    .cmd('module')
    .syntax(lit('disable'), text('arg1', 'module-id', 'module-id'))
    .palette()
    .build(),

  define('module_create', 'module create')
    .description('Create a module')
    .category('client')
    .in(f('in'))
    .cmd('module')
    .syntax(lit('create'), text('arg1', 'module-id', 'module-id'))
    .palette()
    .build(),

  define('config_save', 'config save')
    .description('Save config')
    .category('client')
    .in(f('in'))
    .cmd('config')
    .syntax(lit('save'))
    .palette()
    .build(),

  define('config_load', 'config load')
    .description('Load config')
    .category('client')
    .in(f('in'))
    .cmd('config')
    .syntax(lit('load'))
    .palette()
    .build(),

  define('config_reload', 'config reload')
    .description('Reload config')
    .category('client')
    .in(f('in'))
    .cmd('config')
    .syntax(lit('reload'))
    .palette()
    .build(),

  define('exit', 'exit')
    .description('Exit the JVM')
    .category('client')
    .in(f('in'))
    .cmd('exit')
    .syntax(text('arg1', 'n (exit code)', '0'))
    .palette()
    .build(),

  // ---- Macro ----

  define('input', 'input')
    .description('Simulate a player input')
    .category('macro')
    .in(f('in'))
    .cmd('input')
    .syntax(text('arg1', 'input_name', 'attack'))
    .palette()
    .build(),

  define('hold_input', 'hold_input')
    .description('Hold player input for N seconds')
    .category('macro')
    .in(f('in'))
    .cmd('hold_input')
    .syntax(text('arg1', 'input_name', 'attack'), text('arg2', 'N (s) | cancel', '1.0'))
    .palette()
    .build(),

  define('switch', 'switch')
    .description('Hotkey to hotbar item')
    .category('macro')
    .in(f('in'))
    .cmd('switch')
    .syntax(text('arg1', 'ID | back', '#totem'))
    .palette()
    .build(),

  define('swap', 'swap')
    .description('Swap main/offhand')
    .category('macro')
    .in(f('in'))
    .customText(() => 'swap')
    .palette()
    .build(),

  define('drop', 'drop')
    .description('Drop from main hand')
    .category('macro')
    .in(f('in'))
    .cmd('drop')
    .syntax(text('arg1', 'N | all', 'all'))
    .palette()
    .build(),

  define('damage', 'damage')
    .description('Send attack packet')
    .category('macro')
    .in(f('in'))
    .cmd('damage')
    .syntax(text('arg1', 'target_type', 'nearest_entity'), text('arg2', 'ID', ':player'))
    .palette()
    .build(),

  define('turn_to', 'turn_to')
    .description('Slowly turn to target, then callback')
    .category('macro')
    .in(f('in'))
    .out(cb('then', 'then'))
    .cmd('turn_to')
    .syntax(text('arg1', 'target_type', 'nearest_entity'), text('arg2', 'ID', ':player'), lit('then'))
    .palette()
    .build(),

  define('snap_to', 'snap_to')
    .description('Snap to target, then callback')
    .category('macro')
    .in(f('in'))
    .out(cb('then', 'then'))
    .cmd('snap_to')
    .syntax(text('arg1', 'target_type', 'nearest_entity'), text('arg2', 'ID', ':player'), lit('then'))
    .palette()
    .build(),

  define('teleport', 'teleport')
    .description('Teleport packet')
    .category('macro')
    .in(f('in'))
    .cmd('teleport')
    .syntax(text('arg1', '~N', '~'), text('arg2', '~N', '~'), text('arg3', '~N', '~'))
    .palette()
    .build(),

  define('velocity', 'velocity')
    .description('Velocity packet')
    .category('macro')
    .in(f('in'))
    .cmd('velocity')
    .syntax(text('arg1', '~N', '~'), text('arg2', '~N', '~'), text('arg3', '~N', '~'))
    .palette()
    .build(),

  define('gui_drop', 'gui_drop')
    .description('Drop item in GUI')
    .category('macro')
    .in(f('in'))
    .cmd('gui_drop')
    .syntax(text('arg1', 'ID', ':item'), text('arg2', 'N | all', 'all'))
    .palette()
    .build(),

  define('gui_switch', 'gui_switch')
    .description('Hover item in GUI')
    .category('macro')
    .in(f('in'))
    .cmd('gui_switch')
    .syntax(text('arg1', 'ID', ':item'))
    .palette()
    .build(),

  define('gui_swap', 'gui_swap')
    .description('Swap item in GUI')
    .category('macro')
    .in(f('in'))
    .cmd('gui_swap')
    .syntax(text('arg1', 'ID', ':item'))
    .palette()
    .build(),

  define('gui_quickmove', 'gui_quickmove')
    .description('Quick-move item in GUI')
    .category('macro')
    .in(f('in'))
    .cmd('gui_quickmove')
    .syntax(text('arg1', 'ID', ':item'), text('arg2', 'n (slot)', '', true))
    .palette()
    .build(),

  // ---- Packet ----

  define('cancel_packet', 'cancel_packet')
    .description('Cancel next packet of type')
    .category('packet')
    .in(f('in'))
    .cmd('cancel_packet')
    .syntax(text('arg1', 'c2s | s2c', 'c2s'), text('arg2', 'packetName', 'playerMove'))
    .palette()
    .build(),

  define('uncancel_packet', 'uncancel_packet')
    .description('Remove packet from cancel queue')
    .category('packet')
    .in(f('in'))
    .cmd('uncancel_packet')
    .syntax(text('arg1', 'c2s | s2c', 'c2s'), text('arg2', 'packetName', 'playerMove'))
    .palette()
    .build(),
];

const _map = new Map<string, CompiledNodeDef>(NODE_REGISTRY.map(d => [d.command, d]));

export function getNodeDef(command: string): CompiledNodeDef {
  return _map.get(command) ?? {
    command,
    label:       command,
    description: 'Unrecognized command',
    category:    'unknown',
    argHints:    [],
    inputs:      [{ id: 'in', label: 'in', dataType: 'flow' }],
    outputs:     [],
    palette:     false,
    toText(data: any): string {
      return [command, data.arg1, data.arg2].filter(Boolean).join(' ');
    },
    fromArgs(args: string): Record<string, any> {
      const parts = args.trim().split(/\s+/).filter(Boolean);
      const result: Record<string, any> = {};
      if (parts[0]) result.arg1 = parts[0];
      if (parts[1]) result.arg2 = parts[1];
      if (parts[2]) result.arg3 = parts[2];
      if (parts[3]) result.arg4 = parts.slice(3).join(' ');
      return result;
    },
    getFields(_data: any): UIField[] { return []; },
    displayLabel(_data: any): string { return command; },
  };
}
