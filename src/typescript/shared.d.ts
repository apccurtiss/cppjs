export enum Tokens {
  // grouping symbols
  OParen, CParen, OBrace, CBrace, OBracket, CBracket,
  // punctuation
  Dot, Comma, QMark, Colon, Semicolon,
  // unary operators
  Inc, Dec,
  // arithmatic operators
  Plus, Minus, Star, Div, Mod,
  // comparison operators
  Eq, Neq, Lt, Gt, Le, Ge,
  // boolean operators
  LogAnd, LogOr, LogNot, BitOr, BitAnd, BitComp,
  // assignment operators
  Assign, AssignAdd, AssignSub, AssignMul, AssignDiv,
  // keywords
  Return, While, For, If, Else, Break, Continue, Struct,
  // variables
  Var, Type,
  // literals
  LitStr, LitDouble, LitInt,
  // whitespace
  Whitespace,
}

export enum Expressions {

}
