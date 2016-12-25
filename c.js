/*
 *  Preprocessor
 */

// flag for verbosity

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


module.exports = function Program(code) {
  this.pp = preprocess(code);

  this.tokens = Tokenize(this.pp);

  this.ast = Parse(this.tokens);

  var rt = new Runtime(this.ast);
  rt.typecheck();

  var status_code = rt.run();
  this.status_code = status_code ? status_code.value : 0 ;
}
