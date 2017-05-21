const symbols = {
  // grouping symbols
  [TokenType.OParen]: new Symbol("opening parenthesis",  /^\(/),
  [TokenType.CParen]: new Symbol("closing parenthesis",  /^\)/),
  [TokenType.OBrace]: new Symbol("opening square brace",  /^{/),
  [TokenType.CBrace]: new Symbol("closing square brace",  /^}/),
  [TokenType.OBracket]: new Symbol("opening bracket",  /^\[/),
  [TokenType.CBracket]: new Symbol("closing bracket",  /^\]/),

  // punctuation
  [TokenType.Dot]: new Symbol("dot",  /^\./),
  [TokenType.Comma]: new Symbol("comma",  /^,/),
  [TokenType.QMark]: new Symbol("question mark", /^\?/),
  [TokenType.Colon]: new Symbol("colon", /^:/),
  [TokenType.Semicolon]: new Symbol("semicolon",  /^;/),

  // unary operators
  [TokenType.Inc]: new Symbol("increment",  /^\+\+/),
  [TokenType.Dec]: new Symbol("decrement",  /^\-\-/),

  // binary operators
  [TokenType.Plus]: new Symbol("plus sign",  /^\+/),
  [TokenType.Minus]: new Symbol("minus sign",  /^\-/),
  [TokenType.Star]: new Symbol("asterisk",  /^\*/),
  [TokenType.Div]: new Symbol("divison sign",  /^\//),
  [TokenType.Mod]: new Symbol("modulus sign",  /^%/),

  // equality operators
  [TokenType.Eq]: new Symbol("equality operator",  /^==/),
  [TokenType.Neq]: new Symbol("inequality operator",  /^!=/),
  [TokenType.Le]: new Symbol("less-than-or-equal-to operator",  /^<=/),
  [TokenType.Ge]: new Symbol("greater-than-or-equal-to operator",  /^>=/),
  [TokenType.Lt]: new Symbol("less-than operator",  /^</),
  [TokenType.Gt]: new Symbol("greater-than operator",  /^>/),

  // logical operators
  [TokenType.LogAnd]: new Symbol("logical and",  /^&&/),
  [TokenType.LogOr]: new Symbol("logical or",  /^\|\|/),
  [TokenType.LogNot]: new Symbol("logical not",  /^!/),

  // bitwise operators
  [TokenType.BitOr]: new Symbol("bitwise or",  /^\|/),
  [TokenType.BitAnd]: new Symbol("bitwise and",  /^&/),
  [TokenType.BitComp]: new Symbol("bitwise complement",  /^~/),

  // assignment
  [TokenType.Assign]: new Symbol("assign",  /^=/),
  [TokenType.AssignAdd]: new Symbol("and-and-assign",  /^\+=/),
  [TokenType.AssignSub]: new Symbol("subtract-and-assign",  /^\-=/),
  [TokenType.AssignMul]: new Symbol("multiply-and-assign",  /^\*=/),
  [TokenType.AssignDiv]: new Symbol("divide-and-assign",  /^\/=/),

  // keywords
  [TokenType.Return]: new Symbol("return", /^return\b/),
  [TokenType.While]: new Symbol("while", /^while\b/),
  [TokenType.For]: new Symbol("for", /^for/),
  [TokenType.If]: new Symbol("if", /^if\b/),
  [TokenType.Else]: new Symbol("else", /^else\b/),
  [TokenType.Break]: new Symbol("break", /^break\b/),
  [TokenType.Continue]: new Symbol("continue", /^continue\b/),

  // types
  [TokenType.Type]: new Symbol("decimal type", /^(double|float|long double)\b/),
  [TokenType.Type]: new Symbol("integer type", /^(int|long|short|long int|short int)\b/),
  [TokenType.Type]: new Symbol("character type", /^char\b/),
  [TokenType.Struct]: new Symbol("struct", /^struct\b/),

  // variables
  [TokenType.Var]: new Symbol("variable", /^[-a-zA-Z_][-a-zA-Z0-9_]*/),

  // literals
  [TokenType.LitStr]: new Symbol("string", /^".*?"/),
  [TokenType.LitDouble]: new Symbol("double", /^[0-9]*\.[0-9]+((e|E)-?[0-9]+)?/),
  [TokenType.LitInt]: new Symbol("integer", /^(0x)?[0-9]+/),

  // whitespace
  [TokenType.Whitespace]: new Symbol("whitespace", /^\s+/),
}
