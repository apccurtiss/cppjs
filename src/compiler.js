"use strict";

var ast = require('./ast');
var parser = require('./parser');
var runtime = require('./runtime');
var typechecker = require('./typechecker');
var pp = require('./preprocesser');

function compile(preprocessedAst) {
  var fns = [];
  var steppoints = [];
  var typecheckedAst = typechecker.typecheck(preprocessedAst);

  function cmpl(node) {
    if(node instanceof ast.TypPtr) {
      return node;
    }
    else if(node instanceof ast.Steppoint) {
      steppoints.push(node.position);
      return node.apply(cmpl);
    }
    else if(node instanceof ast.TypObj) {
      var fields = node.fields.map((field) => {
        if(field.typ instanceof ast.TypFn) {
          fns.push(field.init);
        }
        return cmpl(field);
      });

      return new ast.TypObj(node.name, fields, node.constructors);
    }
    // Don't recurse on LValue types - there's no need, and it could go infinite.
    else if(node instanceof ast.Var) {
      return node;
    }
    else if(node instanceof ast.Deref) {
      return new ast.Deref(cmpl(node.e1), node.e1typ);
    }
    else if(node instanceof ast.MemberAccess) {
      return new ast.MemberAccess(cmpl(node.e1), node.field, node.e1typ);
    }
    else if(node instanceof ast.IndexAccess) {
      return new ast.IndexAccess(cmpl(node.e1), cmpl(node.index), node.e1typ);
    }
    else if(node instanceof ast.Fn) {
      var new_fn = node.apply(cmpl);
      fns.push(new_fn);
      return new_fn;
    }
    else if(node instanceof ast.Scope) {
      // No need for scopes at run time - they can get removed
      return cmpl(node.body);
    }
    else if(node instanceof ast.Seq) {
      // Sequences of one element are reduced to that single element
      if(node.elems.length == 0) {
        return new ast.Nop();
      }
      if(node.elems.length == 1) {
        return cmpl(node.elems[0]);
      }
      // Nested sequences are flattened as much as possible
      var elems = [];
      for(var elem of node.elems) {
        var compiled_elem = cmpl(elem);
        if(compiled_elem instanceof ast.Seq) {
          elems = elems.concat(compiled_elem.elems);
        }
        else {
          elems.push(compiled_elem);
        }
      }
      return new ast.Seq(elems);
    }
    else if(node instanceof ast.Decl) {
      if(node.init) {
        return new ast.Bop('=', new ast.Var(node.name), cmpl(node.init));
      }
    }
    else if(node instanceof ast.Uop) {
      var c_e1 = cmpl(node.e1);
      switch(node.op) {
        // case 'new':
        // return new ast.Call(new ast.Var('!malloc'), [c_e1]);
        // TODO(alex): Avoid side effect duplication.
        case '++':
          return new ast.Bop('=', c_e1,
            new ast.Bop('+', c_e1, new ast.Lit(new ast.TypBase('int'), 1)));
        case '--':
          return new ast.Bop('=', c_e1,
            new ast.Bop('-', c_e1, new ast.Lit(new ast.TypBase('int'), 1)));
        default:
          return new ast.Uop(node.op, c_e1);
      }
    }
    else if(node instanceof ast.Bop) {
      var c_e1 = cmpl(node.e1);
      var c_e2 = cmpl(node.e2);
      switch(node.op) {
        case '<<':
        if(c_e1.name == 'cout') {
          return new ast.Call(new ast.Var('!print'), [c_e2]);
        }
        default:
          return new ast.Bop(node.op, c_e1, c_e2);
      }
    }
    return node.apply(cmpl);
  }

  var compiledAst = cmpl(typecheckedAst);

  return {
    ast: compiledAst,
    functions: fns,
    steppoints: steppoints,
  }
}

// var lit1 = new ast.Lit(new ast.TypBase('int'), 1)
//
// console.log(
//   compile(new ast.Fn(new ast.TypBase('int'), 'main', [], new ast.Scope(new ast.Seq([]))))
// )

module.exports = {
  compile: (code, options) => {
    var parsedAst = parser.parseFile(code);
    var preprocessedAst = pp.preprocess(parsedAst);
    var compiledAst = compile(preprocessedAst);
    return new runtime.Program(compiledAst, options || {});
  },
  ast: ast,
  initMemory: runtime.initMemory,
};
