var typeSizes = {
  "int": 8,
  "float": 8,
  "char": 1,
};

function sizeof(t) {
  if(t instanceof Arr) {
    return sizeof(t.type) * t.size;
  }
  else if(t instanceof Ptr) {
    return 8;
  }
  else {
    return typeSizes[t];
  }
}

// logical line
const Line = function(ast, start, end) { this.ast = ast; this.start = start; this.end = end; };

// Tokens
Frame = function() {
  this.size = 0;
  this.vars = [];
  MemoryCell = function(type, name, offset) { this.type = type; this.name = name; this.offset = offset; };
  this.push = function(type, name) {
    var v = new MemoryCell(type, name, this.size);
    this.vars.push(v);
    this.size += sizeof(type);
    return v;
  }
}

Scope = function() {
  var typedefs = {};
  var objectDefinitions = {};
  var vars = {};
  this.get = function() { return vars; };
  this.insertVar = function(name, loc) {
    vars[name] = loc;
  }
  this.insertObjDef = function(name, obj) {
    objectDefinitions[name] = obj;
  }
  this.lookupVar = function(ident) {
    var loc = vars[ident.string];
    if(loc == undefined) {
      throw new ParseError(`Variable ${ident.string} not declared before this point:\n${positionToString(ident.position)}`);
    }
    return new Var(ident.string, loc);
  }
  this.lookupObjDef = function(name, obj) {
    var obj = objectDefinitions[ident.string];
    if(!obj) {
      throw new ParseError(`"${ident.string}" not defined before this point:\n${positionToString(ident.position)}`);
    }
    return obj;
  }
  this.clone = function() {
    var clone = new Scope();
    for(element in vars) {
      clone.insertVar(element, vars[element]);
    }
    return clone;
  }
}
CObject = function(name, frame) { this.name = name; this.frame = frame; };
CFunction = function(type, params, body, frame) { this.type = type; this.params = params; this.body = body; this.frame = frame; };
Param = function(type, name) { this.type = type; this.name = name; };
Struct = function(size, members) { this.size = size; this.members = members; };
VarDecl = function(type, name, position, val) { this.type = type; this.name = name; this.position = position; this.val = val; };
FuncDecl = function(type, name, params, body) { this.name = name; this.val = val; };
Var = function(name, offset) { this.name = name; this.offset = offset; };
Call = function(name, args) { this.name = name; this.args = args; };
Val = function(type, value) { this.type = type; this.value = value; };
Bop = function(bop, e1, e2) { this.bop = bop; this.e1 = e1; this.e2 = e2; };
Uop = function(uop, e1) { this.uop = uop; this.e1 = e1; };
Arr = function(type, size) { this.type = type; this.size = size; };
Ptr = function(type) { this.type = type; };
Return = function(value) { this.value = value; };
// Jumps and Redirects are the same, only jumps are associated with some bit of code (if statement, goto) while redirects are not (end of for or while loop, etc)
Jump = function(distance, cond) { this.distance = distance; this.cond = cond; };
Redirect = function(distance, cond) { this.distance = distance; this.cond = cond; };
// TODO(alex) replace with more generic 'fd' type
Print = function(text) { this.text = text; };

function ParseError(message, position) {
  this.name = 'ParseError';
  this.stack = (new Error()).stack;
  this.message = message || 'Parse error';
}
ParseError.prototype = Object.create(Error.prototype);
ParseError.prototype.constructor = ParseError;

// prints a position in an easy-to-read manner for error reporting
function positionToString(position) {
  var str = `Line ${position.lnum}:\n`;
  str += position.line + "\n";
  str += Array(position.lineIndex).join(" ") + "^";
  return str;
}

