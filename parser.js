// logical line
const Line = function(start, end, ast) { this.start = start; this.end = end; this.ast = ast; };

// Tokens
FunctionDecl = function(name, type, params, value) { this.name = name; this.type = type; this.params = params; this.value = value; };
Param = function(type, name) { this.type = type; this.name = name; };
VarDecl = function(type, name, val) { this.name = name; this.val = val; };
VarRef = function(name) { this.name = name; };
Call = function(name, args) { this.name = name; this.args = args; };
Val = function(type, value) { this.type = type; this.value = value; };
Bop = function(bop, e1, e2) { this.bop = bop; this.e1 = e1; this.e2 = e2; };
Uop = function(uop, e1) { this.uop = uop; this.e1 = e1; };
Return = function(value) { this.value = value; };
If = function(cond, body) { this.cond = cond; this.body = body; };
While = function(cond, body) { this.cond = cond; this.body = body; };
// Jumps and Redirects are the same, only jumps are associated with some bit of code (if statement, goto) while redirects are not (end of for or while loop, etc)
Jump = function(line, cond) { this.line = line; this.cond = cond; };
Redirect = function(line, cond) { this.line = line; this.cond = cond; };
// TODO(alex) replace with more generic 'fd' type
Print = function(text) { this.text = text; };

function ParseError(message) {
  this.name = 'ParseError';
  this.stack = (new Error()).stack;
  this.message = message || 'Parse error';
}
ParseError.prototype = Object.create(Error.prototype);
ParseError.prototype.constructor = ParseError;

function positionToString(tok) {
  var str = "Line " + tok.position.lnum;
  str += ":\n" + tok.position.line;
  str += "\n" + Array(tok.position.index).join(" ");
  str += "^";
  return str;
}

// TODO(alex) use generator instead of array of tokens?
module.exports = function(tokens) {
  function nextToken() {
    if(!tokens.length) {
      throw new ParseError("Unexpected end of file");
    }
    return tokens[0];
  }

  function peek(type) {
      return nextToken().type == type;
  }

  function pop(type) {
    if(!type || peek(type)) {
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
      throw new ParseError((message || `Expected type '${type}' but got '${tokens[0].type}'`) + "\n" + positionToString(tokens[0]));
    }
    return tok;
  }

  function parseExpr() {
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
    if(a = pop("LitInt")) {
      return new Val("Int", parseInt(a.string));
    }
    else if(a = pop("Ident")) {
      // Function
      if(peek("OParen")) {
        var pl = parseList("OParen", "CParen", "Comma", parseExpr);
        return new Call(a.string, pl);
      }
      // Variable
      else {
        return new VarRef(a.string);
      }
    }
    else if(pop("OParen")) {
      var p = parseExpr();
      need("CParen");
      return p;
    }
    else {
      throw new ParseError(`Unexpected token of type '${tokens[0].type}'`, tokens[0].position);
    }
  }

  function parseList(start, end, delim, get_element) {
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

  function parseLogicalLine() {
    var start = nextToken().position.codeIndex;
    var ast;
    if(pop("Return")) {
      ast = new Return(parseExpr());
    }
    else if(peek("Type")) {
      var type = pop(type);
      var name = need("Ident").string;
      need("Assign");
      var val = parseExpr();
      ast = new VarDecl(type, name, val);
    }
    else {
      ast = parseExpr();
    }
    var end = need("Semi").position.codeIndex + 1;
    return new Line(start, end, ast);
  }

  function parseLogicalBlock(lineNum) {
    if(pop("If")) {
      need("OParen");
      var condStart = nextToken().position.codeIndex;
      var cond = parseExpr();
      var condEnd = need("CParen").position.codeIndex;
      var body = parseLogicalBlock();
      cond = new Line(condStart, condEnd, new Jump(lineNum + body.length + 1, cond));
      return [cond].concat(body);
    }
    else if(pop("For")) {
      need("OParen");
      // TODO(alex) clean up repetitive code (Izaak help plz)
      var start = nextToken().position.codeIndex;
      var expr = parseExpr();
      var end = need("Semi").position.codeIndex;
      var doFirst = new Line(start, end, expr);

      start = nextToken().position.codeIndex;
      expr = parseExpr();
      end = need("Semi").position.codeIndex;
      var cond = new Line(start, end, expr);

      start = nextToken().position.codeIndex;
      expr = parseExpr();
      end = need("CParen").position.codeIndex;
      var inc = new Line(start, end, expr);

      var body = parseLogicalBlock();

      cond.ast = new Jump(lineNum + body.length + 5, cond.ast);

      var loop = [doFirst];
      loop.push(cond);
      loop = loop.concat(body);
      loop.push(inc);
      loop.push(new Redirect(lineNum + 2));
      console.log("Loop:")
      console.log(loop);
      return loop;

    }
    else if(peek("OBrace")) {
      return parseScopedSection();
    }
    else {
      return [parseLogicalLine()];
    }
  }

  function parseScopedSection() {
    var body = [];
    need("OBrace");
    while(!pop("CBrace")) {
      var block = parseLogicalBlock(body.length);
      body = body.concat(block);
    }
    return body;
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
      var params = parseList("OParen", "CParen", "Comma", () => new Param(need("Type").string, need("Ident").string));
      var body = parseScopedSection();
      globals.push(new FunctionDecl(name, typ, params, body));
    }
    // variable declaration
    else {
      need("Assign");
      var val = parseExpr();
      need("Semi");
      globals.push(new VarDecl(name, new Val(val.type, val.value)));
    }
  }
  return globals;
}
