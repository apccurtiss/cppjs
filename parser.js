var Types = require("./types.js");

// logical line
Line = function(ast, start, end) { this.ast = ast; this.start = start; this.end = end; };

MemoryCell = function(offset, type, name) { this.offset = offset; this.type = type; this.name = name; };
Frame = function() {
  this.size = 0;
  this.vars = [];
  this.push = function(type, name, size) {
    this.size += !(this.size % size) ? 0 : (size - (this.size % size));
    this.vars.push(new MemoryCell(this.size, type, name));
    this.size += size;
    return this.size - size;
  }
}
Members = function() {
  this.size = 0;
  this.vars = {};
  this.push = function(type, name, size) {
    this.size += !(this.size % size) ? 0 : (size - (this.size % size));
    this.vars[name] = new MemoryCell(this.size, type);
    this.size += size;
    return this.vars[name];
  }
  this.get = function(name) {
    return this.vars[name];
  }
}

Scope = function() {
  this.typedefs = {};
  this.objectDefinitions = {};
  this.vars = {};
}

FramePointer = function() {};
Location = function(offset, type, name) { this.offset = offset; this.type = type; this.name = name; };
CObject = function(name, frame) { this.name = name; this.frame = frame; };
CFunction = function(type, params, body, frame) { this.type = type; this.params = params; this.body = body; this.frame = frame; };
Param = function(type, name) { this.type = type; this.name = name; };
Struct = function(size, members) { this.size = size; this.members = members; };
Decl = function(type, name, position, val) { this.type = type; this.name = name; this.position = position; this.val = val; };
Call = function(name, args) { this.name = name; this.args = args; };
Val = function(type, value) { this.type = type; this.value = value; };
Bop = function(bop, e1, e2) { this.bop = bop; this.e1 = e1; this.e2 = e2; };
Uop = function(uop, e1) { this.uop = uop; this.e1 = e1; };
Return = function(value) { this.value = value; };
Jump = function(distance, cond) { this.distance = distance; this.cond = cond; };
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
  var globals = new Frame();
  var currentFrame;
  var functions = {};
  var currentToken = 0;
  function pushScope() {
    scopes.push(new Scope());
  }
  function popScope() {
    scopes.pop();
  }
  function varLookup(name) {
    for(var i = scopes.length-1; i >= 0; i--) {
      var v;
      if(v = scopes[i].vars[name]) {
        return v;
      }
    }
    return undefined;
  }
  function objLookup(name) {
    for(var i = scopes.length-1; i >= 0; i--) {
      var v;
      if(v = scopes[i].objectDefinitions[name]) {
        return v;
      }
    }
    return undefined;
  }
  function varInsert(type, ident, position) {
    if(scopes[scopes.length-1].vars[ident.string] != undefined) {
      throw new ParseError(`Variable ${ident.string} already declared before this point:\n${positionToString(ident.position)}`)
    }
    loc = new Val("int", position);
    if(currentFrame != globals) {
      loc = new Bop("Plus", loc, new FramePointer());
    }
    var ret = new Location(loc, type, ident.string);
    scopes[scopes.length-1].vars[ident.string] = ret;
    return ret;
  }
  function objInsert(ident, members) {
    if(scopes[scopes.length-1].objectDefinitions[ident.string] != undefined) {
      throw new ParseError(`Object ${ident.string} already declared!`)
    }
    scopes[scopes.length-1].objectDefinitions[ident.string] = members;
  }

  function nextToken() {
    if(currentToken == tokens.length) {
      throw new ParseError("Unexpected end of file");
    }
    return tokens[currentToken];
  }

  function peek(type) {
    if(type instanceof Function) {
      var startToken = currentToken;
      var result;
      try {
        result = type();
      }
      catch(err) {
        result = false;
      }
      currentToken = startToken;
      return result;
    }
    else {
      return nextToken().type == type;
    }
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
          return helper(new Bop("Assign", acc, level7()));
        }
        else {
          return acc;
        }
      }
      return helper(level7());
    }

    function level7() {
      function helper(acc) {
        if(pop("Eq")) {
          return helper(new Bop("Eq", acc, level6()));
        }
        else if(pop("Neq")) {
          return helper(new Bop("Neq", acc, level6()));
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
        else if(pop("SingleAnd")) {
          return new Uop("Addr", helper());
        }
        else {
          return level1();
        }
      }
      return helper();
    }
/*var test4 = `
struct node {
  struct node *next;
}
int main() {
  struct node a, b, c, *current;
  a.next = &b;
  b.next = &c;
  c.next = 0;

  current = &a;
  while(current != 0) {
    current = (*current).next;
  }
}`;*/
    function level1() {
      function helper(acc) {
        if(pop("Dot")) {
          var objType = Types.typeof(acc).name;
          var fieldName = need("Ident").string;
          var field = objLookup(objType).get(fieldName);
          if(field) {
            return new Location(new Bop("Plus", acc, new Val("int", field.offset)), field.type, `${acc.name}.${fieldName}`);
          }
          throw new ParseError(`An object of type '${objType}' has no member ${fieldName}`);
        }
        else {
          return acc;
        }
      }
      return helper(atom());
    }

    function atom() {
      var a;
      if(a = pop("LitInt")) {
        return new Val("int", parseInt(a.string));
      }
      else if(a = pop("Ident")) {
        // Function
        if(peek("OParen")) {
          var pl = parseList("OParen", "CParen", "Comma", parseExpr);
          return new Call(a.string, pl);
        }
        // Variable
        else {
          var v = varLookup(a.string);
          if(v == undefined) {
            throw new ParseError(`Variable '${a.string}' has not been declared before it was used:\n${positionToString(a.position)}`);
          }
          return v;
        }
      }
      else if(pop("OParen")) {
        var p = parseExpr();
        need("CParen");
        return p;
      }
      else {
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
    var start = nextToken().position.codeIndex;
    var ret;
    // return statement
    if(pop("Return")) {
      ret = [new Line(new Return(parseExpr()), start, nextToken().position.codeIndex)];
      need("Semi", "A line should have ended with a semicolon before this point");
    }
    // variable declaration
    else if(peek(parseType)) {
      ret = parseVarDecls();
    }
    // normal expression
    else {
      ret = [new Line(parseExpr(), start, nextToken().position.codeIndex)];
      need("Semi", "A line should have ended with a semicolon before this point");
    }
    return ret;
  }

  function parseLogicalBlock() {
    function expression() {
      return positionOf(parseExpr);
    }
    if(pop("If")) {
      var cond = needPattern("OParen", expression, "CParen")[0];
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
      return [doFirst].concat([cond]).concat(body).concat([inc]).concat(new Line(new Jump(-body.length - 2)));
    }
    else if(pop("While")) {
      var cond = needPattern("OParen", expression, "CParen")[0];
      var body = parseLogicalBlock();
      // modify the condition to jump to end of the body if it's not met
      cond.ast = new Jump(body.length + 2, new Uop("Not", cond.ast));
      return [cond].concat(body).concat(new Line(new Jump(-body.length - 1)));
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

  function parseType() {
    if(pop("Struct")) {
      return new Types.Obj(need("Ident").string);
    }
    else {
      return need("Type").string;
    }
  }

  function sizeof(t) {
    if(t instanceof Types.Arr) {
      if(t.size) {
        return sizeof(t.type) * t.size;
      }
      else {
        return undefined;
      }
    }
    else if(t instanceof Types.Ptr) {
      return Types.sizeof("ptr");
    }
    else if(t instanceof Types.Obj) {
      return objLookup(t.name).size;
    }
    else {
      return Types.sizeof(t);
    }
  }

  function parseStructDecl() {
    need("Struct");
    var ident = pop("Ident");
    var members = new Members();
    need("OBrace");
    while(!pop("CBrace")) {
      var type = parseType();
      while(pop("Star")) {
        type = new Types.Ptr(type);
      }
      var member = need("Ident").string;
      while(pop("OBracket")) {
        var size = parseExpr();
        need("CBracket");
        type = new Types.Arr(type, size);
      }
      members.push(type, member, sizeof(type));
      need("Semi");
    }
    objInsert(ident, members);
    return new CObject(ident.string, members);
  }

  function parseVarDecls() {
    var start = nextToken().position.codeIndex;
    var baseType = parseType();
    var decls = [];
    while(true) {
      var type = baseType;
      // pointer modifyer
      while(pop("Star")) {
        type = new Types.Ptr(type);
      }
      var ident = need("Ident");
      // array modifyer
      while(pop("OBracket")) {
        var size = parseExpr();
        need("CBracket");
        type = new Types.Arr(type, size);
      }
      var value = pop("Assign") ? parseExpr() : undefined;
      var offset = currentFrame.push(type, ident.string, sizeof(type));
      varInsert(type, ident, offset);
      decls.push(new Line(new Decl(type, ident.string, offset, value), start, nextToken().position.codeIndex));
      if(pop("Comma")) {
        start = nextToken().position.codeIndex
      }
      else {
        break;
      }
    }
    need("Semi");
    return decls;
  }

  function parseFunctionDecl() {
    currentFrame = new Frame();
    var type = parseType();
    var name = need("Ident").string;
    var params = parseList("OParen", "CParen", "Comma", () => {
      var type = need("Type").string;
      var ident = need("Ident");
      var offset = currentFrame.push(type, ident.string, sizeof(type));
      varInsert(type, ident, offset);
      return new Param(type, ident.string);
    });

    var body = parseScope();
    if(!(body[body.length-1] instanceof Return)) {
      body.push(new Line(new Return()));
    }

    var decl = new CFunction(type, params, body, currentFrame);
    functions[name] = decl;
    return decl;
  }

  var globalData = [];
  while(currentToken != tokens.length) {
    currentFrame = globals;
    if(peek("Struct")) {
      parseStructDecl();
    }
    else if(peekPattern("Type", () => { while(pop("Star")){} }, "Ident", "OParen")) {
      parseFunctionDecl();
    }
    else {
      var decls = parseVarDecls();
      globalData = globalData.concat(decls);
    }
  }
  return { functions: functions, globalObjects: scopes[0].objectDefinitions, globals: globals, globalData: globalData };
}
