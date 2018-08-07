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
    // TODO(alex): Move frame calculation to typechecker
    if(node instanceof ast.Var) {
      if(node.name in defines) {
        return defines[node.name];
      }
    }
    // else if(node instanceof ast.TypObj) {
    //   function handleField(field) {
    //     if(field.typ instanceof ast.TypFn) {
    //       function addThis(node) {
    //         if(node instanceof ast.Var && node.name[0] != '!' && !(node.name in field.frame)) {
    //           return new ast.MemberAccess(new ast.Deref(new ast.Var('this')), node.name);
    //         }
    //         return node.apply(addThis);
    //       }
    //       var new_body = addThis(cmpl(field.init.body));
    //       var method = new ast.Fn(field.init.ret, field.init.name,
    //         [new ast.Decl(undefined, 'this')].concat(field.init.params), new_body, field.init.frame);
    //       console.log('Pushing method:', method.body);
    //       fns.push(method);
    //       return method;
    //     }
    //     return cmpl(field);
    //   }
    //
    //   var fields = node.fields.map(handleField);
    //
    //   return new ast.TypObj(node.name, fields);
    // }
    return node.apply(pp);
  }

  return pp(node);
}

module.exports = {
  preprocess: preprocess,
};
