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


module.exports = function(code, print_func) {
  this.pp = preprocess(code);

  this.tokens = Tokenize(this.pp);

  this.ast = Parse(this.tokens);

  var rt = new Runtime(this.ast, print_func);
  rt.typecheck();


  this.run = function() {
    var status_code = rt.run();
    return status_code ? status_code.value : 0 ;
  }
}
