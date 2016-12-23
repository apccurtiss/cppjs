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

  var rt = new Runtime(ast);
  rt.typecheck();

  console.log("Output:");
  var status_code = rt.run();
  if(!status_code || !status_code.value) {
    console.log("Process ended normally");
  }
  else {
    console.log("Process crashed with code: " + status_code.value);
  }

}

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

interpret(code);
