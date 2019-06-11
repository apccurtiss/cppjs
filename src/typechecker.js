"use strict";

var ast = require('./ast');
var errors = require('./errors');
var memory = require('./memory');

function typ2str(typ) {
  if(typ instanceof ast.TypBase) {
    return typ.typ;
  }
  else if(typ instanceof ast.TypPtr || typ instanceof ast.TypArr) {
    return `${typ2str(typ.typ)}*`;
  }
  else if(typ instanceof ast.TypObj) {
    return typ.name;
  }
  else {
    throw new errors.CJSUnimplementedError(`Unimplemented type to stringify: ${typ.constructor.name}`)
  }
}

function coercible(typ1, typ2) {
  if(typ1 instanceof ast.TypBase && typ2 instanceof ast.TypBase) {
    return typ1.typ == typ2.typ;
  }
  else if(typ1 instanceof ast.TypObj && typ2 instanceof ast.TypObj) {
    return typ1.name == typ2.name;
  }
  else if(typ1 instanceof ast.TypPtr) {
    if(typ2 instanceof ast.TypPtr) {
      return coercible(typ1.typ, typ2.typ);
    }
    else if(typ2 instanceof ast.TypBase) {
      return typ2.typ == 'int';
    }
    else {
      return false;
    }
  }
  else {
    return false;
  }
}

