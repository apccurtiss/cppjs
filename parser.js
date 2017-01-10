var types = {
  "int": { "size": 8 },
  "float": { "size": 8 },
  "char": { "size": 1 },
};

// logical line
const Line = function(start, end, ast) { this.start = start; this.end = end; this.ast = ast; };

// Tokens
CStruct = function(name, members, size) { this.name = name; this.members = members; this.size = size; };
CFunction = function(type, params, body, frame) { this.type = type; this.params = params; this.body = body; this.frame = frame; };
Param = function(type, name) { this.type = type; this.name = name; };
Frame = function() {
  this.size = 0;
  this.vars = [];
  this.insert = function(type, name) {
    var v = new Var(name, this.size);
    this.vars.push(v);
    this.size += types[type].size;
    return v;
  }
}
LocationMap = function() {
  var vars = {};
  this.insert = function(name, loc) {
    vars[name] = loc;
  }
  this.lookup = function(ident) {
    console.log(vars);
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
MemoryCell = function(type, offset, value) { this.type = type; this.offset = offset; this.value = value; }
Struct = function(size, members) { this.size = size; this.members = members; };
Decl = function(type, name, val) { this.name = name; this.val = val; };
Var = function(name, offset) { this.name = name; this.offset = offset; };
Call = function(name, args) { this.name = name; this.args = args; };
Val = function(type, value) { this.type = type; this.value = value; };
Bop = function(bop, e1, e2) { this.bop = bop; this.e1 = e1; this.e2 = e2; };
Uop = function(uop, e1) { this.uop = uop; this.e1 = e1; };
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

  function parseExpr(varLookup) {
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
          var pl = parseList("OParen", "CParen", "Comma", () => parseExpr(varLookup));
          return new Call(a.string, pl);
        }
        // Variable
        else {
          return varLookup(a);
        }
      }
      else if(pop("OParen")) {
        var p = parseExpr(varLookup);
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

  function parseList(start, end, delim, parseElement) {
    var list = [];
    need(start);
    if(!pop(end)) {
      do {
        list.push(parseElement());
      } while(pop(delim));
      need(end);
    }
    return list;
  }

  function parseFunctionBody(locations) {
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
        return new Line(start, end  , ast);
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
            var type = pop(type).string;
            var ident = need("Ident");
            var value = pop("Assign") ? parseExpression() : undefined;
            if(localVars[ident.string]) {
              throw new ParseError(`Variable ${ident.string} was already declared before this point:\n${positionToString(ident.position)}`);
            }
            else {
              localVars[ident.string] = ident;
            }
            // negative location indicates relative position
            locations.insert(ident.string, -frame.size);
            var v = frame.insert(type, ident.string);
            ast = new Bop("assign", new Var(v.name, -v.offset), value);
          }
          // normal expression
          else {
            ast = parseExpression();
          }
          return ast;
        });
        need("Semi", "A line should have ended with a semicolon before this point");
        return ret;
      }

      function parseLogicalBlock() {
        if(pop("If")) {
          need("OParen");
          var cond = getLinePosition(parseExpression);
          need("CParen");
          var body = parseLogicalBlock();
          cond.ast = new Jump(body.length + 1, new Uop("Not", cond.ast));
          return [cond].concat(body);
        }
        else if(pop("For")) {
          need("OParen");
          var doFirst = getLinePosition(parseExpression); need("Semi");
          var cond = getLinePosition(parseExpression); need("Semi");
          var inc = getLinePosition(parseExpression);
          need("CParen");
          var body = parseLogicalBlock();
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

    var params = parseList("OParen", "CParen", "Comma", () => {
      var type = need("Type").string;
      var name = need("Ident").string;
      locations.insert(name, frame.size);
      frame.insert(type, name);
      return new Param(type, name);
    });

    var body = parseScopedSection(locations);
    return new CFunction(undefined, params, body, frame);
  }

  // function parseType() {
  //
  //   else {
  //     return need("Type");
  //   }
  // }

  var globals = new Frame();
  var globalLocations = new LocationMap();
  var functions = {};
  while(tokens.length) {
    if(pop("Semi")) continue;
    var type = need("Type").string;
    var ident = need("Ident");

    // function declaration
    if(peek("OParen")) {
      var body = parseFunctionBody(globalLocations.clone());
      body.type = type;
      functions[ident.string] = body;
    }
    // variable declaration
    else {
      need("Assign");
      var val = parseExpr(globalLocations.lookup);
      need("Semi");
      console.log("Setting " + ident.string + " to be " + globals.size);
      globalLocations.insert(ident.string, globals.size);
      globals.insert(type, ident.string, val.value);
    }
  }
  return { "functions": functions, "globals": globals };
}
