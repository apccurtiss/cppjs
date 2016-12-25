// Tokens
Scope = function(memory, body) { this.memory = memory; this.body = body; };
FunctionDecl = function(name, type, params, value) { this.name = name; this.type = type; this.params = params; this.value = value; };
Param = function(type, name) { this.type = type; this.name = name; };
VarDecl = function(name, val) { this.name = name; this.val = val; };
VarRef = function(name) { this.name = name; };
Call = function(name, args) { this.name = name; this.args = args; };
Val = function(type, value) { this.type = type; this.value = value; };
Bop = function(bop, e1, e2) { this.bop = bop; this.e1 = e1; this.e2 = e2; };
Uop = function(uop, e1) { this.uop = uop; this.e1 = e1; };
Return = function(value) { this.value = value; };
If = function(cond, body) { this.cond = cond; this.body = body; };
While = function(cond, body) { this.cond = cond; this.body = body; };
// TODO(alex) replace with more generic 'fd' type
Print = function(text) { this.text = text; };

function ParseError(message, position) {
  this.name = 'ParseError';
  this.message = message || 'Parse error';
  this.position = position;
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
      console.trace();
      throw new ParseError(message || `Expected type '${type}' but got '${tokens[0].type}'`, tokens[0].position);
    }
    return tok;
  }

  function parse_expr() {
    return level14();
  }

  // function names refer to levels of precedence, as in http://en.cppreference.com/w/c/language/operator_precedence
  function level14() {
    function helper(acc) {
      if(pop("Assign")) {
        return helper(new Bop("Assign", acc, level6()));
      }
      else {
        return acc;
      }
    }
    return helper(level6());
  }

  function level6() {
    function helper(acc) {
      var cmp;
      if(cmp = (pop("Eq") || pop("Neq") || pop("Lt") || pop("Gt") || pop("Le") || pop("Ge"))) {
        return helper(new Bop(cmp.type, acc, level4()));
      }
      else {
        return acc;
      }
    }
    return helper(level4());
  }

  function level4() {
    function helper(acc) {
      if(pop("Plus")) {
        return helper(new Bop("Plus", acc, level3()));
      }
      else if(pop("Minus")) {
        return helper(new Bop("Minus", acc, level3()));
      }
      else {
        return acc;
      }
    }
    return helper(level3());
  }

  function level3() {
    function helper(acc) {
      if(pop("Star")) {
        return helper(new Bop("Mul", acc, level2()));
      }
      else if(pop("Div")) {
        return helper(new Bop("Div", acc, level2()));
      }
      else if(pop("Mod")) {
        return helper(new Bop("Mod", acc, level2()));
      }
      else {
        return acc;
      }
    }
    return helper(level2());
  }

  function level2() {
    function helper() {
      if(pop("Star")) {
        return new Uop("Deref", helper());
      }
      else if(pop("And")) {
        return new Uop("Addr", helper());
      }
      else {
        return atom();
      }
    }
    return helper();
  }

  function atom() {
    var a;
    if(a = pop("Int")) {
      return new Val("Int", parseInt(a.string));
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
      throw new ParseError(`Unexpected token of type '${tokens[0].type}'`, tokens[0].position);
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
      var type;
      if(pop("Return")) {
        body.push(new Return(parse_expr()));
        need("Semi");
      }
      else if(type = pop("Type")) {
        var name = need("Ident").string;
        need("Assign");
        var val = parse_expr();
        body.push(new VarDecl(name, val));
        need("Semi");
      }
      else if(pop("If")) {
        need("OParen");
        var cond = parse_expr();
        need("CParen");
        var b = parse_scoped_section();
      }
      else if(pop("While")) {
        need("OParen");
        var cond = parse_expr();
        need("CParen");
        var b = parse_scoped_section();
      }
      else {
        body.push(parse_expr());
        need("Semi");
      }
    }
    return new Scope({}, body);
  }


  // program body can only be function or variable declarations
  var globals = [];
  while(tokens.length) {
    if(pop("Semi")) continue;
    var tok = need("Type");
    var name = need("Ident").string;
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
      globals.push(new VarDecl(name, new Val(val.type, val.value)));
    }
  }
  return globals;
}
