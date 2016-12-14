function preprocess(code) {
  return code;
}

var Symbol = function(type, pattern) {
  this.type = type;
  this.pattern = pattern;
}

var symbols = [
  new Symbol("OParen", /^\(/),
  new Symbol("CParen", /^\)/),
  new Symbol("Plus", /^\+/),
  new Symbol("Minus", /^\-/),
  new Symbol("Mul", /^\*/),
  new Symbol("Div", /^\//),
  new Symbol("Semi", /^;/),
  new Symbol("Cmp", /^==/),
  new Symbol("Set", /^=/),
  // names
  new Symbol("Ident", /^[-a-zA-Z_][-a-zA-Z0-9_]+/),
  // variables
  new Symbol("Int", /^[0-9]+/),
  // whitespace
  new Symbol("Whitespace", /^\s+/),
]

function parse_token(code) {
  var m;
  for(var i = 0; i < symbols.length; i++) {
    if(m = code.match(symbols[i].pattern)) {
      return new Token(symbols[i].type, m[0]);
    }
  }
  throw "Unknown pattern: " + code;
}

var Token = function(type, string) {
  this.type = type;
  this.string = string;
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


var types = ["int", "float"];
is_type = function(ident) {
  for(i in types) {
    if(ident == types[i]) {
      return true;
    }
  }
  return false;
}

Bop = function(bop, e1, e2) {
  this.bop = bop;
  this.e1 = e1;
  this.e2 = e2;
}

Int = function(value) {
  this.value = value;
}

require = function(cond) {
  if(!cond) throw "Requirement failed";
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
      else {
        return acc;
      }
    }
    return mults(atom());
  }
  function atom() {
    var a;
    if(a = pop("Int")) {
      return new Int(parseInt(a.string));
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
  return plus(tokens);
}

function typecheck(ast, memory) {
  return true;
}

function is_value(ast) {
  if(ast instanceof Int) {
    return true;
  }
  else {
    return false;
  }
}

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
        return new Int(ast.e1.value + ast.e2.value);
      }
      if(ast.bop == "Minus") {
        return new Int(ast.e1.value - ast.e2.value);
      }
      if(ast.bop == "Mul") {
        return new Int(ast.e1.value * ast.e2.value);
      }
      if(ast.bop == "Div") {
        return new Int(ast.e1.value / ast.e2.value);
      }
    }
  }
  else {
    return ast;
  }
}

function run(ast, memory) {
  var steps = [ast];
  var stepno = 0;
  do {
    steps[stepno + 1] = step(steps[stepno]);
    stepno++;
    console.log(steps[stepno]);
  }
  while(!is_value(steps[stepno]));

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

code = "((1 + 2) * 3 / 9 + 17) / 6";
parse(code);
