(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
var tokenize = require("./tokenizer");
var parse = require("./parser");
var Runtime = require("./runtime");

function CAlert(message, position) {
  this.name = 'CAlert';
  this.stack = (new Error()).stack;
  this.message = message || '';
}
CAlert.prototype = Object.create(Error.prototype);
CAlert.prototype.constructor = CAlert;

global.c_program = function(code) {
  var compiledCode;
  var rt;
  this.load = function(code) {
    compiledCode = parse(tokenize(code));
    rt = new Runtime(compiledCode);
  }
  this.step = function() {
    if(!rt) {
      throw new CAlert('No program loaded!');
    }
    rt.step(1);
    return rt.getCurrentLine();
  }
  this.reset = function() {
    rt = new Runtime(compiledCode);
  }
  this.dumpStack = function() {
    return rt.dumpStack();
  }
  this.identifyDataStructure = function() {
    return rt.identifyDataStructure();
  }
  if(code) {
    this.load(code);
  }
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./parser":3,"./runtime":4,"./tokenizer":5}],2:[function(require,module,exports){
Types = require("./types.js")

function MemoryError(message, position) {
  this.name = 'MemoryError';
  this.message = message || 'Memory error occured';
}
MemoryError.prototype = Object.create(Error.prototype);
MemoryError.prototype.constructor = MemoryError;

function Segfault(position, message) {
  this.name = 'Segfault';
  this.message = `(${position}) A segfault? In Javascript? Believe it, bub.`;
}
Segfault.prototype = Object.create(Error.prototype);
Segfault.prototype.constructor = Segfault;

function AllocationTable (initial_state) {
  if (initial_state == undefined) {
    this.state = [];
  } else {
    this.state = initial_state;
  }

  this.insert = function(key, value) {
    var i;
    for(i = 0; i < this.state.length; i++) {
      if (this.state[i].address > key) {
        break;
      }
    }
    var before = this.state.slice(0,i);
    var added = [{address: key, length: value}];
    var after = this.state.slice(i);
    return new AllocationTable(before.concat(added).concat(after));
  }

  this.remove = function(key) {
    var i = 0;
    for (i = 0; i < this.state.length; i++) {
      if (this.state[i].address == key) {
        break;
      }
    }

    if (i == 0) {
      throw new Segfault(0);
    }

    var removed = this.state.splice(i,1);
    return new AllocationTable(removed);
  }
}

function Memory (initial_size, initial_state) {
  if (initial_size == undefined) {
    this.size = 128;
  } else if (initial_size < 8) {
    throw new MemoryError('Memory Objects must have a size of 8 or more.')
  } else {
    this.size = initial_size;
  }

  if (initial_state == undefined) {
    this.data = new ArrayBuffer(this.size);
  } else {
    this.data = initial_state.slice(0,this.size);
  }

  this.read = function (address, size, typeflag) {
    if (address > this.size || address <= 0) {
      throw new Segfault(address);
    }
    var ret = undefined;
    //set boolean flags here for ease of coding later on
    var float = false;
    var signed = true;

    if (typeflag == 'float') {
      float = true;
    } else if (typeflag == 'unsigned') {
      signed = false;
    }

    if (size == 1) {
      if (float) {
        throw new MemoryError('Floating point numbers may not have a size of 1 byte');
      } else if (signed) {
        ret = (new Int8Array(this.data, address, 1))[0];
      } else {
        ret = (new Uint8Array(this.data, address, 1))[0];
      }
    } else if (size == 2) {
      if (float) {
        throw new MemoryError('Floating point numbers may not have a size of 2 bytes');
      } else if (signed) {
        ret = (new Int16Array(this.data, address, 1))[0];
      } else {
        ret = (new Uint16Array(this.data, address, 1))[0];
      }
    } else if (size == 4) {
      if (float) {
        ret = (new Float32Array(this.data, address, 1))[0];
      } else if (signed) {
        ret = (new Int32Array(this.data, address, 1))[0];
      } else {
        ret = (new Uint32Array(this.data, address, 1))[0];
      }
    } else if (size == 8) {
      if (float) {
        ret = (new Float64Array(this.data, address, 1))[0];
      } else {
        throw new MemoryError('8 byte numbers must be floats');
      }
    }

  return ret;
  }

  this.write = function (value, address, size, typeflag) {
    if (address > this.size || address <= 0) {
      throw new Segfault(address);
    }
    var modified = this.data.slice(0)
    //set boolean flags here for ease of coding later on
    var float = false;
    if (typeflag == 'float') {
      float = true;
    } else if (typeflag == 'signed') {
      signed = true;
    } else if (typeflag == 'unsigned') {
      signed = false;
    }

    if (size == 1) {
      if (float) {
        throw new MemoryError('Floating point numbers may not have a size of 1 byte');
      } else if (signed) {
        (new Int8Array(modified, address, 1))[0] = value;
      } else {
        (new Uint8Array(modified, address, 1))[0] = value;
      }
    } else if (size == 2) {
      if (float) {
        throw new MemoryError('Floating point numbers may not have a size of 2 bytes');
      } else if (signed) {
        (new Int16Array(modified, address, 1))[0] = value;
      } else {
        (new Uint16Array(modified, address, 1))[0] = value;
      }
    } else if (size == 4) {
      if (float) {
        (new Float32Array(modified, address, 1))[0] = value;
      } else if (signed) {
        (new Int32Array(modified, address, 1))[0] = value;
      } else {
        (new Uint32Array(modified, address, 1))[0] = value;
      }
    } else if (size == 8) {
      if (float) {
        (new Float64Array(modified, address, 1))[0] = value;
      } else {
        throw new MemoryError('8 byte numbers must be floats');
      }
    }

    return new Memory(this.size, modified);
  }

  this.resize = function (newsize) {
    if (newsize < this.size) {
      throw new MemoryError("You cannot resize memory to be smaller");
    }
    return new Memory(this.size, this.data);
  }

}

function Heap(initial_data, initial_allocations) {
  if (initial_data == undefined) {
    this.memory = new Memory(128);
  } else {
    this.memory = initial_data;
  }

  if (initial_allocations == undefined) {
    this.allocations = new AllocationTable();
  } else {
    this.allocations = initial_allocations;
  }

  this.read = function (address, size, typeflag) {
    return this.memory.read(address, size, typeflag);
  }

  this.write = function (value, address, size, typeflag) {
    return new Heap(this.memory.write(value, address, size, typeflag), this.allocations);
  }

  this.malloc = function (size) {
    var last = 8;
    for (var x in this.allocations.state) {
      if (x.address - last >= size) {
        break;
      } else {
        last = x.address + x.length;
      }
    }

    return {
      address: last,
      state: new Heap(this.memory, this.allocations.insert(last, size))
    };
  }

  this.free = function (address) {
    return new Heap(this.memory, this.allocations.remove(address))
  };
}

function MemoryCell(offset, type, name) {
  this.offset = offset;
  this.type = type;
  this.name = name;
}

function AbstractFrame(name) {
  this.name = name;
  this.size = 0;
  this.vars = [];
  this.push = function(type, name, size) {
    this.size += !(this.size % size) ? 0 : (size - (this.size % size));
    this.vars.push(new MemoryCell(this.size, type, name));
    this.size += size;
    return this.size - size;
  }
}

function StackFrame(abstract, prev) {
  this.prev = prev;
  this.startaddr = 8;
  if (this.prev == undefined) {
    this.memory = new Memory(128);
  } else {
    this.startaddr = prev.startaddr + prev.size;
    this.startaddr += 8 - (this.startaddr % 8)
    this.memory = prev.memory;
  }
  this.size = abstract.size;
  this.abstract = abstract;

  this.ret = function() {
    return this.prev;
  }

  this.read = function(address, size, typeflag) {
    return this.memory.read(address, size, typeflag);
  }

  this.write = function(value, address, size, typeflag) {
    var mod = new StackFrame(this.abstract, this.prev);
    mod.memory = this.memory.write(value, address, size, typeflag);
    return mod;
  }

  this.name = function() {
    if (this.n == undefined) {
      return "Stack Frame at " + this.startaddr;
    }
    return this.abstract.name + " at " + this.startaddr;
  }

  this.trace = function(objects) {
    var trace = []
    if (this.prev != undefined) {
      trace = this.prev.trace();
    }
    var curr = new Object;
    curr = {}
    for (var j = 0; j < this.abstract.vars.length; j++) {
      if (this.abstract.vars[j].type instanceof Types.Obj) {
        objdef = objects[this.abstract.vars[j].type.name]
        var members = {};
        for (var k in objdef.vars) {
          members[k] = this.memory.read(this.startaddr + this.abstract.vars[j].offset + objdef.vars[k].offset, 4, "unsigned");
        }
        curr[this.abstract.vars[j].name] = members;
      } else {
        curr[this.abstract.vars[j].name] = this.memory.read(this.startaddr + this.abstract.vars[j].offset, 4, "unsigned");

      }
    }
    trace.push(curr);
    return trace;
  }
}

module.exports = {
  Memory: Memory,
  Heap: Heap,
  AbstractFrame: AbstractFrame,
  MemoryCell: MemoryCell,
  StackFrame: StackFrame,
  signed: "signed",
  unsigned: "unsigned",
  float: "float"
}

},{"./types.js":6}],3:[function(require,module,exports){
var Types = require("./types.js")
var memory = require("./memory.js")

// logical line
Line = function(ast, start, end) { this.ast = ast; this.start = start; this.end = end; };

MemoryCell = memory.MemoryCell; //function(offset, type, name) { this.offset = offset; this.type = type; this.name = name; };
Frame = memory.AbstractFrame; /*function() {
  this.size = 0;
  this.vars = [];
  this.push = function(type, name, size) {
    this.size += !(this.size % size) ? 0 : (size - (this.size % size));
    this.vars.push(new MemoryCell(this.size, type, name));
    this.size += size;
    return this.size - size;
  }
}*/
Members = function() {
  this.size = 0;
  this.vars = {};
  this.push = function(type, name, size) {
    this.size += !(this.size % size) ? 0 : (size - (this.size % size));
    this.vars[name] = new memory.MemoryCell(this.size, type);
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
Address = function(base, offset, type, name) { this.base = base; this.offset = offset; this.type = type; this.name = name; };
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
  var str = `Line ${position.lineNum}:\n`;
  str += position.line + "\n";
  str += Array(position.lineIndex).join(" ") + "^";
  return str;
}

module.exports = function(tokens) {
  var scopes = [new Scope()];
  var globals = new Frame("Globals");
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
  function varInsert(type, ident, offset) {
    if(scopes[scopes.length-1].vars[ident.string] != undefined) {
      throw new ParseError(`Variable ${ident.string} already declared before this point:\n${positionToString(ident.position)}`);
    }
    base = (currentFrame == globals) ? "global" : "frame";
    var ret = new Address(base, offset, type, ident.string);
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

// base(current), offset(current)
// base(current), offset(next) + Deref(base(current), offset(current))
    function level1() {
      function helper(acc) {
        if(pop("Dot")) {
          var objType = Types.typeof(acc).name;
          var fieldName = need("Ident").string;
          var obj = objLookup(objType);
          var field = obj.get(fieldName);
          var base = (acc.base != undefined) ? acc.base : acc;
          var offset = (acc.offset != undefined) ? acc.offset + field.offset : field.offset;
          if(field) {
            return new Address(base, offset, field.type, `${acc.name}.${fieldName}`)
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
            var x = a.string;
            var y = positionToString(a.position);
            console.log(`Variable '${x}' has not been declared before it was used:\n${y}`);
            throw new ParseError();
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
    var start = nextToken().position;
    var ast = parseFunction();
    var end = nextToken().position;
    return new Line(ast, start, end);
  }

  function parseLogicalLine() {
    var start = nextToken().position;
    var ret;
    // return statement
    if(pop("Return")) {
      ret = [new Line(new Return(parseExpr()), start, nextToken().position)];
      need("Semi", "A line should have ended with a semicolon before this point");
    }
    // variable declaration
    else if(peek(parseType)) {
      ret = parseVarDecls();
    }
    // normal expression
    else {
      ret = [new Line(parseExpr(), start, nextToken().position)];
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
    var start = nextToken().position;
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
      decls.push(new Line(new Decl(type, ident.string, offset, value), start, nextToken().position));
      if(pop("Comma")) {
        start = nextToken().position;
      }
      else {
        break;
      }
    }
    need("Semi");
    return decls;
  }

  function parseFunctionDecl() {
    var type = parseType();
    var name = need("Ident").string;
    if (functions[name] != undefined) {
      throw new ParseError(`function ${name} is defined at two locations`);
    }
    currentFrame = new Frame(name);
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

},{"./memory.js":2,"./types.js":6}],4:[function(require,module,exports){
var memory = require('./memory.js');
var Types = require('./types.js');

function RuntimeError(message, position) {
  this.name = 'RuntimeError';
  this.message = message || 'Parse error';
  this.position = position;
  this.stack = (new Error()).stack;
}
RuntimeError.prototype = Object.create(Error.prototype);
RuntimeError.prototype.constructor = RuntimeError;

/*StackFrame = function(start, ret, frame, name) {
this.start = start;
this.ret = ret;
this.frame = frame;
this.name = name;
};*/
Obj = function() {};
module.exports = function(parsedCode) {
  // code setup
  var functions = {};
  var code = [];

  // store all code as one block to allow easy addressing of individual lines
  for (f in parsedCode.functions) {
    functions[f] = parsedCode.functions[f].frame;
    functions[f].location = code.length;
    code = code.concat(parsedCode.functions[f].body)
  }

  code.push(new Line(new Call("main", [])));

  // stack setup
  //var stackFrames = [];
  var globalsPointer = 8;

  var globals = parsedCode.globals;
  var currentFrame = new memory.StackFrame(globals);
  var globalData = parsedCode.globalData;
  for (var i = 0; i < globalData.length; i++) {
    if (globalData[i].ast.val != undefined) {
      var val = eval(globalData[i].ast.val);
      currentFrame = currentFrame.write(val.value, globalsPointer + globalData[i].ast.position, 4, memory.signed);
    }
  }
  //stackPointer = globalsPointer + globals.size;



  // instruction setup
  var currentInstruction = code.length-1;
  this.getCurrentLine = function() {
    if(isNaN(currentInstruction)) {
      return undefined;
    }
    else {
      return code[currentInstruction]
    }
  };
  this.getNextLine = function() {};

  // runtime setup
  this.step = function(n) {
    for (var i = 0; i < n; i++) {
      if (isNaN(currentInstruction)) {
        break;
      }
      // console.log("On line:");
      // console.log(this.getCurrentLine().ast);
      eval(this.getCurrentLine().ast);
      currentInstruction++;
    }
  }

  // returning values setup
  this.dumpGlobals = function() {
    var dump = {};
    for (var i = 0; i < globals.vars.length; i++) {
      dump[globals.vars[i].name] = currentFrame.read(globalsPointer + globals.vars[i].offset, 4, memory.unsigned);
    }
    return dump;
  }

  this.dumpStack = function() {
    return currentFrame.trace(parsedCode.globalObjects);
  }

  var Node = function(type, name, position) {
      this.type = type;
      this.name = name;
      this.position = position;
  }
  var nodes = [];
  var Edge = function(start, end) {
      this.start = start;
      this.end = end;
  }
  var edges = [];

  function registerObjectLocation(typeName, name, position) {
      nodes.push(new Node(typeName, name, position));
  }
  this.identifyDataStructure = function() {
    edges = [];
    for (var i = 0; i < nodes.length; i++) {
      // console.log(nodes[i]);
      var object = parsedCode.globalObjects[nodes[i].type];
      for (v in object.vars) {
          for (var j = 0; j < nodes.length; j++) {
              if (nodes[j].position == currentFrame.read(nodes[i].position + object.vars[v].offset, 4, memory.unsigned)) {
                  edges.push(new Edge(i, j));
                  break;
              }
          }
      }
    }
    return {
        nodes: nodes,
        edges: edges
    };
  }

  function resolveLocation(ast) {
    // console.log(ast);
    if (ast instanceof Address) {
      var base;
      if(ast.base == "global") {
        base = globalsPointer;
      }
      else if(ast.base == "frame") {
        base = currentFrame.startaddr;
      }
      else {
        base = eval(ast.base).value;
      }
      // var base = (ast.base == "global") ? globalsPointer : currentFrame().start;
      return base + ast.offset;
    } else {
      throw new RuntimeError(`Cannot get location of ${JSON.stringify(ast)}`);
    }
  }

  function getValue(ast) {
    if (ast instanceof Address) {
      var loc = resolveLocation(ast);
      return currentFrame.read(loc, 4, memory.unsigned);
    } else if (ast instanceof Val) {
      return ast.value;
    } else {
      throw (`Cannot get value of ${ast}`);
    }
  }

  // returns varied expression classes
  function eval(ast) {
    if (ast instanceof Val || ast instanceof Address) {
      return ast;
    } else if (ast instanceof Call) {
      currentFrame = new memory.StackFrame(parsedCode.functions[ast.name].frame, currentFrame)
      currentFrame.returnAddr = currentInstruction;
      for (var i = 0; i < ast.args.length; i++) {
        var val = eval(ast.args[i]);
        currentFrame = currentFrame.write(val.value, currentFrame.startaddr + (4 * i), 4, memory.signed);
      }
      // subtract one because one will be added later during the step() function
      currentInstruction = functions[ast.name].location - 1;
    } else if (ast instanceof Print) {
      console.log(eval(ast.text).value);
      return undefined;
    } else if (ast instanceof Return) {
      currentInstruction = currentFrame.returnAddr;
      currentFrame = currentFrame.ret();
      if (ast.value) {
        return eval(ast.value);
      } else {
        return 0;
      }
    } else if (ast instanceof Bop) {
      if (ast.bop == "Assign") {
        // TODO(alex) support direct memory location assignments
        var address = resolveLocation(eval(ast.e1));
        var v1 = eval(ast.e2);
        var val = getValue(v1);
        currentFrame = currentFrame.write(val, address, 4, memory.signed);
      }
      else {
        var v1 = getValue(eval(ast.e1));
        var v2 = getValue(eval(ast.e2));
        if (ast.bop == "Plus") {
          return new Val("int", v1 + v2);
        } else if (ast.bop == "Minus") {
          return new Val("int", v1 - v2);
        } else if (ast.bop == "Mul") {
          return new Val("int", v1 * v2);
        } else if (ast.bop == "Div") {
          return new Val("int", v1 / v2);
        }
        // TODO(alex) make int casts less janky
        else if (ast.bop == "Neq") {
          return new Val("int", v1 != v2);
        } else if (ast.bop == "Lt") {
          return new Val("int", 0 + (v1 < v2));
        } else if (ast.bop == "Gt") {
          return new Val("int", 0 + (v1 > v2));
        } else if (ast.bop == "Le") {
          return new Val("int", 0 + (v1 <= v2));
        } else if (ast.bop == "Ge") {
          return new Val("int", 0 + (v1 >= v2));
        } else {
          throw new RuntimeError(`Unimplemented`);
        }
      }
    } else if (ast instanceof Uop) {
      if (ast.cond) console.log(eval(ast.cond));
      if (ast.uop == "Not") {
        return new Val("int", !eval(ast.e1).value);
      } else if (ast.uop == "Addr") {
        var loc = resolveLocation(eval(ast.e1));
        return new Val("int", loc);
      } else if (ast.uop == "Deref") {
        var val = getValue(eval(ast.e1));
        return new Val("int", val);
      } else {
        throw new RuntimeError("Unimplemented");
      }
    } else if (ast instanceof Decl) {
      if (ast.type instanceof Types.Obj) {
        registerObjectLocation(ast.type.name, ast.name, currentFrame.startaddr + ast.position)
      }
    } else if (ast instanceof FramePointer) {
      return new Val("int", currentFrame.startaddr);
    } else if (ast instanceof Jump) {
      if (!ast.cond || eval(ast.cond).value) {
        currentInstruction += ast.distance - 1;
      }
    } else {
      console.log(ast);
      throw new RuntimeError("Unimplemented");
    }
  }
}

},{"./memory.js":2,"./types.js":6}],5:[function(require,module,exports){
function Position(line, lineNum, lineIndex) {
  this.line = line;
  this.lineNum = lineNum;
  this.lineIndex = lineIndex;
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
  // basics
  new Symbol("OParen", /^\(/),
  new Symbol("CParen", /^\)/),
  new Symbol("OBrace", /^{/),
  new Symbol("CBrace", /^}/),
  new Symbol("OBracket", /^\[/),
  new Symbol("CBracket", /^\]/),
  new Symbol("Semi", /^;/),
  new Symbol("Dot", /^\./),
  new Symbol("Comma", /^,/),
  new Symbol("Question",/^\?/),
  new Symbol("Colon",/^:/),

  // unary operators
  new Symbol("Inc", /^\+\+/),
  new Symbol("Dec", /^\-\-/),

  // binary operators
  new Symbol("Plus", /^\+/),
  new Symbol("Minus", /^\-/),
  new Symbol("Star", /^\*/),
  new Symbol("Div", /^\//),
  new Symbol("Mod", /^%/),

  // equality operators
  new Symbol("Eq", /^==/),
  new Symbol("Neq", /^!=/),
  new Symbol("Le", /^<=/),
  new Symbol("Ge", /^>=/),
  new Symbol("Lt", /^</),
  new Symbol("Gt", /^>/),

  // boolean operators
  new Symbol("DoubleAnd", /^&&/),
  new Symbol("DoubleOr", /^\|\|/),
  new Symbol("Not", /^!/),

  // bitwise operators
  new Symbol("SingleOr", /^\|/),
  new Symbol("SingleAnd", /^&/),
  new Symbol("Tilda", /^~/),

  // assignment
  new Symbol("Assign", /^=/),
  new Symbol("PlusAssign", /^\+=/),
  new Symbol("MinusAssign", /^\-=/),
  new Symbol("MultAssign", /^\*=/),
  new Symbol("DivAssign", /^\/=/),

  // keywords
  new Symbol("Return",/^return\b/),
  new Symbol("While",/^while\b/),
  new Symbol("For",/^for/),
  new Symbol("If",/^if\b/),
  new Symbol("Else",/^else\b/),
  new Symbol("Break",/^break\b/),

  // keyword types
  new Symbol("Type",/^(double|float|long double)\b/),
  new Symbol("Type",/^(int|long|short|long int|short int)\b/),
  new Symbol("Type",/^char\b/),
  new Symbol("Struct",/^struct\b/),

  // names
  new Symbol("Ident", /^[-a-zA-Z_][-a-zA-Z0-9_]*/),

  // literals
  new Symbol("LitStr", /^".*?"/),
  new Symbol("LitDouble", /^[0-9]*\.[0-9]+((e|E)-?[0-9]+)?/),
  new Symbol("LitInt", /^(0x)?[0-9]+/),

  // whitespace
  new Symbol("Whitespace", /^\s+/),
]

function parseToken(code, position) {
  var m;
  for(var i = 0; i < symbols.length; i++) {
    if(m = code.match(symbols[i].pattern)) {
      return new Token(symbols[i].type, m[0], position);
    }
  }
  throw new TokenError("Unknown token", position);
}

function tokenize(code) {
  var tokens = [];
  var lines = code.split('\n');
  for(var i = 0; i < lines.length; i++) {
    if(!lines[i]) continue;
    var position = 0;
    var line = lines[i];
    do {
      var token = parseToken(line.substring(position), new Position(line, i+1, position+1));
      if(token.type != "Whitespace") {
        tokens.push(token);
      }
      position += token.string.length;
    } while (position < line.length);
  }
  return tokens;
}

module.exports = tokenize;

},{}],6:[function(require,module,exports){
var baseSizes = {
  "int": 4,
  "float": 4,
  "char": 1,
  "ptr": 4,
};

module.exports = {
  Arr: function(type, size) { this.type = type; this.size = size; },
  Obj: function(name) { this.name = name; },
  Ptr: function(type) { this.type = type; },
  sizeof: function(type) { return baseSizes[type]; },
  typeof: function(ast) {
    if(ast instanceof Uop) {
      if(ast.uop == "Deref") {
        if(ast.e1.type instanceof this.Ptr) {
          return ast.e1.type.type;
        }
        return "void";
      }
    }
    else if (ast instanceof Bop) {
      throw "Unimplemented";
    }
    else if(ast instanceof Address) {
      return ast.type;
    }
  },
};

},{}]},{},[1]);
