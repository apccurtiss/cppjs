var ast = require('./ast');
var parser = require('./parser');
var pp = require('./preprocesser');

function cmpl(node) {
  if(node instanceof ast.Decl) {
    if(node.val) {
      return new ast.Bop('=', new ast.Var(node.name), node.val.apply(cmpl));
    }
    return node;
  }
  else if(node instanceof ast.Uop) {
    switch(node.op) {
      case 'new':
        return new ast.Call(new ast.Var('!malloc'), [node.e1]);
      case '*':
        return new ast.Deref(node.e1.apply(cmpl));
      // TODO(alex): Avoid side effect duplication.
      case '++':
        return new ast.Bop('=', node.e1.apply(cmpl),
          new ast.Bop('+', node.e1.apply(cmpl), new ast.Lit(new ast.TypBase('int'), 1)));
      case '--':
        return new ast.Bop('=', node.e1.apply(cmpl),
          new ast.Bop('-', node.e1.apply(cmpl), new ast.Lit(new ast.TypBase('int'), 1)));
      default:
        return new ast.Uop(node.op, node.e1.apply(cmpl));
    }
  }
  else if(node instanceof ast.Bop) {
    switch(node.op) {
      case '<<':
        if(node.e1.name == 'cout') {
          return new ast.Call(new ast.Var('!print'), [node.e2.apply(cmpl)]);
        }
      default:
        return new ast.Bop(node.op, node.e1.apply(cmpl), node.e2.apply(cmpl));
    }
  }
  else {
    return node;
  }
}

module.exports = {
  compileFile: (code) => {
    var parsed = parser.parseFile(code);
    // console.log('parsed: ');
    // console.log(parsed.decls[1].body.stmts[0]);
    var ppd = pp.preprocess(parsed);
    // console.log('ppd: ');
    // console.log(ppd.decls[1].body.stmts[0]);
    // console.log('ppd.apply(cmpl): ');
    // console.log(ppd.apply(cmpl).decls[1].body.stmts[0]);
    return ppd.apply(cmpl);
  },
  compileStmt: (code) => pp.preprocess(parser.parseStmt(code)).apply(cmpl),
  compileExpr: (code) => pp.preprocess(parser.parseExpr(code)).apply(cmpl),
};
