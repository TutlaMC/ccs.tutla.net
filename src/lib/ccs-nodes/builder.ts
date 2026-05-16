import type { PortDef, Category } from './types';

// ---- Syntax token types ----

export type LiteralToken = { kind: 'literal'; value: string };
export type TextField    = { kind: 'text';    key: string; label: string; default: string; optional?: boolean };
export type QuotedField  = { kind: 'quoted';  key: string; label: string; default: string };
export type SelectField  = { kind: 'select';  key: string; label: string; options: readonly string[]; default: string; clearOnChange?: string[] };
export type WhenBlock    = { kind: 'when';    key: string; values: string[]; tokens: SyntaxToken[] };
export type SyntaxToken  = LiteralToken | TextField | QuotedField | SelectField | WhenBlock;

// ---- Token factory functions ----

export const lit    = (value: string): LiteralToken => ({ kind: 'literal', value });
export const text   = (key: string, label: string, def = '', optional?: boolean): TextField =>
  ({ kind: 'text', key, label, default: def, ...(optional ? { optional } : {}) });
export const quoted = (key: string, label: string, def = ''): QuotedField =>
  ({ kind: 'quoted', key, label, default: def });
export const sel    = (key: string, label: string, options: readonly string[], def: string, clearOnChange?: string[]): SelectField =>
  ({ kind: 'select', key, label, options, default: def, ...(clearOnChange ? { clearOnChange } : {}) });
export const when   = (key: string, values: string[], ...tokens: SyntaxToken[]): WhenBlock =>
  ({ kind: 'when', key, values, tokens });

// ---- UI field types (for rendering in CommandNode) ----

export type UITextField   = { kind: 'text';   key: string; label: string; placeholder: string };
export type UISelectField = { kind: 'select'; key: string; label: string; options: readonly string[]; default: string; clearOnChange?: string[] };
export type UIField       = UITextField | UISelectField;

// ---- Compiled node definition ----

export interface CompiledNodeDef {
  command:     string;
  label:       string;
  description: string;
  category:    Category;
  argHints:    string[];   // kept for NodePalette badge display
  inputs:      PortDef[];
  outputs:     PortDef[];
  palette:     boolean;
  toText(data: any): string;
  fromArgs(args: string): Record<string, any>;
  getFields(data: any): UIField[];
  displayLabel(data: any): string;
}

// ---- Builder ----

export class CCSNodeBuilder {
  private _cmd    = '';
  private _label  = '';
  private _desc   = '';
  private _cat: Category = 'unknown';
  private _inputs:  PortDef[] = [];
  private _outputs: PortDef[] = [];
  private _palette  = false;
  private _cmdText  = '';
  private _syntax:  SyntaxToken[] = [];
  private _hints?:  string[];
  private _textFn?:   (data: any) => string;
  private _fieldsFn?: (data: any) => UIField[];
  private _labelFn?:  (data: any) => string;

  constructor(cmd: string, label: string) {
    this._cmd     = cmd;
    this._label   = label;
    this._cmdText = cmd;
  }

  description(d: string): this          { this._desc    = d; return this; }
  category(c: Category): this           { this._cat     = c; return this; }
  in(...ports: PortDef[]): this          { this._inputs  = ports; return this; }
  out(...ports: PortDef[]): this         { this._outputs = ports; return this; }
  palette(): this                        { this._palette = true; return this; }
  cmd(t: string): this                   { this._cmdText = t; return this; }
  syntax(...tokens: SyntaxToken[]): this { this._syntax  = tokens; return this; }
  hints(...h: string[]): this            { this._hints   = h; return this; }

  customText(fn: (data: any) => string): this      { this._textFn   = fn; return this; }
  customFields(fn: (data: any) => UIField[]): this { this._fieldsFn = fn; return this; }
  customLabel(fn: (data: any) => string): this     { this._labelFn  = fn; return this; }

  build(): CompiledNodeDef {
    const command  = this._cmd;
    const label    = this._label;
    const cmdText  = this._cmdText;
    const syntax   = this._syntax;
    const textFn   = this._textFn;
    const fieldsFn = this._fieldsFn;
    const labelFn  = this._labelFn;
    const argHints = this._hints ?? (textFn ? [] : tokensToHints(syntax));

    return {
      command,
      label,
      description: this._desc,
      category:    this._cat,
      argHints,
      inputs:      this._inputs,
      outputs:     this._outputs,
      palette:     this._palette,

      toText(data: any): string {
        if (textFn) return textFn(data);
        const args = tokensToStr(syntax, data);
        return args ? `${cmdText} ${args}` : cmdText;
      },

      fromArgs(args: string): Record<string, any> {
        const result: Record<string, any> = {};
        parseTokens(syntax, args.trim(), result);
        return result;
      },

      getFields(data: any): UIField[] {
        if (fieldsFn) return fieldsFn(data);
        return tokensToFields(syntax, data);
      },

      displayLabel(data: any): string {
        if (labelFn) return labelFn(data);
        return label;
      },
    };
  }
}

