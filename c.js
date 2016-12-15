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

var Token = function(type, string, line) {
  this.type = type;
  this.string = string;
  this.line = line;
}

var symbols = [
  new Symbol("OParen", /^\(/),
  new Symbol("CParen", /^\)/),
  new Symbol("OBrace", /^{/),
  new Symbol("CBrace", /^}/),
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
  new Symbol("Double", /^[0-9]*\.[0-9]+((e|E)-?[0-9]+)?/),
  // whitespace
  new Symbol("Whitespace", /^\s+/),
]

var types = ["int","float"];
function check_reserved(token) {
  if(token.type == "Ident") {
    for(var i = 0; i < types.length; i++) {
      if(token.string == types[i]) {
        token.type = "Type";
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
      var curr_line = code.split('\n')[0];
      var tok = new Token(symbols[i].type, m[0],curr_line);
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
Function = function(name, type, params, value) {
  this.name = name;
  this.type = type;
  this.params = params;
  this.value = value;
}

Param = function(type, name) {
  this.type = type;
  this.name = name;
}

Var = function(name, type, value) {
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
function parse(tokens) {
  function expect(type) {
    if(!tokens.length) {
      throw "Unexpected end of file";
    }
    if(type != tokens[0].type) {
      throw "Expected " + type + " but got " + tokens[0].type;
    }
  }
    function expect_pop(type) {
    expect(type);
    token = tokens[0];
    tokens = tokens.slice(1);
    return token;
  }
  function pop(type) {
    try {
      return expect_token(type)
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
      expect_pop("CParen");
      return p;
    }
    else {
      throw "Unexpected token of type \"" + tokens[0].type + "\" (\"" + tokens[0].string + "\") at \"" + tokens[0].line + "\"";
    }
  }

  function parse_params() {
    var params = [];
    var param;
    // TODO(alex) refactor to make a bit nicer?
    expect_pop("OParen");
    if(!pop("CParen")) {
      while(1) {
        var typ = expect_pop("Type");
        var name = expect_pop("Ident");
        params.push(new Param(typ.string, name.string));
        if(!pop("Comma")) break;
      }
      expect_pop("CParen");
    }
    return params;
  }

  function parse_function_body() {
    var body = [];
    expect_pop("OBrace");
    while(!pop("CBrace")) {
      // TODO(alex) allow for variable declarations
      body.push(parse_expr());
      expect_pop("Semi");
    }
    return body;
  }

  function is_declared(name) {
    var n;
    return (n = globals[name]) && n.value;
  }

  // program body can only be function or variable declarations
  var globals = [];
  while(tokens.length) {
    var tok = expect_pop("Type");
    var name = expect_pop("Ident").string;
    if(is_declared(name)) {
      throw "Redeclaration of " + name;
    }
    var typ = tok.string;

    // function declaration
    if(peek("OParen")) {
      var params = parse_params();
      var body = pop("Semi") ? undefined : parse_function_body();
      globals.push(new Function(name, typ, params, body));
    }
    // variable declaration
    else {
      expect_pop("Assign");
      var val = parse_expr();
      expect_pop("Semi");
      globals.push(new Var(name, typ, val));
    }
  }
  return globals;
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

function interpret(code) {
  var pp = preprocess(code);
  var tokens = tokenize(code);
  console.log("Tokens:");
  console.log(tokens);
  var ast = parse(tokens);
  console.log("AST:")
  console.log(ast);
  typecheck(ast, memory);
  console.log("Output:")
  run(ast, memory);
}

code = "int x = 5; int y = 6 int foo(); int main() { 5; 6 + 7; }"

interpret(code);
