"use strict";

var ast = require('./ast');

function typecheck(node) {
  var types = {
    'char': new ast.TypBase('char'),
    'bool': new ast.TypBase('bool'),
    'int': new ast.TypBase('int'),
    'float': new ast.TypBase('float'),
    'void': new ast.TypBase('void'),
  };

  function checkTyp(node) {
    if(node instanceof ast.ObjTmpl) {
      var fields = {};
      for(var decl of node.publ.concat(node.priv)) {
        if(decl instanceof ast.Fn) {
          fields[decl.name] = new ast.TypFn(decl.ret, decl.params);
        }
        else {
          fields[decl.name] = decl.typ;
        }
      }
      types[node.name] = new ast.TypObj(node.name, fields);
    }
    return node.apply(checkTyp);
  }

  checkTyp(node);

  return types;
}

module.exports = {
  verify: (node) => typecheck(node),
}
