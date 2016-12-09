function preprocess(code) {
  return code;
}

// please God tell me there's a better way to do this

// symbols
var OParen = function() {};
OParen.pattern = /^\(/;
var CParen = function() {};
CParen.pattern = /^\)/;
var Semi = function() {};
Semi.pattern = /^;/

// names
var Ident = function(v) {
  this.value = v;
}
Ident.pattern = /^[a-zA-Z]+/;

// variables
var Str = function(v) {
  this.value = v;
}
Str.pattern = /^".*"/;

// whitespace
var Whitespace = function() {};
Whitespace.pattern = /^\s/;

function tokenize(code) {
  var patterns = [
    OParen,
    CParen,
    Semi,
    Ident,
    Str,
    Whitespace,
  ]

  var tokens = [];

  var m;
  do {
    for(i in patterns) {
      m = code.match(patterns[i].pattern);
      if(m) {
        if(patterns[i] !== Whitespace) {
          tokens.push(new patterns[i](m[0]));
        }
        code = code.substring(m[0].length);
        break;
      }
    }
  } while (m);

  return tokens;
}

Call = function(name, args) {
  this.name = name;
  this.args = args;
}

function treeify(tokens) {
  if(tokens[0] instanceof Ident) {
    if(tokens[1] instanceof OParen) {
      args = [];
      var i = 2;
      while(!(tokens[i] instanceof CParen)) {
        if(tokens[i] === undefined) {
          console.log("Unexpected end of file");
        }
        args.push(tokens[i]);
        i++;
      }
      return new Call(tokens[0].value, args);
    }
  }
  else {
    console.log("Unexpected token " + tokens[0]);
  }
}

function typecheck(ast, memory) {

}

function run(ast, memory) {
  if(ast instanceof Call) {
    memory[ast.name](ast.args);
  }
}

memory = {
  print: (arg) => { console.log(arg[0].value) },
}

function parse(code) {
  var pp = preprocess(code);
  var tokens = tokenize(code);
  var ast = treeify(tokens);
  typecheck(ast, memory);
  run(ast, memory);
}

code = "print(\"Hello world!\");"
parse(code);
