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


module.exports = function interpret(code, options) {
  if(!options) options = {};
  var pp = preprocess(code);

  var tokens = Tokenize(pp);
  //IZAAK: I'd love a way to do a quiet mode.
  if(options["verbose"]) {
    console.log("Tokens:");
    console.log(tokens);
  }

  var ast = Parse(tokens);
  if(options["verbose"]) {
    console.log("AST:")
    console.log(ast);
  }
  var rt = new Runtime(ast);
  rt.typecheck();

  var status_code = rt.run();
  return status_code ? status_code.value : 0  ;
}
