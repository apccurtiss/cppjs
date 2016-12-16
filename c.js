/*
 *  Preprocessor
 */
function preprocess(code) {
  return code;
}

/*
 *  Tokeniser
 */
var Symbol = function(type, pattern) { this.type = type; this.pattern = pattern; }
var Token = function(type, string, line) { this.type = type; this.string = string; this.line = line; }

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
    if(token.string == "return") {
      token.type = "Return";
    }
  }
  return token;
}

function parse_token(code) {
  var m;
  for(var i = 0; i < symbols.length; i++) {
    if(m = code.match(symbols[i].pattern)) {
      var curr_line = code.split('\n')[0];
      var tok = new Token(symbols[i].type, m[0], curr_line);
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
FunctionDecl = function(name, type, params, value) { this.name = name; this.type = type; this.params = params; this.value = value; }
Param = function(type, name) { this.type = type; this.name = name; }
VarDecl = function(name, type, value) { this.name = name; this.type = type; this.value = value; }
Var = function(name) { this.name = name; }
Call = function(name, args) { this.name = name; this.args = args; }
Const = function(type, value) { this.type = type; this.value = value; }
Function = function(type, params, value) { this.type = type; this.params = params; this.value = value; }
Bop = function(bop, e1, e2) { this.bop = bop; this.e1 = e1; this.e2 = e2; }
Uop = function(uop, e1) { this.uop = uop; this.e1 = e1; }
Return = function(value) { this.value = value; }
// TODO(alex) replace with more generic 'fd' type
Print = function(text) { this.text = text; }

// TODO(alex) use generator instead of array of tokens?
function parse(tokens) {
  function expect(type) {
    if(!tokens.length) {
      // console.trace();
      throw "Unexpected end of file";
    }
    if(type != tokens[0].type) {
      // console.trace();
      throw `Expected type '${type}' but got '${tokens[0].type}' (${tokens[0].string})`;
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
      return expect_pop(type)
    }
    catch(err) {
      return false;
    }
  }

  function peek(type) {
    return (tokens.length && (tokens[0].type == type)) ? tokens[0] : false;
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
    else if(a = pop("Ident")) {
      // Function
      if(peek("OParen")) {
        var pl = parse_list("OParen", "CParen", "Comma", parse_expr);
        return new Call(a.string, pl);
      }
      // Variable
      else {
        return new Var(a.string);
      }
    }
    else if(pop("OParen")) {
      var p = parse_expr();
      expect_pop("CParen");
      return p;
    }
    else {
      throw `Unexpected token of type '${tokens[0].type}' ('${tokens[0].string}')`;
    }
  }

  function parse_list(start, end, delim, get_element) {
    var list = [];
    expect_pop(start);
    if(!pop(end)) {
      do {
        list.push(get_element());
      } while(pop(delim));
      expect_pop(end);
    }
    return list;
  }

  function get_function_body() {
    var body = [];
    expect_pop("OBrace");
    while(!pop("CBrace")) {
      // TODO(alex) allow for variable declarations
      if(pop("Return")) {
        body.push(new Return(parse_expr()));
      }
      else {
        body.push(parse_expr());
      }
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
    if(pop("Semi")) continue;
    var tok = expect_pop("Type");
    var name = expect_pop("Ident").string;
    if(is_declared(name)) {
      throw "Redeclaration of " + name;
    }
    var typ = tok.string;

    // function declaration
    if(peek("OParen")) {
      var params = parse_list("OParen", "CParen", "Comma", () => new Param(expect_pop("Type").string, expect_pop("Ident").string));
      var body = pop("Semi") ? undefined : get_function_body();
      globals.push(new FunctionDecl(name, typ, params, body));
    }
    // variable declaration
    else {
      expect_pop("Assign");
      var val = parse_expr();
      expect_pop("Semi");
      globals.push(new VarDecl(name, val.type, val.value));
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


/*
 *  Evaluation
 */
var Environment = function(ast) {
  // initialize
  var global_memory = {
    puts: new Function("void", [ new Param("int", "x") ], [ new Print(new Var("x"))])
  };
  var Location = function(type, value) {
    this.type = type;
    this.value = value;
  }

  for(var i = 0; i < ast.length; i++) {
    if(ast[i] instanceof FunctionDecl) {
      global_memory[ast[i].name] = new Function(ast[i].type, ast[i].params, ast[i].value);
    }
    else if(ast[i] instanceof VarDecl) {
      global_memory[ast[i].name] = new Location(ast[i].type, ast[i].value);
    }
  }

  function is_value(ast) {
    if(ast instanceof Const) {
      return true;
    }
    else {
      return false;
    }
  }

  function eval(ast, stack_frame) {
    function lookup(v) {
      var sv = stack_frame[v];
      return sv ? sv : global_memory[v];
    }
    if(is_value(ast)) {
      return ast;
    }
    else if(ast instanceof Var) {
      value = lookup(ast.name);
      return value;
    }
    else if(ast instanceof Call) {
      var f = lookup(ast.name);
      var sf = {};
      for(var i = 0; i < ast.args.length; i++) {
        // console.log("Setting", f.params[i].name, "to be", eval(ast.args[i], memory), "using", ast.args[i]);
        sf[f.params[i].name] = eval(ast.args[i], stack_frame);
      }
      return call(f, sf);
    }
    else if(ast instanceof Print) {
      console.log(eval(ast.text, stack_frame).value);
      return undefined;
    }
    else if(ast instanceof Return) {
      return eval(ast.value, stack_frame);
    }
    else if(ast instanceof Bop) {
      if(ast.bop == "Plus") {
        return new Const("int", eval(ast.e1, stack_frame).value + eval(ast.e2, stack_frame).value);
      }
      if(ast.bop == "Minus") {
        return new Const("int", eval(ast.e1, stack_frame).value - eval(ast.e2, stack_frame).value);
      }
      if(ast.bop == "Mul") {
        return new Const("int", eval(ast.e1, stack_frame).value * eval(ast.e2, stack_frame).value);
      }
      if(ast.bop == "Div") {
        return new Const("int", eval(ast.e1, stack_frame).value / eval(ast.e2, stack_frame).value);
      }
    }
    else {
      console.log(ast);
      throw "Unimplemented";
    }
  }

  function call(ast, stack_frame) {
    var lines = ast.value;
    for(var i = 0; i < lines.length; i++) {
      var ret = eval(lines[i], stack_frame);
      if(lines[i] instanceof Return) return ret;
    }
    return undefined;
  }

  this.typecheck = function() {

  }

  this.run = function() {
    // TODO(alex) add argc/argv to main's stack frame?
    return call(global_memory  ["main"], {});
  }
}

function interpret(code) {
  var pp = preprocess(code);

  var tokens = tokenize(code);
  console.log("Tokens:");
  console.log(tokens);

  var ast = parse(tokens);
  console.log("AST:")
  console.log(ast);

  var env = new Environment(ast);
  env.typecheck();

  console.log("Output:");
  var status_code = env.run().value;
  console.log("Exited with code " + status_code);
}

code = `
int x = 5;
int y = 6;
int foo(int x) {
  puts(x);
  puts(x + 5);
  puts(x / 5);
  return 7;
}
int main() {
  5 + x;
  6 + 7;
  puts(x + y - 14);
  return foo(y + 7);
}
`;

interpret(code);
