/*
 *  Preprocessor
 */
function preprocess(code) {
  return code;
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


function interpret(code) {
  var pp = preprocess(code);

  var tokens = Tokenize(pp);
  console.log("Tokens:");
  console.log(tokens);

  var ast = Parse(tokens);
  console.log("AST:")
  console.log(ast);

  var env = new Runtime(ast);
  env.typecheck();

  console.log("Output:");
  var status_code = env.run().value;
  console.log("Exited with code " + status_code);
}

code = `
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

interpret(code);
