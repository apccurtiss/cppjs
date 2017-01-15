var tokenize = require("./tokenizer");
var tarse = require("./parser");
var Runtime = require("./runtime");

global.c_program = function(code) {
  var compiledCode;
  var program;
  this.load = function(code) {
    compiledCode = parse(tokenize(code));
    program = new Runtime(compiledCode);
  }
  this.step = function() {
    program.step(1);
    return program.getCurrentLine();
  }
  this.reset = function() {
    program = new Runtime(compiledCode);
  }
  if(code) {
    this.load(code);
  }
}
