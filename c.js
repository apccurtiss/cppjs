/*
 *  Preprocessor
 */

// flag for verbosity
verbose = false;

function preprocess(code) {
  return code;
}

function print() {
  if (verbose) {
    console.log.apply(console,arguments);
  }
}

/*
 *  Tokeniser
 */
var Tokenize = require("./tokenizer");

/*
 *  Parser
 */
var Parse = require("./parser");

/*
*  Evaluation
*/
var Runtime = require("./runtime");


module.exports = function interpret(code) {
  var pp = preprocess(code);
  
  var tokens = Tokenize(pp);
  //IZAAK: I'd love a way to do a quiet mode.
  print("Tokens:");
  print(tokens);

  var ast = Parse(tokens);
  print("AST:")
  print(ast);

  var rt = new Runtime(ast);
  rt.typecheck();

  print("Output:");
  var status_code = rt.run();
  //IZAAK: I don't like this, this is a convention, not a language feature?
  if(!status_code || !status_code.value) {
    print("Process ended normally");
  }
  else {
    print("Process crashed with code: " + status_code.value);
  }
  
  return status_code.value;
}

/*
code = `
int x = 2;
int x = 1;
int y = 0;
int foo(int x) {
  puts(x);
  return x;
}
int main() {
  puts(2 * x);
  return foo(y);
}
`;

console.log(interpret(code));
*/
