/*
 *  Preprocessor
 */
function preprocess(code) {
  return code;
}

/*
 *  Tokeniser
 */
var Symbol = function(type, pattern) {
  this.type = type;
  this.pattern = pattern;
}

var Token = function(type, string) {
  this.type = type;
  this.string = string;
}

var symbols = [
  new Symbol("OParen", /^\(/),
  new Symbol("CParen", /^\)/),
  new Symbol("Plus", /^\+/),
  new Symbol("Minus", /^\-/),
  new Symbol("Mul", /^\*/),
  new Symbol("Div", /^\//),
  new Symbol("Mod", /^%/),
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
  new Symbol("Double", /^[0-9]*\.[0-9]+/),
  // whitespace
  new Symbol("Whitespace", /^\s+/),
]

var reserved = ["int"];
function check_reserved(token) {
  if(token.type == "Ident") {
    for(var i = 0; i < reserved.length; i++) {
      if(token.string == reserved[i]) {
        token.type = "Reserved";
        break;
      }
    }
  }
  return token;
}

function parse_token(code) {
  var m;
  for(var i = 0; i < symbols.length; i++) {
    if(m = code.match(symbols[i].pattern)) {
      var tok = new Token(symbols[i].type, m[0]);
      return check_reserved(tok);
    }
  }
  throw "Unknown token: " + code;
}

function tokenize(code) {
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

/*
 *  Parser
 */
FuncDecl = function(name, type, params, body) {
  this.name = name;
  this.type = type;
  this.params = params;
  this.body = body;
}

Param = function(type, name) {
  this.type = type;
  this.name = name;
}

Decl = function(name, type, value) {
  this.name = name;
  this.type = type;
  this.value = value;
}

Bop = function(bop, e1, e2) {
  this.bop = bop;
  this.e1 = e1;
  this.e2 = e2;
}

Uop = function(uop, e1) {
  this.uop = uop;
  this.e1 = e1;
}

Const = function(type, value) {
  this.type = type;
  this.value = value;
}

// TODO(alex) use generator instead of array of tokens?
function treeify(tokens) {
  function expect(type) {
    if(!tokens.length) {
      throw "Unexpected end of file";
    }
    if(type != tokens[0].type) {
      throw "Expected " + type + " but got " + tokens[0].type;
    }
  }
  function require(type) {
    expect(type);
    token = tokens[0];
    tokens = tokens.slice(1);
    return token;
  }
  function pop(type) {
    try {
      return require(type)
    }
    catch(err) {
      return false;
    }
  }
  function peek(type) {
    if(tokens.length && tokens[0].type == type) {
      return tokens[0];
    }
    else {
      return false;
    }
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
    else if(pop("OParen")) {
      var p = plus();
      require("CParen");
      return p;
    }
    else {
      throw "Unexpected token: " + tokens[0].type + " (" + tokens[0].string + ")";
    }
  }

  var types = {
    "int": 4,
    "float": 4,
    "char": 1,
  };
  is_type = function(tok) {
    var size = types[tok.string];
    return size != undefined ? true : false;
  }

  function parse_params() {
    var params = [];
    var param;
    // TODO(alex) refactor to make a bit nicer?
    require("OParen");
    if(!pop("CParen")) {
      while(1) {
        var typ = require("Reserved");
        if(!is_type(typ)) throw "Type specifier required";
        var name = require("Ident");
        params.push(new Param(typ.string, name.string));
        if(!pop("Comma")) break;
      }
      require("CParen");
    }
    return params;
  }

  function parse_body() {
    throw "Function bodies unimplemented";
  }

  // declaration
  var tok;
  if(tok = pop("Reserved")) {
    if(is_type(tok)) {
      var name = require("Ident").string;
      var typ = tok.string;
      if(peek("OParen")) {
        var params = parse_params();
        var body = pop("Semi") ? undefined : parse_body();
        return new FuncDecl(name, typ, params, body);
      }
      else {
        require("Assign");
        var val = parse_expr();
        return new Decl(name, typ, val);
      }
    }
    else {
      throw "Unimplemented";
    }
  }
  else {
    return parse_expr(tokens);
  }
}

/*
 *  Typechecker
 */
function typecheck(ast, memory) {
  return true;
}

function is_value(ast) {
  if(ast instanceof Const) {
    return true;
  }
  else {
    return false;
  }
}

/*
 *  Evaluation
 */
function step(ast) {
  if(ast instanceof Bop) {
    if(!is_value(ast.e1)) {
      return new Bop(ast.bop, step(ast.e1), ast.e2);
    }
    else if(!is_value(ast.e2)) {
      return new Bop(ast.bop, ast.e1, step(ast.e2));
    }
    else {
      if(ast.bop == "Plus") {
        return new Const("int", ast.e1.value + ast.e2.value);
      }
      if(ast.bop == "Minus") {
        return new Const("int", ast.e1.value - ast.e2.value);
      }
      if(ast.bop == "Mul") {
        return new Const("int", ast.e1.value * ast.e2.value);
      }
      if(ast.bop == "Div") {
        return new Const("int", ast.e1.value / ast.e2.value);
      }
    }
  }
  else {
    throw "Unimplemented";
  }
}

function run(ast, memory) {
  var states = [ast];
  var line = 0;
  while(!is_value(states[line])) {
    states[line + 1] = step(states[line]);
    line++;
  }

  console.log(states[line]);
}

var memory = {
  // code
  print: (arg) => { console.log(arg[0].value) },
  // globals
  globals: {},
  // stack
  stack: [],
  // heap
  heap: [],
}

function parse(code) {
  var pp = preprocess(code);
  var tokens = tokenize(code);
  console.log("Tokens:")
  console.log(tokens);
  var ast = treeify(tokens);
  console.log("AST:")
  console.log(ast);
  typecheck(ast, memory);
  console.log("Output:")
  run(ast, memory);
}

code = "int x = 1 + 4 / 6;"

parse(code);
