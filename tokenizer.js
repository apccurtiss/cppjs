var Symbol = function(type, pattern) { this.type = type; this.pattern = pattern; }
var Token = function(type, string, line) { this.type = type; this.string = string; this.line = line; }

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
  }
  return token;
}

function parse_token(code) {
  var m;
  for(var i = 0; i < symbols.length; i++) {
    if(m = code.match(symbols[i].pattern)) {
      var curr_line = code.split('\n')[0];
      var tok = new Token(symbols[i].type, m[0], curr_line);
      return check_reserved(tok);
    }
  }
  throw "Unknown token: " + code;
}

module.exports = function(code) {
  var tokens = [];
  do {
    var token = parse_token(code);
    if(token.type != "Whitespace") {
      tokens.push(token);
    }
    code = code.substring(token.string.length);
  } while (code.length);

  return tokens;
}
