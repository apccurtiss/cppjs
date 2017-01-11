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
  this.insert = function(type, name) {
    var v = new MemoryCell(type, name, this.size);
    this.vars.push(v);
    this.size += sizeof(type);
    return v;
  }
}
LocationMap = function() {
  var vars = {};
  this.get = function() {
    return vars;
  }
  this.insert = function(name, loc) {
    vars[name] = loc;
  }
  this.lookup = function(ident) {
    var loc = vars[ident.string];
    if(loc == undefined) {
      throw new ParseError(`Variable ${ident.string} not declared before this point:\n${positionToString(ident.position)}`);
    }
    return new Var(ident.string, loc);
  }
  this.clone = function() {
    var clone = new LocationMap();
    for(element in vars) {
      clone.insert(element, vars[element]);
    }
    return clone;
  }
}
CStruct = function(name, members, size) { this.name = name; this.members = members; this.size = size; };
CFunction = function(type, params, body, frame) { this.type = type; this.params = params; this.body = body; this.frame = frame; };
Param = function(type, name) { this.type = type; this.name = name; };
Struct = function(size, members) { this.size = size; this.members = members; };
Decl = function(type, name, val) { this.name = name; this.val = val; };
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
  var globalLocations = new LocationMap();
  var globals = new Frame();
  var functions = {};

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
      throw new ParseError((message || `Expected type '${type}' but got '${tokens[0].type}'`) + "\n" + positionToString(tokens[0].position));
    }
    return tok;
  }

  // takes a starting token, ending token, list delimiter, and function to parse each element of a list (e.g. paramater list or function arguments)
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
        throw new ParseError(`Unexpected token of type '${tokens[0].type}':\n${positionToString(nextToken().position)}`);
      }
    }

    return level14();
  }

  function parseFunctionDefinition(type) {
    var frame = new Frame();
    function parseScopedSection(locations) {
      // names to corrosponding token
      var localVars = {};

      function parseExpression() {
        return parseExpr(locations.lookup);
      }

      function getLinePosition(getLine) {
        var start = nextToken().position.codeIndex;
        var ast = getLine();
        var end = nextToken().position.codeIndex;
        return new Line(ast, start, end);
      }

      function parseLogicalLine() {
        var ret = getLinePosition(() => {
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
                locations.insert(name, -frame.size);
                var v = frame.insert(type, name);
                ast = new Bop("assign", new Var(v.name, -v.offset), value);
              },
              // new function
              (name, definition, position) => {
                throw new ParseError(`You cannot declare a function inside another function:\n${positionToString(position)}`);
              },
              locations.lookup
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

      function parseLogicalBlock() {
        if(pop("If")) {
          // condition
          need("OParen");
          var cond = getLinePosition(parseExpression);
          need("CParen");
          // body
          var body = parseLogicalBlock();
          // modify the condition to jump to end of the body if it's not met
          cond.ast = new Jump(body.length + 1, new Uop("Not", cond.ast));
          return [cond].concat(body);
        }
        else if(pop("For")) {
          // parameters
          need("OParen");
          var doFirst = getLinePosition(parseExpression); need("Semi");
          var cond = getLinePosition(parseExpression); need("Semi");
          var inc = getLinePosition(parseExpression);
          need("CParen");
          // body
          var body = parseLogicalBlock();
          // modify the condition to jump to end of the body if it's not met
          cond.ast = new Jump(body.length + 3, new Uop("Not", cond.ast));
          return [doFirst].concat([cond]).concat(body).concat([inc]).concat([new Redirect(-body.length - 2)]);
        }
        else if(peek("OBrace")) {
          return parseScopedSection(locations.clone());
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
      localLocations.insert(name, frame.size);
      frame.insert(type, name);
      return new Param(type, name);
    });

    var body = parseScopedSection(localLocations);
    if(!(body[body.length-1] instanceof Return)) {
      body.push(new Line(new Return()));
    }
    return new CFunction(type, params, body, frame);
  }

  while(tokens.length) {
    parseDeclarations(
      // new variable
      (type, name, value, position) => {
        if(globalLocations[name]) {
          throw new ParseError(`Variable ${name} was already declared before this point:\n${positionToString(position)}`);
        }
        else {
          globalLocations.insert(name, globals.size);
        }
        var v = globals.insert(type, name);
        if(value) {
          ast = new Bop("assign", new Var(v.name, v.offset), value);
        }
      },
      // new function
      (name, definition, position) => {
        functions[name] = definition;
      },
      globalLocations.lookup
    );
  }
  return { "functions": functions, "globals": globals };
}
