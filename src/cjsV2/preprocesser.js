var ast = require('./ast');

var types = {
  'char': 1,
  'bool': 1,
  'int': 4,
  'float': 4,
}

function pp(node) {
  console.log(node)
  if(node instanceof ast.Typ || node instanceof ast.Lit ||
     node instanceof ast.Var || node instanceof ast.Ident ||
     node instanceof ast.ObjTmpl) {
    return node;
  }
  else if(node instanceof ast.Decl) {
    if(node.val) {
      return new ast.Bop('=', new ast.Var(node.name), pp(node.val));
    }
  }
  else if(node instanceof ast.Uop) {
    if(node.op == 'new') {
      return new ast.Call(new ast.Var('!malloc'), [node.e1]);
    }
    return new ast.Uop(node.op, pp(node.e1));
  }
  else if(node instanceof ast.Bop) {
    switch(node.op) {
      case '.':
        return new ast.MemberAccess(node.e1, node.e2.name);
      case '->':
        return new ast.MemberAccess(new ast.Uop('*', node.e1), node.e2.name);
      case '<<':
        if(node.e1.name == 'cout') {
          return new ast.Call(new ast.Var('!print'), [node.e2]);
        }
      default:
        return new ast.Bop(node.op, pp(node.e1), pp(node.e2));
    }
  }
  else if(node instanceof ast.Top) {
    return new ast.Top(node.op, pp(node.e1), pp(node.e2), pp(node.e3));
  }
  else if(node instanceof ast.Fn) {
    return new ast.Fn(node.ret, node.name, node.params, pp(node.body));
  }
  else if(node instanceof ast.Call) {
    return new ast.Call(pp(node.fn), node.args.map(pp));
  }
  else if(node instanceof ast.Loop) {
    return new ast.Loop(pp(node.cond), pp(node.body));
  }
  else if(node instanceof ast.If) {
    return new ast.If(pp(node.cond), pp(node.body));
  }
  else if(node instanceof ast.Scope) {
    return new ast.Scope(node.stmts.map(pp));
  }
  else if(node instanceof ast.File) {
    return new ast.File(node.decls.map(pp));
  }
  else {
    throw Error('Unimplemented type: ' + node.constructor.name);
  }
};

module.exports = {
  preprocess: pp,
};
