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


module.exports = function interpret(code, options) {
  if(!options) options = {};
  var pp = preprocess(code);

  var tokens = Tokenize(pp);
  print("Tokens:");
  print(tokens);

  var ast = Parse(tokens);
  print("AST:")
  print(ast);
  
  var rt = new Runtime(ast);
  rt.typecheck();

  var status_code = rt.run();
  return status_code ? status_code.value : 0 ;
}
