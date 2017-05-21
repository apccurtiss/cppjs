import { Tokens as TokenTypes, TextPosition, CompilerError } from "./shared";

class ParseError extends CompilerError {}

class Symbol {
  constructor(public type: TokenTypes, public pattern: RegExp) {}
}

export class Token {
  constructor(public type: TokenTypes, public value: string, public position: TextPosition) {}
}

const symbols: Symbol[] = [
  // grouping symbols
  new Symbol(TokenTypes.OParen, /^\(/),
  new Symbol(TokenTypes.CParen, /^\)/),
  new Symbol(TokenTypes.OBrace, /^{/),
  new Symbol(TokenTypes.CBrace, /^}/),
  new Symbol(TokenTypes.OBracket, /^\[/),
  new Symbol(TokenTypes.CBracket, /^\]/),

  // punctuation
  new Symbol(TokenTypes.Dot, /^\./),
  new Symbol(TokenTypes.Comma, /^,/),
  new Symbol(TokenTypes.QMark,/^\?/),
  new Symbol(TokenTypes.Colon,/^:/),
  new Symbol(TokenTypes.Semicolon, /^;/),

  // unary operators
  new Symbol(TokenTypes.Inc, /^\+\+/),
  new Symbol(TokenTypes.Dec, /^\-\-/),

  // binary operators
  new Symbol(TokenTypes.Plus, /^\+/),
  new Symbol(TokenTypes.Minus, /^\-/),
  new Symbol(TokenTypes.Star, /^\*/),
  new Symbol(TokenTypes.Div, /^\//),
  new Symbol(TokenTypes.Mod, /^%/),

  // equality operators
  new Symbol(TokenTypes.Eq, /^==/),
  new Symbol(TokenTypes.Neq, /^!=/),
  new Symbol(TokenTypes.Le, /^<=/),
  new Symbol(TokenTypes.Ge, /^>=/),
  new Symbol(TokenTypes.Lt, /^</),
  new Symbol(TokenTypes.Gt, /^>/),

  // logical operators
  new Symbol(TokenTypes.LogAnd, /^&&/),
  new Symbol(TokenTypes.LogOr, /^\|\|/),
  new Symbol(TokenTypes.LogNot, /^!/),

  // bitwise operators
  new Symbol(TokenTypes.BitOr, /^\|/),
  new Symbol(TokenTypes.BitAnd, /^&/),
  new Symbol(TokenTypes.BitComp, /^~/),

  // assignment
  new Symbol(TokenTypes.Assign, /^=/),
  new Symbol(TokenTypes.AssignAdd, /^\+=/),
  new Symbol(TokenTypes.AssignSub, /^\-=/),
  new Symbol(TokenTypes.AssignMul, /^\*=/),
  new Symbol(TokenTypes.AssignDiv, /^\/=/),

  // keywords
  new Symbol(TokenTypes.Return,/^return\b/),
  new Symbol(TokenTypes.While,/^while\b/),
  new Symbol(TokenTypes.For,/^for/),
  new Symbol(TokenTypes.If,/^if\b/),
  new Symbol(TokenTypes.Else,/^else\b/),
  new Symbol(TokenTypes.Break,/^break\b/),
  new Symbol(TokenTypes.Continue,/^continue\b/),

  // types
  new Symbol(TokenTypes.Type,/^(double|float|long double)\b/),
  new Symbol(TokenTypes.Type,/^(int|long|short|long int|short int)\b/),
  new Symbol(TokenTypes.Type,/^char\b/),
  new Symbol(TokenTypes.Struct,/^struct\b/),

  // variables
  new Symbol(TokenTypes.Var, /^[-a-zA-Z_][-a-zA-Z0-9_]*/),

  // literals
  new Symbol(TokenTypes.LitStr, /^".*?"/),
  new Symbol(TokenTypes.LitDouble, /^[0-9]*\.[0-9]+((e|E)-?[0-9]+)?/),
  new Symbol(TokenTypes.LitInt, /^(0x)?[0-9]+\b/),

  // whitespace
  new Symbol(TokenTypes.Whitespace, /^\s+/),
]

function parseToken(s: string, p: TextPosition): Token {
  for (let symbol of symbols) {
    let m = s.match(symbol.pattern);
    if(m) {
      return new Token(symbol.type, m[0], { row: p.row, col: p.col });
    }
  }
  throw new ParseError('Unknown token', p);
}

function tokenizeLine(line: string, row: number): Token[] {
  let tokens: Token[] = [];
  let position: TextPosition = { row: row, col: 0 };
  while(position.col < line.length) {
    let token = parseToken(line.slice(position.col), position);
    position.col += token.value.length;
    if (token.type != TokenTypes.Whitespace) {
      tokens.push(token);
    }
  }
  return tokens;
}

export function getTokStream(code: string): () => Token {
  let p: TextPosition = { row: 0, col: 0 };
  return () => {
    let tok = parseToken(code, p);
    code = code.slice(tok.value.length);
    p.col += tok.value.length;
    return tok;
  }
}

export function tokenize(code: string): Token[] {
  let lines = code.split('\n');
  let tokens: Token[] = [];
  for (let row = 0; row < lines.length; row++) {
    tokens = tokens.concat(tokenizeLine(lines[row], row))
  }
  return tokens;
}
