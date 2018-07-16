"use strict";

var ast = require('./ast');

function preprocess(node) {
  function pp(node) {
    if(node instanceof ast.Fn) {
      var frame = {};
      for(var p of node.params) {
        frame[p.name] = p.typ;
      }
      function countVars(node) {
        if(node instanceof ast.Decl) {
          frame[node.name] = node.typ;
        }
        return node.apply(countVars);
      }
      countVars(node.body);
      return new ast.Fn(pp(node.ret), node.name, node.params, pp(node.body), frame);
    }
    else if(node instanceof ast.Uop) {
      // TODO(alex): Move conversion from Var to TypName into parsing step
      if(node.op == 'new') {
        return new ast.Uop('new', new ast.TypName(node.e1.name));
      }
    }
    return node.apply(pp);
  }

  return pp(node);
}

module.exports = {
  preprocess: preprocess,
};
