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


module.exports = function interpret(code) {
  console.log();
  var pp = preprocess(code);

  var tokens = Tokenize(pp);
  //IZAAK: I'd love a way to do a quiet mode.
  // console.log("Tokens:");
  // console.log(tokens);

  var ast = Parse(tokens);
  // console.log("AST:")
  // console.log(ast);

  var rt = new Runtime(ast);
  rt.typecheck();

  console.log("Output:");
  var status_code = rt.run();
  //IZAAK: I don't like this, this is a convention, not a language feature?
  if(!status_code || !status_code.value) {
    console.log("Process ended normally");
  }
  else {
    console.log("Process crashed with code: " + status_code.value);
  }
  return status_code.value;
}
