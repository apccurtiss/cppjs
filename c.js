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
  console.log();
  var pp = preprocess(code);

  var tokens = Tokenize(pp);
  // console.log("Tokens:");
  // console.log(tokens);

  var ast = Parse(tokens);
  // console.log("AST:")
  // console.log(ast);

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

var assign = `
int x = 1;
int main() {
  x = 2;
  print(x);
}
`;
interpret(assign);

var ref = `
int x = 1;
int main() {
  print(&x);
}
`;
interpret(ref);

var functions = `
int x = 2;
int y = 0;
int foo(int x) {
  print(x + 7);
  return x;
}
int main() {
  print(2 * x);
  return foo(y);
}
`;
interpret(functions);
