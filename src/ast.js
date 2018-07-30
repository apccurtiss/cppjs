module.exports = {
  // Types
  TypName: function(typ) {
    this.typ = typ;
    this.asString = () => typ;

    // this.apply = function(f){ return f(this); }
    this.apply = function(f){ return this; }
  },

  TypBase: function(typ) {
    this.typ = typ;
    this.asString = () => typ;

    // this.apply = function(f){ return f(this); }
    this.apply = function(f){ return this; }
  },

  TypPtr: function(typ) {
    this.typ = typ;
    this.asString = () => typ.asString() + '*';

    // this.apply = function(f){ return f(new module.exports.TypPtr(this.typ.apply(f))); }
    this.apply = function(f){ return new module.exports.TypPtr(f(this.typ)); }
  },

  TypArr: function(typ, size) {
    this.typ = typ;
    this.size = size;
    this.asString = () => typ.asString() + (size == undefined) ? '[]' : '[' + size + ']';

    // this.apply = function(f){ return f(new module.exports.TypArr(this.typ.apply(f), size)); }
    this.apply = function(f){ return new module.exports.TypArr(f(this.typ), f(size)); }
  },

  TypObj: function(name, fields) {
    this.name = name;
    this.fields = fields;
    this.asString = () => {
      if(name != undefined) {
        return name;
      }
      let ret = '{ ';
      for(field in fields) {
        ret += fields[field].asString + ' ' + field + '; ';
      }
      return ret + ' }';
    };

    this.apply = function(f){
      fields = {};
      for(field in this.fields) {
        // fields[field] = this.fields[field].apply(f);
        fields[field] = f(this.fields[field]);
      }
      // return f(new module.exports.TypObj(this.name, fields));
      return new module.exports.TypObj(this.name, fields);
    };
  },

  TypFn: function(ret, params) {
    this.ret = ret;
    this.params = params;

    // this.apply = function(f){ return f(new module.exports.TypFn(this.ret.apply(f), this.params.map((p) => p.apply(f)))); };
    this.apply = function(f){ return new module.exports.TypFn(f(this.ret), this.params.map(f)); };
  },

  // AST nodes

  Lit: function(typ, val) {
    this.typ = typ;
    this.val = val;

    // this.apply = function(f){ return f(this); }
    this.apply = function(f){ return this; }
  },

  Var: function(name) {
    this.name = name;

    // this.apply = function(f){ return f(this); }
    this.apply = function(f){ return this; }
  },

  Decl: function(typ, name, init) {
    this.typ = typ;
    this.name = name;
    this.init = init;

    // this.apply = function(f){ return f(new module.exports.Decl(this.typ.apply(f), this.name, this.init ? this.init.apply(f) : this.init )); }
    this.apply = function(f){ return new module.exports.Decl(f(this.typ), this.name, this.init ? f(this.init) : this.init ); }
  },

  Uop: function(op, e1) {
    this.op = op;
    this.e1 = e1;

    // this.apply = function(f){ return f(new module.exports.Uop(this.op, this.e1.apply(f))); }
    this.apply = function(f){ return new module.exports.Uop(this.op, f(this.e1)); }
  },

  Bop: function(op, e1, e2) {
    this.op = op;
    this.e1 = e1;
    this.e2 = e2;

    // this.apply = function(f){ return f(new module.exports.Bop(this.op, this.e1.apply(f), this.e2.apply(f))); }
    this.apply = function(f){ return new module.exports.Bop(this.op, f(this.e1), f(this.e2)); }
  },

  Ternary: function(cond, e1, e2) {
    this.cond = cond;
    this.e1 = e1;
    this.e2 = e2;

    // this.apply = function(f){ return f(new module.exports.Ternary(this.cond.apply(f), this.e1.apply(f), this.e2.apply(f))); }
    this.apply = function(f){ return new module.exports.Ternary(f(this.cond), f(this.e1), f(this.e2)); }
  },

  Nop: function() {
    // this.apply = function(f){ return f(this); }
    this.apply = function(f){ return this; }
  },

  MemberAccess: function(e1, field) {
    this.e1 = e1;
    this.field = field;

    // this.apply = function(f){ return f(new module.exports.MemberAccess(this.e1.apply(f), this.field)); }
    this.apply = function(f){ return new module.exports.MemberAccess(f(this.e1), this.field); }
  },

  IndexAccess: function(e1, index) {
    this.e1 = e1;
    this.index = index;

    // this.apply = function(f){ return f(new module.exports.IndexAccess(this.e1.apply(f), this.index)); }
    this.apply = function(f){ return new module.exports.IndexAccess(f(this.e1), f(this.index)); }
  },

  Deref: function(e1) {
    this.e1 = e1;

    // this.apply = function(f){ return f(new module.exports.Deref(this.e1.apply(f))); }
    this.apply = function(f){ return new module.exports.Deref(f(this.e1)); }
  },

  Fn: function(ret, name, params, body, frame) {
    this.ret = ret;
    this.name = name;
    this.params = params;
    this.body = body;
    this.frame = frame;

    // this.apply = function(f){ return f(new module.exports.Fn(this.ret, this.name, this.params.map((x) => x.apply(f)), this.body.apply(f), this.frame)); }
    this.apply = function(f){ return new module.exports.Fn(this.ret, this.name, this.params.map(f), f(this.body), this.frame); }
  },

  ObjTmpl: function(name, publ, priv) {
    this.name = name;
    this.publ = publ;
    this.priv = priv;

    this.apply = function(f){
      // var publ = this.publ.map((x => x.apply(f)));
      // var priv = this.priv.map((x => x.apply(f)));
      // return f(new module.exports.ObjTmpl(this.name, publ, priv));
      var publ = this.publ.map(f);
      var priv = this.priv.map(f);
      return new module.exports.ObjTmpl(this.name, publ, priv);
    }
  },

  Call: function(fn, args, position) {
    this.fn = fn;
    this.args = args;
    // Call is the one AST node that stores it's position, because it's
    // position is set during the function call step.
    this.position = position;

    // this.apply = function(f){ return f(new module.exports.Call(fn.map(f), this.args.map((x) => x.apply(f)), this.position)); }
    this.apply = function(f){ return new module.exports.Call(f(fn), this.args.map(f), this.position); }
  },

  Return: function(e1) {
    this.e1 = e1;

    // this.apply = function(f){ return f(new module.exports.Return(this.e1.apply(f))); }
    this.apply = function(f){ return new module.exports.Return(f(this.e1)); }
  },

  Loop: function(cond, body) {
    this.cond = cond;
    this.body = body;

    // this.apply = function(f){ return f(new module.exports.Loop(this.cond.apply(f), this.body.apply(f))); }
    this.apply = function(f){ return new module.exports.Loop(f(this.cond), f(this.body)); }
  },

  If: function(cond, body, orelse) {
    this.cond = cond;
    this.body = body;
    this.orelse = orelse;

    // this.apply = function(f){ return f(new module.exports.If(this.cond.apply(f), this.body.apply(f), this.orelse ? this.orelse.apply(f) : this.orelse )); }
    this.apply = function(f){ return new module.exports.If(f(this.cond), f(this.body), this.orelse ? f(this.orelse) : this.orelse ); }
  },

  Scope: function(body) {
    this.body = body;

    // this.apply = function(f){ return f(new module.exports.Scope(this.body.apply(f))); }
    this.apply = function(f){ return new module.exports.Scope(f(this.body)); }
  },

  Seq: function(elems) {
    this.elems = elems;

    // this.apply = function(f){ return f(new module.exports.Seq(this.elems.map((x) => x.apply(f)))); }
    this.apply = function(f){ return new module.exports.Seq(this.elems.map(f)); }
  },

  // Compiler created

  Steppoint: function(position, body) {
    this.position = position;
    this.body = body;

    // this.apply = function(f){ return f(new module.exports.Steppoint(this.position, this.body.apply(f))); }
    this.apply = function(f){ return new module.exports.Steppoint(this.position, f(this.body)); }
  },

  Builtin: function(f) {
    this.f = f;

    // this.apply = function(f){ return f(this); }
    this.apply = function(f){ return this; }
  },

  isReducedLValue: function isReducedLValue(node) {
    function isReduced(node) {
      if(node instanceof module.exports.Var || node instanceof module.exports.Lit) {
        return true;
      }
      else if(node instanceof module.exports.Deref) {
        return isReduced(node.e1);
      }
      else if(node instanceof module.exports.IndexAccess) {
        return isReduced(node.e1) && isReduced(node.index);
      }
      else if(node instanceof module.exports.MemberAccess) {
        return isReduced(node.e1);
      }
      return false;
    }

    return !(node instanceof module.exports.Lit) && isReduced(node)
  }
}
