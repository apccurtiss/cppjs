"use strict";

var ast = require('./ast');

function preprocess(node) {
  var defines = {
    'NULL': new ast.Lit(new ast.TypBase('int'), 0),
    'nullptr': new ast.Lit(new ast.TypBase('int'), 0),
    // NOTE(alex) Should this be allowed?
    'endl': new ast.Lit(new ast.TypBase('string'), '\n'),
  };

  function pp(node) {
    if(node instanceof ast.Var) {
      if(node.name in defines) {
        return defines[node.name];
      }
    }
    return node.apply(pp);
  }

  return pp(node);
}

module.exports = {
  preprocess: preprocess,
};
