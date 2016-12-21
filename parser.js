// Tokens
Scope = function(memory, body) { this.memory = memory; this.body = body; };
FunctionDecl = function(name, type, params, value) { this.name = name; this.type = type; this.params = params; this.value = value; };
Param = function(type, name) { this.type = type; this.name = name; };
VarDecl = function(name, type, value) { this.name = name; this.type = type; this.value = value; };
VarRef = function(name) { this.name = name; };
Call = function(name, args) { this.name = name; this.args = args; };
Const = function(type, value) { this.type = type; this.value = value; };
Bop = function(bop, e1, e2) { this.bop = bop; this.e1 = e1; this.e2 = e2; };
Uop = function(uop, e1) { this.uop = uop; this.e1 = e1; };
Return = function(value) { this.value = value; };
If = function(cond, body) { this.cond = cond; this.body = body; };
While = function(cond, body) { this.cond = cond; this.body = body; };
// TODO(alex) replace with more generic 'fd' type
Print = function(text) { this.text = text; };

function ParseError(message) {
  this.name = 'ParseError';
  this.message = message || 'Parse error';
  this.stack = (new Error()).stack;
}
ParseError.prototype = Object.create(Error.prototype);
ParseError.prototype.constructor = ParseError;

// TODO(alex) use generator instead of array of tokens?
module.exports = function(tokens) {
  function peek(type) {
    if(!tokens.length) {
      throw new ParseError("Unexpected end of file");
    }
    else {
      return tokens[0].type == type;
    }
  }

  function pop(type) {
    if(peek(type)) {
      token = tokens[0];
      tokens = tokens.slice(1);
      return token;
    }
    return false;
  }

  function need(type, message) {
    var tok = pop(type);
    if(!tok) {
      throw new ParseError(message || `Expected type '${type}' but got '${tokens[0].type}' (${tokens[0].string})`);
    }
    return tok;
  }

  function parse_expr() {
    return plus();
  }

  function plus() {
    function plusses(acc) {
      if(pop("Plus")) {
        return plusses(new Bop("Plus", acc, mult()));
      }
      else if(pop("Minus")) {
        return plusses(new Bop("Minus", acc, mult()));
      }
      else {
        return acc;
      }
    }
    return plusses(mult());
  }

  function mult() {
    function mults(acc) {
      if(pop("Mul")) {
        return mults(new Bop("Mul", acc, atom()));
      }
      else if(pop("Div")) {
        return mults(new Bop("Div", acc, atom()));
      }
      else if(pop("Mod")) {
        return mults(new Bop("Mod", acc, atom()));
      }
      else {
        return acc;
      }
    }
    return mults(atom());
  }

  function atom() {
    var a;
    if(a = pop("Int")) {
      return new Const("Int", parseInt(a.string));
    }
    else if(a = pop("Ident")) {
      // Function
      if(peek("OParen")) {
        var pl = parse_list("OParen", "CParen", "Comma", parse_expr);
        return new Call(a.string, pl);
      }
      // Variable
      else {
        return new VarRef(a.string);
      }
    }
    else if(pop("OParen")) {
      var p = parse_expr();
      need("CParen");
      return p;
    }
    else {
      throw `Unexpected token of type '${tokens[0].type}' ('${tokens[0].string}')`;
    }
  }

  function parse_list(start, end, delim, get_element) {
    var list = [];
    need(start);
    if(!pop(end)) {
      do {
        list.push(get_element());
      } while(pop(delim));
      need(end);
    }
    return list;
  }

  function parse_scoped_section() {
    var body = [];
    need("OBrace");
    while(!pop("CBrace")) {
      // TODO(alex) allow for variable declarations
      if(pop("Return")) {
        body.push(new Return(parse_expr()));
      }
      else if(pop("If")) {
        require("OParen");
        var cond = parse_expr();
        require("CParen");
        var body = parse_scoped_section();
      }
      else {
        body.push(parse_expr());
      }
      need("Semi");
    }
    return new Scope({}, body);
  }

  function is_declared(name) {
    var n;
    return (n = globals[name]) && n.value;
  }

  // program body can only be function or variable declarations
  var globals = [];
  while(tokens.length) {
    if(pop("Semi")) continue;
    var tok = need("Type");
    var name = need("Ident").string;
    if(is_declared(name)) {
      throw "Redeclaration of " + name;
    }
    var typ = tok.string;

    // function declaration
    if(peek("OParen")) {
      var params = parse_list("OParen", "CParen", "Comma", () => new Param(need("Type").string, need("Ident").string));
      var body = pop("Semi") ? undefined : parse_scoped_section().body;
      globals.push(new FunctionDecl(name, typ, params, body));
    }
    // variable declaration
    else {
      need("Assign");
      var val = parse_expr();
      need("Semi");
      globals.push(new VarDecl(name, val.type, val.value));
    }
  }
  return globals;
}