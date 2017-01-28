var tokenize = require("./tokenizer");
var parse = require("./parser");
var Runtime = require("./runtime");

function CAlert(message, position) {
  this.name = 'CAlert';
  this.stack = (new Error()).stack;
  this.message = message || '';
}
CAlert.prototype = Object.create(Error.prototype);
CAlert.prototype.constructor = CAlert;

global.c_program = function(code) {
  var compiledCode;
  var rt;
  this.load = function(code) {
    compiledCode = parse(tokenize(code));
    rt = new Runtime(compiledCode);
  }
  this.step = function() {
    if(!rt) {
      throw new CAlert('No program loaded!');
    }
    rt.step(1);
    return rt.getCurrentLine();
  }
  this.reset = function() {
    rt = new Runtime(compiledCode);
  }
  this.dumpStack = function() {
    return rt.dumpStack();
  }
  this.identifyDataStructure = function() {
    return rt.identifyDataStructure();
  }
  if(code) {
    this.load(code);
  }
}
