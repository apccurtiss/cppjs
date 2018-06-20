var ast = require('./ast');

function Program(options) {
  if(!options.ast) {
    throw Error('AST undefined.');
  }
  this.ast = options.ast;
  this.onPrint = options.onPrint || ((text) => {console.log(text)});
  this.onVarDecl = options.onVarDecl || (() => {});
  this.errorFormat = options.errorFormat || 'cjs';

  this.memory = {};

  this.run = function() {
    var step = this.getStepper();
    while(step = step());
  };

  this.getStepper = function() {
    return this.step(this.ast, (x) => null);
  };

  this.step = function(current, next) {
    if(current instanceof ast.Lit) {
      return next(current.val);
    }
    else if(current instanceof ast.Var) {
      return next(this.memory[current.name]);
    }
    else if(current instanceof ast.Scope) {
      // Calls first continuation now
      return current.body.reduceRight(
        (acc, h) => {
          var ret = (_) => this.step(h, (_) => acc);
          ret.position = h.position;
          return ret;
        }, next);
    }
    else if(current instanceof ast.Bop) {
      return this.step(current.e1, (v1) =>
        this.step(current.e2, (v2) => {
          switch(current.op) {
            case '+':
              return next(v1 + v2);
            case '-':
              return next(v1 - v2);
            case '<<':
              this.onPrint(v2);
              return next(v2);
            case '=':
              this.memory[v1] = v2;
              return next(v2);
            default:
              throw Error('Unimplemented bop: ' + current.op);
          }
        })
      );
    }
    else if(current instanceof ast.Decl) {
      return next()
      // this.memory[name]
    }
    throw Error('Unimplemented type: ' + current.constructor.name);
  }
}

module.exports = {
  Program: Program,
}
