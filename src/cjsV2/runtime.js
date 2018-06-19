function Program(options) {
  if(!options.ast) {
    throw Exception('AST undefined.');
  }
  this.ast = options.ast;
  console.log(this.ast);
  this.onPrint = options.onPrint || ((text) => {console.log(text)});
  this.onVarDecl = options.onVarDecl || (() => {});
  this.errorFormat = options.errorFormat || 'cjs';

  this.memory = {};

  this.run = function() {

  };

  this.step = function() {
    throw Exception('Unimplemented');
  };
}

module.exports = {
  Program: Program,
}
