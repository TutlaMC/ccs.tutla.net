export type Category = 'module' | 'event' | 'flow' | 'condition' | 'client' | 'macro' | 'packet' | 'unknown';

export const CATEGORY_COLORS: Record<Category, string> = {
  module:    '#ac8929',
  event:     '#5b8dd9',
  flow:      '#9d6fd4',
  condition: '#3bb8a0',
  client:    '#4caf7d',
  macro:     '#d45b5b',
  packet:    '#d4a45b',
  unknown:   '#555566',
};

export const CATEGORY_LABELS: Record<Category, string> = {
  module:    'MODULE',
  event:     'EVENT',
  flow:      'FLOW',
  condition: 'CONDITION',
  client:    'CLIENT',
  macro:     'MACRO',
  packet:    'PACKET',
  unknown:   'UNKNOWN',
};

export const CATEGORY_DESCRIPTIONS: Record<Category, string> = {
  module:    'Module definitions',
  event:     'Game event listeners',
  flow:      'Control flow',
  condition: 'Conditions for if / while',
  client:    'Client messages & module control',
  macro:     'Player input & movement',
  packet:    'Packet interception',
  unknown:   'Unknown command',
};

export type HandleDataType = 'flow' | 'event' | 'condition' | 'body' | 'callback';

export const HANDLE_TYPE_COLORS: Record<HandleDataType, string> = {
  flow:      '#aaaacc',
  event:     '#5b8dd9',
  condition: '#3bb8a0',
  body:      '#9d6fd4',
  callback:  '#d4a45b',
};

export interface PortDef {
  id: string;
  label: string;
  dataType: HandleDataType;
}

export interface NodeDefinition {
  command: string;
  label: string;
  description: string;
  category: Category;
  argHints: string[];
  inputs: PortDef[];
  outputs: PortDef[];
  palette?: boolean;
}

export const CCS_EVENTS = [
  'right_click','left_click','middle_click',
  'right_release','left_release','middle_release',
  'place_block','break_block','punch_block','interact_block',
  'tick','pre_tick','post_tick',
  'item_use','item_consume','totem_pop',
  'module_enable','module_disable',
  'move_pos','move_look',
  'key_press','key_release',
  'damage','respawn','death',
  'game_join','game_leave',
  'chat_send','chat_receive',
] as const;

export type CCSEvent = typeof CCS_EVENTS[number];

export const CCS_CONDITIONS = [
  'holding','off_holding','inventory_has','hotbar_has',
  'target_block','target_entity','targeting_entity','targeting_block',
  'input_active',
  'block_in_range','entity_in_range',
  'attack_progress','health','armor','hunger',
  'pos_x','pos_y','pos_z',
  'module_enabled','module_disabled',
  'block','entity','dimension',
  'effect_duration','effect_amplifier',
  'in_game','playing','in_singleplayer',
  'chance_of',
  'on_ground','on_fire','frozen','blocking','moving','jumping','dead',
  'colliding','colliding_horizontally','colliding_vertically',
  'has_equipment','hurt_time',
  'cursor_item','hovering_over',
  'reference_entity',
  'item_count','item_durability',
] as const;

export type CCSCondition = typeof CCS_CONDITIONS[number];

export type ConditionArgShape =
  | { type: 'none' }
  | { type: 'id'; label: string }
  | { type: 'id+range'; idLabel: string; rangeLabel: string }
  | { type: 'range'; label: string }
  | { type: 'n'; label: string }
  | { type: 'xyz+id' }
  | { type: 'dimension' }
  | { type: 'input' };

export const CONDITION_ARG_SHAPES: Record<CCSCondition, ConditionArgShape> = {
  holding:                { type: 'id', label: 'Item ID' },
  off_holding:            { type: 'id', label: 'Item ID' },
  inventory_has:          { type: 'id', label: 'Item ID' },
  hotbar_has:             { type: 'id', label: 'Item ID' },
  target_block:           { type: 'id', label: 'Block ID' },
  target_entity:          { type: 'id', label: 'Entity ID' },
  targeting_entity:       { type: 'none' },
  targeting_block:        { type: 'none' },
  input_active:           { type: 'input' },
  block_in_range:         { type: 'id+range', idLabel: 'Block ID', rangeLabel: 'Range' },
  entity_in_range:        { type: 'id+range', idLabel: 'Entity ID', rangeLabel: 'Range' },
  attack_progress:        { type: 'range', label: 'Progress (+N)' },
  health:                 { type: 'range', label: 'Health (+N)' },
  armor:                  { type: 'range', label: 'Armor (+N)' },
  hunger:                 { type: 'range', label: 'Hunger (+N)' },
  pos_x:                  { type: 'range', label: 'X (+N)' },
  pos_y:                  { type: 'range', label: 'Y (+N)' },
  pos_z:                  { type: 'range', label: 'Z (+N)' },
  module_enabled:         { type: 'id', label: 'Module ID' },
  module_disabled:        { type: 'id', label: 'Module ID' },
  block:                  { type: 'xyz+id' },
  entity:                 { type: 'xyz+id' },
  dimension:              { type: 'dimension' },
  effect_duration:        { type: 'id+range', idLabel: 'Effect ID', rangeLabel: 'Duration (+N)' },
  effect_amplifier:       { type: 'id+range', idLabel: 'Effect ID', rangeLabel: 'Amplifier (+N)' },
  in_game:                { type: 'none' },
  playing:                { type: 'none' },
  in_singleplayer:        { type: 'none' },
  chance_of:              { type: 'n', label: 'Chance %' },
  on_ground:              { type: 'none' },
  on_fire:                { type: 'none' },
  frozen:                 { type: 'none' },
  blocking:               { type: 'none' },
  moving:                 { type: 'none' },
  jumping:                { type: 'none' },
  dead:                   { type: 'none' },
  colliding:              { type: 'none' },
  colliding_horizontally: { type: 'none' },
  colliding_vertically:   { type: 'none' },
  has_equipment:          { type: 'id', label: 'Item ID' },
  hurt_time:              { type: 'range', label: 'Hurt time (+n)' },
  cursor_item:            { type: 'id', label: 'Item ID' },
  hovering_over:          { type: 'id', label: 'Item ID' },
  reference_entity:       { type: 'id', label: 'Entity ID(s)' },
  item_count:             { type: 'id+range', idLabel: 'Item ID', rangeLabel: 'Count (+N)' },
  item_durability:        { type: 'id+range', idLabel: 'Item ID', rangeLabel: 'Durability (+N)' },
};