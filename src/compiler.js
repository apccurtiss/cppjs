var ast = require('./ast');

function cmpl(node) {
  if(node instanceof ast.Typ || node instanceof ast.Lit ||
     node instanceof ast.Var || node instanceof ast.Ident ||
     node instanceof ast.ObjTmpl) {
    return node;
  }
  else if(node instanceof ast.Decl) {
    if(node.val) {
      return new ast.Bop('=', new ast.Var(node.name), cmpl(node.val));
    }
  }
  else if(node instanceof ast.Uop) {
    if(node.op == 'new') {
      return new ast.Call(new ast.Var('!malloc'), [node.e1]);
    }
    return new ast.Uop(node.op, cmpl(node.e1));
  }
  else if(node instanceof ast.Bop) {
    switch(node.op) {
      // case '=':
      //   return new ast.Assign(cmpl(node.e1), cmpl(node.e2));
      case '.':
        return new ast.MemberAccess(cmpl(node.e1), node.e2.name);
      case '->':
        return new ast.MemberAccess(new ast.Uop('*', cmpl(node.e1)), node.e2.name);
      case '<<':
        if(node.e1.name == 'cout') {
          return new ast.Call(new ast.Var('!print'), [cmpl(node.e2)]);
        }
      default:
        return new ast.Bop(node.op, cmpl(node.e1), cmpl(node.e2));
    }
  }
  else if(node instanceof ast.Top) {
    return new ast.Top(node.op, cmpl(node.e1), cmpl(node.e2), cmpl(node.e3));
  }
  else if(node instanceof ast.Fn) {
    frame = {};
    var frameWalker = new ast.Walker((node) => {
      if(node instanceof ast.Decl) {
        frame[node.name] = node.typ;
      }
    });
    frameWalker.walk(node.body);
    return new ast.Fn(node.ret, node.name, node.params, cmpl(node.body), frame);
  }
  else if(node instanceof ast.Call) {
    return new ast.Call(cmpl(node.fn), node.args.map(cmpl));
  }
  else if(node instanceof ast.Loop) {
    return new ast.Loop(cmpl(node.cond), cmpl(node.body));
  }
  else if(node instanceof ast.If) {
    return new ast.If(cmpl(node.cond), cmpl(node.body));
  }
  else if(node instanceof ast.Scope) {
    return new ast.Scope(node.stmts.map(cmpl));
  }
  else if(node instanceof ast.File) {
    return new ast.File(node.decls.map(cmpl));
  }
  else if(node instanceof ast.Steppoint) {
    return new ast.Steppoint(node.position, cmpl(node.body));
  }
  else {
    throw Error('Unimplemented type: ' + node.constructor.name);
  }
}

module.exports = {
  compile: cmpl,
};