module.exports = function(tokens) {
  var scopes = [new Scope()];
  var globals = new Frame;
  var currentFrame;
  var functions = {};
  var currentToken = 0;
  function pushScope() {
    scopes.push(scopes[scopes.length-1].clone());
  }
  function popScope() {
    scopes.pop();
  }
  function varLookup(ident) {
    for(var i = scopes.length-1; i >= 0; i--) {
      try {
        return scopes[i].lookupVar(ident);
      }
      catch(err) {
        console.log("Got error: " + err.message);
        continue;
      };
    }
    throw new ParseError(`Variable ${ident.string} not declared before this point:\n${positionToString(ident.position)}`);
  }
  function varInsert(name, position) {
    scopes[scopes.length-1].insertVar(name, position);
  }
  function objInsert(name, members) {
    scopes[scopes.length-1].insertObjDef(name, members);
  }

  function nextToken() {
    if(currentToken == tokens.length) {
      throw new ParseError("Unexpected end of file");
    }
    return tokens[currentToken];
  }

  function peek(type) {
    return nextToken().type == type;
  }

  function pop(type) {
    if(!type || peek(type)) {
      currentToken++;
      return tokens[currentToken - 1];
    }
    return false;
  }

  function need(type, message) {
    var tok = pop(type);
    if(!tok) {
      throw new ParseError((message || `Expected type '${type}' but got '${nextToken().type}'`) + "\n" + positionToString(nextToken().position));
    }
    return tok;
  }

  function tryToParse(parseFunction) {
    var startToken = currentToken;
    try {
      return parseFunction();
    }
    catch(err) {
      currentToken = startToken;
      return false;
    }
  }

  function peekPattern() {
    var startToken = currentToken;
    try {
      for (var i = 0; i < arguments.length; i++) {
        if(arguments[i] instanceof Function) {
          arguments[i]();
        }
        else {
          need(arguments[i]);
        }
      }
    }
    catch(err) {
      currentToken = startToken;
      return false;
    }
    currentToken = startToken;
    return true;
  }

  function needPattern() {
    var results = [];
    for (var i = 0; i < arguments.length; i++) {
      if(arguments[i] instanceof Function) {
        // use function to parse token stream
        results.push(arguments[i]());
      }
      else {
        need(arguments[i]);
      }
    }
    return results;
  }

  function parseList(start, end, delim, parseFunction) {
    var list = [];
    need(start);
    if(!pop(end)) {
      do {
        list.push(parseFunction());
      } while(pop(delim));
      need(end);
    }
    return list;
  }

  function parseExpr() {
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
          return varLookup(a);
        }
      }
      else if(pop("OParen")) {
        var p = parseExpr();
        need("CParen");
        return p;
      }
      else {
        console.log(nextToken().position);
        throw new ParseError(`Unexpected token of type '${nextToken().type}':\n${positionToString(nextToken().position)}`);
      }
    }

    return level14();
  }

  function positionOf(parseFunction) {
    var start = nextToken().position.codeIndex;
    var ast = parseFunction();
    var end = nextToken().position.codeIndex;
    return new Line(ast, start, end);
  }

  function parseLogicalLine() {
    var ret = positionOf(() => {
      var ast;
      // return statement
      if(pop("Return")) {
        ast = [new Return(parseExpr())];
        need("Semi", "A line should have ended with a semicolon before this point");
      }
      // variable declaration
      else if(peek("Type")) {
        ast = parseVarDecls();
      }
      // normal expression
      else {
        ast = [parseExpr()];
        need("Semi", "A line should have ended with a semicolon before this point");
      }
      return ast;
    });
    return ret;
  }

  function parseLogicalBlock() {
    function expression() {
      return positionOf(parseExpr);
    }
    if(pop("If")) {
      var cond = needPattern("OParen", expression, "CParen");
      var body = parseLogicalBlock();
      // modify the condition to jump to end of the body if it's not met
      cond.ast = new Jump(body.length + 1, new Uop("Not", cond.ast));
      return [cond].concat(body);
    }
    else if(pop("For")) {
      var header = needPattern("OParen", expression, "Semi", expression, "Semi", expression, "CParen");
      var doFirst = header[0], cond = header[1], inc = header[2];
      var body = parseLogicalBlock();
      // modify the condition to jump to end of the body if it's not met
      cond.ast = new Jump(body.length + 3, new Uop("Not", cond.ast));
      return [doFirst].concat([cond]).concat(body).concat([inc]).concat([new Redirect(-body.length - 2)]);
    }
    else if(peek("OBrace")) {
      return parseScope();
    }
    else {
      return parseLogicalLine();
    }
  }

  function parseScope() {
    pushScope();
    var body = [];
    need("OBrace");
    while(!pop("CBrace")) {
      body = body.concat(parseLogicalBlock());
    }
    popScope();
    return body;
  }

  function parseStructDecl() {
    need("Struct");
    var ident = pop("Ident");
    var members = new Frame();
    need("OBrace");
    while(!pop("CBrace")) {
      var type = need("Type").string;
      while(pop("Star")) {
        type = new Ptr(type);
      }
      var member = need("Ident").string;
      while(pop("OBracket")) {
        var size = parseExpr();
        need("CBracket");
        type = new Arr(type, size);
      }
      members.push(type, member);
      need("Semi");
    }
    console.log(members);
    objInsert(members);
    return new CObject(ident.string, members);
  }

  function parseVarDecls() {
    var baseType = need("Type").string;
    var decls = [];
    do {
      var type = baseType;
      // pointer modifyer
      while(pop("Star")) {
        type = new Ptr(type);
      }
      var ident = need("Ident");
      // array modifyer
      while(pop("OBracket")) {
        var size = parseExpr();
        need("CBracket");
        type = new Arr(type, size);
      }
      var value = pop("Assign") ? parseExpr() : undefined;
      varInsert(ident.string, -currentFrame.size);
      var v = currentFrame.push(type, ident.string);
      decls.push(new VarDecl(type, ident.string, v.offset, value));
    }
    while(pop("Comma"));
    need("Semi");
    return decls;
  }

  function parseFunctionDecl() {
    currentFrame = new Frame();
    var type = need("Type").string;
    var name = need("Ident").string;
    var params = parseList("OParen", "CParen", "Comma", () => {
      var type = need("Type").string;
      var name = need("Ident").string;
      varInsert(name, currentFrame.size);
      currentFrame.push(type, name);
      return new Param(type, name);
    });

    var body = parseScope();
    if(!(body[body.length-1] instanceof Return)) {
      body.push(new Line(new Return()));
    }

    var decl = new CFunction(type, params, body, currentFrame);
    functions[name] = decl;
    return decl;
  }

  while(currentToken != tokens.length) {
    currentFrame = globals;
    if(peek("Struct")) {
      parseStructDecl();
    }
    else if(peekPattern("Type", () => { while(pop("Star")){} }, "Ident", "OParen")) {
      parseFunctionDecl();
    }
    else {
      parseVarDecls();
    }
  }
  return { "functions": functions, "globals": globals };
}
