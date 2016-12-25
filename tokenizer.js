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
  new Symbol("OParen", /^\(/),
  new Symbol("CParen", /^\)/),
  new Symbol("OBrace", /^{/),
  new Symbol("CBrace", /^}/),
  new Symbol("Plus", /^\+/),
  new Symbol("Minus", /^\-/),
  new Symbol("Star", /^\*/),
  new Symbol("Div", /^\//),
  new Symbol("Mod", /^%/),
  new Symbol("And", /^&/),
  new Symbol("Or", /^\|/),
  new Symbol("Semi", /^;/),
  new Symbol("Eq", /^==/),
  new Symbol("Neq", /^!=/),
  new Symbol("Le", /^<=/),
  new Symbol("Ge", /^>=/),
  new Symbol("Lt", /^</),
  new Symbol("Gt", /^>/),
  new Symbol("Assign", /^=/),
  new Symbol("Not", /^!/),
  new Symbol("Comma", /^,/),
  // names
  new Symbol("Ident", /^[-a-zA-Z_][-a-zA-Z0-9_]*/),
  // variables
  new Symbol("Int", /^[0-9]+/),
  new Symbol("Double", /^[0-9]*\.[0-9]+((e|E)-?[0-9]+)?/),
  // whitespace
  new Symbol("Whitespace", /^\s+/),
]

var types = ["int","float"];
function check_reserved(token) {
  if(token.type == "Ident") {
    for(var i = 0; i < types.length; i++) {
      if(token.string == types[i]) {
        token.type = "Type";
        break;
      }
    }
    if(token.string == "return") {
      token.type = "Return";
    }
    if(token.string == "while") {
      token.type = "While";
    }
  }
  return token;
}

function parse_token(code, position) {
  var m;
  for(var i = 0; i < symbols.length; i++) {
    if(m = code.match(symbols[i].pattern)) {
      var tok = new Token(symbols[i].type, m[0], position);
      return check_reserved(tok);
    }
  }
  throw new TokenError("Unknown token", position);
}

module.exports = function(code) {
  var tokens = [];
  var lines = code.split('\n');
  for(var i = 0; i < lines.length; i++) {
    if(!lines[i]) continue;
    var position = 0;
    var line = lines[i];
    do {
      var token = parse_token(line.substring(position), new Position(i+1, lines[i], position+1));
      if(token.type != "Whitespace") {
        tokens.push(token);
      }
      position += token.string.length;
    } while (position < line.length);
  }

  return tokens;
}
