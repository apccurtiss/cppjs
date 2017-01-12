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
CObject = function(name, members, size) { this.name = name; this.members = members; this.size = size; };
CFunction = function(type, params, body, frame) { this.type = type; this.params = params; this.body = body; this.frame = frame; };
Param = function(type, name) { this.type = type; this.name = name; };
Struct = function(size, members) { this.size = size; this.members = members; };
VarDecl = function(type, name, val) { this.name = name; this.val = val; };
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

function ParseError(message) {
  this.name = 'ParseError';
  this.stack = (new Error()).stack;
  this.message = message || 'Parse error';
}
ParseError.prototype = Object.create(Error.prototype);
ParseError.prototype.constructor = ParseError;

// prints a position in an easy-to-read manner for error reporting
function positionToString(position) {
  var str = "Line " + position.lnum;
  str += ":\n" + position.line;
  str += "\n" + Array(position.lineIndex).join(" ");
  str += "^";
  return str;
}

module.exports = function(tokens) {
  var scopes = [];
  function pushScope() {
    scopes.push(new Scope());
  }
  function popScope() {
    scopes.pop();
  }
  function varLookup(ident) {
    for(var i = scopes.length-1; i >= 0; i--) {
      try {
        return scopes[i].lookup(ident);
      }
      catch(err) {
        continue;
      };
    }
    throw new ParseError(`Variable ${ident.string} not declared before this point:\n${positionToString(ident.position)}`);
  }
  function varInsert(name, position) {
    scopes[scopes.length-1].insertVar(name, position);
  }

  var globalLocations = new Scope();
  var globals = new Frame();
  var functions = {};

  var currentToken = 0;

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
      console.trace();
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

  function parsePattern() {
    return tryToParse(() => {
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
    });
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

  function parseVarDecls() {
    var baseType = need("Type").string;
    var decls;
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
      decls.push(new param);
    }
    while(pop("Comma"));
    return decls;
  }

  function parseFuncDecl() {

  }

  function parseStructDeclaration() {
    need("Struct");
    var ident = pop("Ident");
    var members = [];
    need("OBrace");
    while(!pop("CBrace")) {
      var type = need("Type").string;
      while(pop("Star")) {
        type = new Ptr(type);
      }
      var ident = need("Ident");
      while(pop("OBracket")) {
        var size = parseExpr();
        need("CBracket");
        type = new Arr(type, size);
      }
      members.push(new param)
    }
  }

  function parseDeclarations(newVarFunction, newFuncFunction, variableLookupFunction) {
    var type = need("Type").string;
    while(true) {
      // pointer declaration
      while(pop("Star")) {
        type = new Ptr(type);
      }
      var ident = need("Ident");
      // function declaration
      if(peek("OParen")) {
        var definition = parseFunctionDefinition(type);
        newFuncFunction(ident.string, definition, ident.position);
        return;
      }
      // array declaration
      if(pop("OBracket")) {
        var size = parseInt(need("LitInt").string);
        need("CBracket");
        type = new Arr(type, size);
      }
      // initializaiton on declaration is optional
      var value = pop("Assign") ? parseExpr(variableLookupFunction) : undefined;
      newVarFunction(type, ident.string, value, ident.position);
      // repeat if variable
      if(pop("Comma")) {
        newFuncFunction = (type, name, position) => {
          `You cannot declare a function here:\n${positionToString(position)}`;
        }
      }
      else {
        break;
      }
    }
    need("Semi", "A line should have ended with a semicolon before this point");
  }

  function parseExpr(variableLookupFunction) {
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
          var pl = parseList("OParen", "CParen", "Comma", () => parseExpr(variableLookupFunction));
          return new Call(a.string, pl);
        }
        // Variable
        else {
          return variableLookupFunction(a);
        }
      }
      else if(pop("OParen")) {
        var p = parseExpr(variableLookupFunction);
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

  function parseFunctionDefinition(type) {
    var frame = new Frame();

    function parseScope(locations) {
      // names to corrosponding token
      var localVars = {};

      function parseExpression() {
        return parseExpr(locations.lookupVar);
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
            ast = new Return(parseExpression());
          }
          // variable declaration
          else if(peek("Type")) {
            parseDeclarations(
              // new variable
              (type, name, value, position) => {
                if(localVars[name]) {
                  throw new ParseError(`Variable ${name} was already declared before this point:\n${positionToString(position)}`);
                }
                else {
                  localVars[name] = position;
                }
                locations.insertVar(name, -frame.size);
                var v = frame.push(type, name);
                ast = new Bop("assign", new Var(v.name, -v.offset), value);
              },
              // new function
              (name, definition, position) => {
                throw new ParseError(`You cannot declare a function inside another function:\n${positionToString(position)}`);
              },
              locations.lookupVar
            );
            return ast;
          }
          // normal expression
          else {
            ast = parseExpression();
          }
          need("Semi", "A line should have ended with a semicolon before this point");
          return ast;
        });
        return ret;
      }

      function expression() {
        return positionOf(parseExpression);
      }

      function parseLogicalBlock() {
        if(pop("If")) {
          var cond = parsePattern("OParen", expression, "CParen");
          var body = parseLogicalBlock();
          // modify the condition to jump to end of the body if it's not met
          cond.ast = new Jump(body.length + 1, new Uop("Not", cond.ast));
          return [cond].concat(body);
        }
        else if(pop("For")) {
          var header = parsePattern("OParen", expression, "Semi", expression, "Semi", expression, "CParen");
          var doFirst = header[0], cond = header[1], inc = header[2];
          var body = parseLogicalBlock();
          // modify the condition to jump to end of the body if it's not met
          cond.ast = new Jump(body.length + 3, new Uop("Not", cond.ast));
          return [doFirst].concat([cond]).concat(body).concat([inc]).concat([new Redirect(-body.length - 2)]);
        }
        else if(peek("OBrace")) {
          return parseScope(locations.clone());
        }
        else {
          return [parseLogicalLine()];
        }
      }

      var body = [];
      need("OBrace");
      while(!pop("CBrace")) {
        body = body.concat(parseLogicalBlock());
      }
      return body;
    }

    var localLocations = globalLocations.clone();
    var params = parseList("OParen", "CParen", "Comma", () => {
      var type = need("Type").string;
      var name = need("Ident").string;
      localLocations.insertVar(name, frame.size);
      frame.push(type, name);
      return new Param(type, name);
    });

    var body = parseScope(localLocations);
    if(!(body[body.length-1] instanceof Return)) {
      body.push(new Line(new Return()));
    }
    return new CFunction(type, params, body, frame);
  }

  while(currentToken != tokens.length) {
    parseDeclarations(
      // new variable
      (type, name, value, position) => {
        if(globalLocations[name]) {
          throw new ParseError(`Variable ${name} was already declared before this point:\n${positionToString(position)}`);
        }
        else {
          globalLocations.insertVar(name, globals.size);
        }
        var v = globals.push(type, name);
        if(value) {
          ast = new Bop("assign", new Var(v.name, v.offset), value);
        }
      },
      // new function
      (name, definition, position) => {
        functions[name] = definition;
      },
      globalLocations.lookupVar
    );
  }
  return { "functions": functions, "globals": globals };
}
