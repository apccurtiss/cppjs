function Position(lnum, line, lineIndex, codeIndex) {
  this.lnum = lnum;
  this.line = line;
  this.lineIndex = lineIndex;
  this.codeIndex = codeIndex;
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
  new Symbol("OBracket", /^\[/),
  new Symbol("CBracket", /^\]/),
  new Symbol("Semi", /^;/),
  new Symbol("Dot", /^\./),
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
  new Symbol("DoubleAnd", /^&&/),
  new Symbol("DoubleOr", /^\|\|/),
  new Symbol("Not", /^!/),

  // bitwise operators
  new Symbol("SingleOr", /^\|/),
  new Symbol("SingleAnd", /^&/),
  new Symbol("Tilda", /^~/),

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
  new Symbol("Type",/^(double|float|long double)\b/),
  new Symbol("Type",/^(int|long|short|long int|short int)\b/),
  new Symbol("Type",/^char\b/),
  new Symbol("Struct",/^struct\b/),

  // names
  new Symbol("Ident", /^[-a-zA-Z_][-a-zA-Z0-9_]*/),

  // literals
  new Symbol("LitStr", /^".*?"/),
  new Symbol("LitDouble", /^[0-9]*\.[0-9]+((e|E)-?[0-9]+)?/),
  new Symbol("LitInt", /^(0x)?[0-9]+/),

  // whitespace
  new Symbol("Whitespace", /^\s+/),
]

function parseToken(code, position) {
  var m;
  for(var i = 0; i < symbols.length; i++) {
    if(m = code.match(symbols[i].pattern)) {
      return new Token(symbols[i].type, m[0], position);
    }
  }
  throw new TokenError("Unknown token", position);
}

function tokenize(code) {
  var tokens = [];
  var lines = code.split('\n');
  var index = 0;
  for(var i = 0; i < lines.length; i++) {
    if(!lines[i]) continue;
    var position = 0;
    var line = lines[i];
    do {
      var token = parseToken(line.substring(position), new Position(i+1, line, position+1, index+1));
      if(token.type != "Whitespace") {
        tokens.push(token);
      }
      index += token.string.length;
      position += token.string.length;
    } while (position < line.length);
    index++;
  }
  return tokens;
}

module.exports = tokenize;
