class Position
  constructor: (@col, @row) ->
class TokenError extends Error
  constructor: -> super
class Symbol
  constructor: (@type, @pattern) ->
class Token
  constructor: (@type, @string, @position) ->

symbols = [
  # basics
  new Symbol("OParen", /^\(/),
  new Symbol("CParen", /^\)/),
  new Symbol("OBrace", /^{/),
  new Symbol("CBrace", /^}/),
  new Symbol("OBracket", /^\[/),
  new Symbol("CBracket", /^\]/),
  new Symbol("Semi", /^;/),
  new Symbol("Dot", /^\./),
  new Symbol("Comma", /^,/),
  new Symbol("Question",/^\?/),
  new Symbol("Colon",/^:/),

  # unary operators
  new Symbol("Inc", /^\+\+/),
  new Symbol("Dec", /^\-\-/),

  # binary operators
  new Symbol("Plus", /^\+/),
  new Symbol("Minus", /^\-/),
  new Symbol("Star", /^\*/),
  new Symbol("Div", /^\//),
  new Symbol("Mod", /^%/),

  # equality operators
  new Symbol("Eq", /^==/),
  new Symbol("Neq", /^!=/),
  new Symbol("Le", /^<=/),
  new Symbol("Ge", /^>=/),
  new Symbol("Lt", /^</),
  new Symbol("Gt", /^>/),

  # boolean operators
  new Symbol("DoubleAnd", /^&&/),
  new Symbol("DoubleOr", /^\|\|/),
  new Symbol("Not", /^!/),

  # bitwise operators
  new Symbol("SingleOr", /^\|/),
  new Symbol("SingleAnd", /^&/),
  new Symbol("Tilda", /^~/),

  # assignment
  new Symbol("Assign", /^=/),
  new Symbol("PlusAssign", /^\+=/),
  new Symbol("MinusAssign", /^\-=/),
  new Symbol("MultAssign", /^\*=/),
  new Symbol("DivAssign", /^\/=/),

  # keywords
  new Symbol("Return",/^return\b/),
  new Symbol("While",/^while\b/),
  new Symbol("For",/^for/),
  new Symbol("If",/^if\b/),
  new Symbol("Else",/^else\b/),
  new Symbol("Break",/^break\b/),

  # keyword types
  new Symbol("Type",/^(double|float|long double)\b/),
  new Symbol("Type",/^(int|long|short|long int|short int)\b/),
  new Symbol("Type",/^char\b/),
  new Symbol("Struct",/^struct\b/),

  # names
  new Symbol("Ident", /^[-a-zA-Z_][-a-zA-Z0-9_]*/),

  # literals
  new Symbol("LitStr", /^".*?"/),
  new Symbol("LitDouble", /^[0-9]*\.[0-9]+((e|E)-?[0-9]+)?/),
  new Symbol("LitInt", /^(0x)?[0-9]+/),

  # whitespace
  new Symbol("Whitespace", /^\s+/),
]

parseToken = (code, position) ->
  for symbol in symbols
    if m = code.match(symbol.pattern)
      return new Token(symbol.type, m[0], position)
  throw new TokenError("Unknown token", position)

tokenize = (code) ->
  tokens = []
  lines = code.split('\n')
  for line, i in lines
    col = 0
    while(col < line.length)
      token = parseToken(line.substring(col), new Position(i+1, col+1))
      if(token.type != "Whitespace")
        tokens.push(token)
      col += token.string.length
  return tokens

module.exports = {
  tokenize: tokenize
}