function typecheck(tree) {
  var typs = {
    char: new ast.TypBase('char'),
    bool: new ast.TypBase('bool'),
    int: new ast.TypBase('int'),
    float: new ast.TypBase('float'),
    void: new ast.TypBase('void'),
  };

  function getTyp(node, env) {
    // Types
    if(node instanceof ast.TypBase) {
      return [node, node];
    }

    else if(node instanceof ast.TypPtr) {
      var [ptrTyp, _] = getTyp(node.typ, env);
      var typ = new ast.TypPtr(ptrTyp);
      return [typ, typ];
    }

    else if(node instanceof ast.TypArr) {
      var [elementTyp, _] = getTyp(node.typ, env);
      var [size, sizeTyp] = getTyp(node.size, env);
      var typ = new ast.TypArr(elementTyp, size);
      return [typ, typ];
    }

    else if(node instanceof ast.TypObj) {
      var fields = node.fields.map((f) => {
        var [typ, _] = getTyp(f.typ, env);
        return new ast.ObjField(f.name, f.visibility, typ, f.init);
      });

      // Created early to allow recursive references through 'this'.
      var typ = new ast.TypObj(node.name, fields);
      var thisTyp = new ast.TypPtr(typ);
      var objEnv = Object.assign({ 'this': thisTyp, }, env);

      for(var f of fields) {
        if(f.init) {
          var [init, _] = getTyp(f.init, objEnv);
          // Add 'this' as the first parameter if it's a function.
          if(f.typ instanceof ast.TypFn) {
            init.params.unshift(new ast.Decl(thisTyp, 'this'));
            init.frame['this'] = thisTyp;
          }
          f.init = init;
        }
      }

      return [typ, typ];
    }

    else if(node instanceof ast.TypFn) {
      var [ret, _] = getTyp(node.ret, env);
      var params = node.params.map((p) => {
        var [param, _] = getTyp(p, env);
        return param;
      });
      var typ = new ast.TypFn(ret, params);
      return [typ, typ];
    }

    else if(node instanceof ast.TypName) {
      if(!(node.name in typs)) {
        throw errors.CJSTypeError("Unknown type: " + node.name, node.codeIndex());
      }
      var typ = typs[node.name];
      return [typ, typ];
    }

    // LValues
    else if(node instanceof ast.Var) {
      if(!(node.name in env)) {
        var that = env['this'];
        if(that) {
          for(var field of that.typ.fields) {
            if(field.name == node.name) {
              return [new ast.MemberAccess(new ast.Deref(new ast.Var('this', that), that.typ), field.name, that.typ), field.typ];
            }
          }
        }
        throw new errors.CJSTypeError(`${node.name} was not declared`, node.codeIndex());
      }
      return [new ast.Var(node.name, env[node.name]), env[node.name]];
    }

    else if(node instanceof ast.MemberAccess) {
      var [e1, t1] = getTyp(node.e1, env);
      if(!(t1 instanceof ast.TypObj)) {
        throw new errors.CJSTypeError(`Can only access the member '${node.field}' of an object, not a value of type ''${t1.asString()}'`, node.codeIndex);
      }
      for(var field of t1.fields) {
        if(field.name == node.field) {
          return [new ast.MemberAccess(e1, node.field, t1), field.typ];
        }
      }
      throw new errors.CJSTypeError(`An object of type '${t1.name}' has no field named '${node.field}'`, node.codeIndex());
    }

    else if(node instanceof ast.IndexAccess) {
      var [e1, t1] = getTyp(node.e1, env);
      var [index, tindex] = getTyp(node.index, env);
      return [new ast.IndexAccess(e1, index, t1), t1.typ];
    }

    else if(node instanceof ast.Deref) {
      var [e1, t1] = getTyp(node.e1, env);
      if(!(t1 instanceof ast.TypPtr)) {
        throw new errors.CJSTypeError(`${t1.toString()} is not a pointer type, so it cannot be dereferenced.`, node.codeIndex());
      }
      return [new ast.Deref(e1, t1), t1.typ];
    }

    // Others
    else if(node instanceof ast.Lit) {
      return [node, node.typ];
    }

    else if(node instanceof ast.ObjField) {
      var [typ, _] = getTyp(node.typ, env);
      if(node.init) {
        var [init, tinit] = getTyp(node.init, env);
        return [new ast.ObjField(node.name, node.visibility, typ, init), typs.void];
      }
      return [new ast.ObjField(node.name, node.visibility, typ, node.init), typs.void];
    }

    else if(node instanceof ast.Typedef) {
      if(node.typ instanceof ast.TypName) {
        var [typ, _] = getTyp(node.typ, env);
        typs[node.name] = typ;
      }
      else {
        // Object created prematurely and filled later in case of recursive types.
        typs[node.name] = new node.typ.constructor();
        var [typ, _] = getTyp(node.typ, env);
        for(var f in typ) typs[node.name][f] = typ[f];
      }
      return [new ast.Typedef(node.name, typ), typs.void];
    }

    else if(node instanceof ast.Decl) {
      var [typ, _] = getTyp(node.typ, env);
      env[node.name] = typ;
      if(node.init) {
        var [init, initTyp] = getTyp(node.init, env);
        return [new ast.Decl(typ, node.name, init), typs.void];
      }
      return [new ast.Decl(typ, node.name, node.init), typs.void];
    }

    else if(node instanceof ast.Uop) {
      var [e1, t1] = getTyp(node.e1, env);
      switch(node.op) {
        case '&':
        case 'new':
          return [new ast.Uop(node.op, e1), new ast.TypPtr(t1)];
        default:
          return [new ast.Uop(node.op, e1), t1];
      }
    }

    else if(node instanceof ast.Bop) {
      var [e1, t1] = getTyp(node.e1, env), [e2, t2] = getTyp(node.e2, env);
      return [new ast.Bop(node.op, e1, e2), t1];
    }

    else if(node instanceof ast.Ternary) {
      var [cond, tcond] = getTyp(node.cond, env), [e1, t1] = getTyp(node.e1, env), [e2, t2] = getTyp(node.e2, env);
      return [new ast.Ternary(cond, e1, e2), t1];
    }

    else if(node instanceof ast.Nop) {
      return [node, typs.void];
    }

    else if(node instanceof ast.Fn) {
      var [ret, _] = getTyp(node.ret, env);
      var params = node.params.map((p) => {
        var [param, _] = getTyp(p.typ, env);
        return new ast.Decl(param, p.name);
      });
      var typ = new ast.TypFn(ret, params.map((x) => x.typ));

      env[node.name] = typ;
      var newEnv = Object.assign({}, env);
      for(var p of params) {
        newEnv[p.name] = p.typ;
      }

      var frame = {};
      for(var v in node.frame) {
        var [ftyp, _] = getTyp(node.frame[v], newEnv);
        frame[v] = ftyp;
      }
      var [body, _] = getTyp(node.body, newEnv);
      return [new ast.Fn(ret, node.name, params, body, frame, node.position), typ];
    }

    else if(node instanceof ast.Call) {
      var [fn, tfn] = getTyp(node.fn, env);
      var args = node.args.map((a, i) => {
        var [arg, targ] = getTyp(a, env);
        return arg;
      });
      return [new ast.Call(fn, args, node.position), tfn.ret];
    }
    
    else if(node instanceof ast.Return) {
      // TODO(alex): Figure out how to figure out what t1 needs to be
      var [e1, t1] = getTyp(node.e1, env);
      return [new ast.Return(e1), typs.void];
    }

    else if(node instanceof ast.Loop) {
      var [cond, tcond] = getTyp(node.cond, env);
      var [body, tbody] = getTyp(node.body, env);
      return [new ast.Loop(cond, body), typs.void];
    }

    else if(node instanceof ast.If) {
      var [cond, tcond] = getTyp(node.cond, env);
      var [body, _] = getTyp(node.body, env);
      if(node.orelse) {
        var [orelse, _] = getTyp(node.orelse, env);
        return [new ast.If(cond, body, orelse), typs.void];
      }
      return [new ast.If(cond, body, node.orelse), typs.void];
    }

    else if(node instanceof ast.Seq) {
      var elems = node.elems.map((e) => {
        var [elem, _] = getTyp(e, env);
        return elem;
      });
      return [new ast.Seq(elems), typs.void];
    }

    else if(node instanceof ast.Scope) {
      var newEnv = Object.assign({}, env);
      var [body, _] = getTyp(node.body, newEnv);
      return [new ast.Scope(body), typs.void];
    }

    else if(node instanceof ast.Steppoint) {
      var [body, tbody] = getTyp(node.body, env);
      return [new ast.Steppoint(node.position, body), tbody];
    }

    throw errors.CJSUnimplementedError(`Unimplemented type to typecheck: ${node.constructor.name}`);
  }

  var builtinEnv = {
    'cout': new ast.TypObj('cout', []),
    'endl': typs.string,
  };

  var [flatTree, _] = getTyp(tree, builtinEnv);

  return flatTree;
}

module.exports = {
  typecheck: (node) => typecheck(node),
}
