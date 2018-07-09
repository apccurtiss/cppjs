var ast = require('./ast');

function preprocess(node) {
  var types = {
    'char': new ast.TypBase('char'),
    'bool': new ast.TypBase('bool'),
    'int': new ast.TypBase('int'),
    'float': new ast.TypBase('float'),
  }

  function lookupTyp(t) {
    while(t instanceof ast.TypName) t = types[t.typ];
    return t;
  }

  function pp(node) {
    if(node instanceof ast.Fn) {
      var frame = {};
      node.body.apply((node) => {
        if(node instanceof ast.Decl) {
          // console.log(node);
          frame[node.name] = lookupTyp(node.typ);
        }
        return node;
      });
      return new ast.Fn(node.ret, node.name, node.params, node.body, frame);
    }
    if(node instanceof ast.ObjTmpl) {
      fields = {};
      for(decl of node.publ.concat(node.priv)) {
        fields[decl.name] = lookupTyp(decl.typ);
      }
      types[node.name] = new ast.TypObj(node.name, fields);
      return node;
    }
    else if(node instanceof ast.TypName) {
      return types[node.typ];
    }
    else {
      return node;
    }
  }

  return node.apply(pp);
}

module.exports = {
  preprocess: preprocess,
};
