"use strict";

var ast = require('./ast');
var errors = require('./errors');

function verifyTyps(typ1, typ2) {
  return true;
}

function typecheck(node) {
  var typs = {
    char: new ast.TypBase('char'),
    bool: new ast.TypBase('bool'),
    int: new ast.TypBase('int'),
    float: new ast.TypBase('float'),
    void: new ast.TypBase('void'),
  };

  function getTyp(node, env) {
    if(node instanceof ast.TypBase || node instanceof ast.TypPtr ||
       node instanceof ast.TypArr || node instanceof ast.TypObj ||
       node instanceof ast.TypFn) {
      return node;
    }
    else if(node instanceof ast.TypName) {
      return typs[node.typ];
    }
    else if(node instanceof ast.Lit) {
      return node.typ;
    }
    else if(node instanceof ast.Var) {
      if(node.name in env) {
        return env[node.name];
      }
      throw new errors.CJSTypeError(node.name + ' was not declared');
    }
    else if(node instanceof ast.Decl) {
      env[node.name] = node.typ;
      if(node.init) verifyTyps(getTyp(node.init, env), node.typ);
      return typs.void;
    }
    else if(node instanceof ast.Uop) {
      var t1 = getTyp(node.e1, env);
      return t1;
    }
    else if(node instanceof ast.Bop) {
      var t1 = getTyp(node.e1, env), t2 = getTyp(node.e2, env);
      return t1;
    }
    else if(node instanceof ast.Ternary) {
      var t1 = getTyp(node.e1, env), t2 = getTyp(node.e2, env), t3 = getTyp(node.e3, env);
      return t1;
    }
    else if(node instanceof ast.Nop) {
      return typs.void;
    }
    else if(node instanceof ast.MemberAccess) {
      return getTyp(node.e1, env);
    }
    else if(node instanceof ast.IndexAccess) {
      var ti = getTyp(node.index, env);
      verifyTyps(ti, typs.int);
      return getTyp(node.e1, env);
    }
    else if(node instanceof ast.Deref) {
      var t1 = getTyp(node.e1, env);
      if(!(t1 instanceof ast.TypPtr)) {
        throw new errors.CJSTypeError('Must dereference pointer, not ' + t1.toString());
      }
      return t1.typ;
    }
    else if(node instanceof ast.Fn) {
      env[node.name] = node.ret;
      var newEnv = Object.assign({}, env);
      for(var p of node.params) {
        newEnv[p.name] = p.typ;
      }
      var tb = getTyp(node.body, newEnv);
      // TODO(alex): Fill out
      return new ast.TypFn(node.ret, []);
    }
    else if(node instanceof ast.Call) {
      var tf = getTyp(node.fn, env);
      var ta = node.args.map((a) => getTyp(a, env));
      return tf.ret;
    }
    else if(node instanceof ast.Return) {
      // TODO(alex): Figure out this ties in with ast.Fn
      var t1 = getTyp(node.e1, env);
      return typs.void;
    }
    else if(node instanceof ast.Loop) {
      var tc = getTyp(node.cond, env);
      var tb = getTyp(node.body, env);
      return typs.void;
    }
    else if(node instanceof ast.If) {
      var tc = getTyp(node.cond, env);
      var tb = getTyp(node.body, env);
      return typs.void;
    }
    else if(node instanceof ast.Seq) {
      node.elems.map((e) => getTyp(e, env));
      return typs.void;
    }
    else if(node instanceof ast.ObjTmpl) {
      var fields = {};
      for(var decl of node.publ.concat(node.priv)) {
        getTyp(decl, env);
        if(decl instanceof ast.Fn) {
          fields[decl.name] = new ast.TypFn(decl.ret, decl.params);
        }
        else {
          fields[decl.name] = getTyp(decl.typ);
        }
      }
      typs[node.name] = new ast.TypObj(node.name, fields);
      return typs.void;
    }
    else if(node instanceof ast.Scope) {
      var newEnv = Object.assign({}, env);
      getTyp(node.body, newEnv);
      return typs.void;
    }
    else if(node instanceof ast.Steppoint) {
      return getTyp(node.body, env);
    }
    throw Error('Unimplemented type: ' + node.constructor.name);
  }

  getTyp(node, {
    'cout': typs.void,
    'endl': typs.string,
  });

  return typs;
}

module.exports = {
  verify: (node) => typecheck(node),
}