export const define = (cmd: string, label: string) => new CCSNodeBuilder(cmd, label);

// ---- Token → string generation ----

function tokensToStr(tokens: SyntaxToken[], data: any): string {
  const parts: string[] = [];
  for (const tok of tokens) {
    switch (tok.kind) {
      case 'literal':
        parts.push(tok.value);
        break;
      case 'text': {
        const val = (data[tok.key] as string) || '';
        if (val) parts.push(val);
        else if (!tok.optional) parts.push(tok.default);
        break;
      }
      case 'quoted': {
        const val = (data[tok.key] as string) || tok.default;
        parts.push(`"${val}"`);
        break;
      }
      case 'select': {
        const val = (data[tok.key] as string) || tok.default;
        parts.push(val);
        break;
      }
      case 'when': {
        const keyVal = data[tok.key] as string;
        if (tok.values.includes(keyVal)) {
          const sub = tokensToStr(tok.tokens, data);
          if (sub) parts.push(sub);
        }
        break;
      }
    }
  }
  return parts.join(' ');
}

// ---- Args string → data parsing ----

function parseTokens(tokens: SyntaxToken[], str: string, result: Record<string, any>): void {
  let i = 0;

  function skipWS() {
    while (i < str.length && (str[i] === ' ' || str[i] === '\t')) i++;
  }

  function readWord(): string {
    skipWS();
    if (i >= str.length) return '';
    const start = i;
    while (i < str.length && str[i] !== ' ' && str[i] !== '\t') i++;
    return str.slice(start, i);
  }

  function readQuoted(): string {
    skipWS();
    if (i >= str.length) return '';
    if (str[i] !== '"') return readWord();
    i++;
    const start = i;
    while (i < str.length && str[i] !== '"') i++;
    const val = str.slice(start, i);
    if (i < str.length) i++;
    return val;
  }

  function process(toks: SyntaxToken[]): void {
    for (const tok of toks) {
      skipWS();
      switch (tok.kind) {
        case 'literal':
          if (i < str.length) readWord();
          break;
        case 'text':
          if (i < str.length) result[tok.key] = readWord();
          break;
        case 'quoted':
          if (i < str.length) result[tok.key] = readQuoted();
          break;
        case 'select':
          if (i < str.length) result[tok.key] = readWord();
          break;
        case 'when': {
          const keyVal = result[tok.key];
          if (tok.values.includes(keyVal)) process(tok.tokens);
          break;
        }
      }
    }
  }

  process(tokens);
}

// ---- Token → UI fields ----

function tokensToFields(tokens: SyntaxToken[], data: any): UIField[] {
  const fields: UIField[] = [];
  for (const tok of tokens) {
    switch (tok.kind) {
      case 'literal':
        break;
      case 'text':
        fields.push({ kind: 'text', key: tok.key, label: tok.label, placeholder: tok.default || tok.label });
        break;
      case 'quoted':
        fields.push({ kind: 'text', key: tok.key, label: tok.label, placeholder: tok.default || tok.label });
        break;
      case 'select':
        fields.push({ kind: 'select', key: tok.key, label: tok.label, options: tok.options, default: tok.default, clearOnChange: tok.clearOnChange });
        break;
      case 'when': {
        const keyVal = data[tok.key] as string;
        if (tok.values.includes(keyVal)) {
          fields.push(...tokensToFields(tok.tokens, data));
        }
        break;
      }
    }
  }
  return fields;
}

// ---- Token → palette hint strings ----

function tokensToHints(tokens: SyntaxToken[]): string[] {
  const hints: string[] = [];
  for (const tok of tokens) {
    if (tok.kind === 'text')   hints.push(tok.label);
    if (tok.kind === 'quoted') hints.push(`"${tok.label}"`);
    if (tok.kind === 'select') hints.push(tok.label);
    // when and literal tokens don't contribute to hints
  }
  return hints;
}
