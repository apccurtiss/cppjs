function Position(lnum, line, index) {
  this.lnum = lnum;
  this.line = line;
  this.index = index;
}

function TokenError(message, position) {
  this.name = 'TokenError';
  this.message = message || 'Token error';
  this.position = position;
  this.stack = (new Error()).stack;
}

TokenError.prototype = Object.create(Error.prototype);
TokenError.prototype.constructor = TokenError;

var Symbol = function(type, pattern) { this.type = type; this.pattern = pattern; }
var Token = function(type, string, position) { this.type = type; this.string = string; this.position = position; }

var symbols = [
  // basics
  new Symbol("OParen", /^\(/),
  new Symbol("CParen", /^\)/),
  new Symbol("OBrace", /^{/),
  new Symbol("CBrace", /^}/),
  new Symbol("Semi", /^;/),
  new Symbol("Comma", /^,/),
  new Symbol("Question",/^\?/),
  new Symbol("Colon",/^:/),

  // unary operators
  new Symbol("Inc", /^\+\+/),
  new Symbol("Dec", /^\-\-/),

  // binary operators
  new Symbol("Plus", /^\+/),
  new Symbol("Minus", /^\-/),
  new Symbol("Star", /^\*/),
  new Symbol("Div", /^\//),
  new Symbol("Mod", /^%/),

  // equality operators
  new Symbol("Eq", /^==/),
  new Symbol("Neq", /^!=/),
  new Symbol("Le", /^<=/),
  new Symbol("Ge", /^>=/),
  new Symbol("Lt", /^</),
  new Symbol("Gt", /^>/),

  // boolean operators
  new Symbol("And", /^&&/),
  new Symbol("Or", /^\|\|/),
  new Symbol("Not", /^!/),

  // bitwise operators
  new Symbol("BitOr", /^\|/),
  new Symbol("BitAnd", /^&/),
  new Symbol("BitNot", /^~/),

  // assignment
  new Symbol("Assign", /^=/),
  new Symbol("PlusAssign", /^\+=/),
  new Symbol("MinusAssign", /^\-=/),
  new Symbol("MultAssign", /^\*=/),
  new Symbol("DivAssign", /^\/=/),

  // keywords
  new Symbol("Return",/^return\b/),
  new Symbol("While",/^while\b/),
  new Symbol("For",/^for/),
  new Symbol("If",/^if\b/),
  new Symbol("Else",/^else\b/),
  new Symbol("Break",/^break\b/),

  // keyword types
  new Symbol("TypDouble",/^(double|float|long double)\b/),
  new Symbol("TypInt",/^(int|long|short|long int|short int)\b/),

  // names
  new Symbol("Ident", /^[-a-zA-Z_][-a-zA-Z0-9_]*/),

  // literals
  new Symbol("LitDouble", /^[0-9]*\.[0-9]+((e|E)-?[0-9]+)?/),
  new Symbol("LitInt", /^(0x)?[0-9]+/),

  // whitespace
  new Symbol("Whitespace", /^\s+/),
]

function parse_token(code, position) {
  var m;
  for(var i = 0; i < symbols.length; i++) {
    if(m = code.match(symbols[i].pattern)) {
      return new Token(symbols[i].type, m[0], position);
    }
  }
  throw new TokenError("Unknown token", position);
}

function parse(code) {
  var tokens = [];
  var lines = code.split('\n');
  for(var i = 0; i < lines.length; i++) {
    if(!lines[i]) continue;
    var position = 0;
    var line = lines[i];
    do {
      var token = parse_token(line.substring(position), new Position(i+1, line, position+1));
      if(token.type != "Whitespace") {
        tokens.push(token);
      }
      position += token.string.length;
    } while (position < line.length);
  }
  return tokens;
}

module.exports = parse
