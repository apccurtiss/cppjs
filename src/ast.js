module.exports = {
  // Types
  TypName: function(typ) {
    this.typ = typ;
    this.asString = () => typ;

    this.apply = function(f){ return f(this); }
  },

  TypBase: function(typ) {
    this.typ = typ;
    this.asString = () => typ;

    this.apply = function(f){ return f(this); }
  },

  TypPtr: function(typ) {
    this.typ = typ;
    this.asString = () => typ.asString() + '*';

    this.apply = function(f){ return f(new module.exports.TypPtr(this.typ.apply(f))); }
  },

  TypArr: function(typ, size) {
    this.typ = typ;
    this.size = size;
    this.asString = () => typ.asString() + (size == undefined) ? '[]' : '[' + size + ']';

    this.apply = function(f){ return f(new module.exports.TypArr(this.typ.apply(f), size)); }
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
        fields[field] = this.fields[field].apply(f);
      }
      return f(new module.exports.TypObj(this.name, fields));
    };
  },

  // AST nodes

  Lit: function(typ, val) {
    this.typ = typ;
    this.val = val;

    this.apply = function(f){ return f(this); }
  },

  Var: function(name) {
    this.name = name;

    this.apply = function(f){ return f(this); }
  },

  Decl: function(typ, name, val) {
    this.typ = typ;
    this.name = name;
    this.val = val;

    this.apply = function(f){ return f(new module.exports.Decl(this.typ.apply(f), this.name, this.val ? this.val.apply(f) : this.val)); }
  },

  Uop: function(op, e1) {
    this.op = op;
    this.e1 = e1;

    this.apply = function(f){ return f(new module.exports.Uop(this.op, this.e1.apply(f))); }
  },

  Bop: function(op, e1, e2) {
    this.op = op;
    this.e1 = e1;
    this.e2 = e2;

    this.apply = function(f){ return f(new module.exports.Bop(this.op, this.e1.apply(f), this.e2.apply(f))); }
  },

  Ternary: function(cond, e1, e2) {
    this.cond = cond;
    this.e1 = e1;
    this.e2 = e2;

    this.apply = function(f){ return f(new module.exports.Ternary(this.cond.apply(f), this.e1.apply(f), this.e2.apply(f))); }
  },

  Nop: function() {
    this.apply = function(f){ return f(this); }
  },

  MemberAccess: function(e1, field) {
    this.e1 = e1;
    this.field = field;

    this.apply = function(f){ return f(new module.exports.MemberAccess(this.e1.apply(f), this.field)); }
  },

  IndexAccess: function(e1, index) {
    this.e1 = e1;
    this.index = index;

    this.apply = function(f){ return f(new module.exports.IndexAccess(this.e1.apply(f), this.index)); }
  },

  Deref: function(e1) {
    this.e1 = e1;

    this.apply = function(f){ return f(new module.exports.Deref(this.e1.apply(f))); }
  },

  Fn: function(ret, name, params, body, frame) {
    this.ret = ret;
    this.name = name;
    this.params = params;
    this.body = body;
    this.frame = frame;

    this.apply = function(f){ return f(new module.exports.Fn(this.ret, this.name, this.params.map((x) => x.apply(f)), this.body.apply(f), this.frame)); }
  },

  ObjTmpl: function(name, publ, priv) {
    this.name = name;
    this.publ = publ;
    this.priv = priv;

    this.apply = function(f){ return f(this); }
  },

  Call: function(fn, args, position) {
    this.fn = fn;
    this.args = args;
    // Call is the one AST node that stores it's position, because it's
    // position is set during the function call step.
    this.position = position;

    this.apply = function(f){ return f(new module.exports.Call(f(fn), this.args.map((x) => x.apply(f)), this.position)); }
  },

  Return: function(e1) {
    this.e1 = e1;

    this.apply = function(f){ return f(new module.exports.Return(this.e1.apply(f))); }
  },

  Loop: function(cond, body) {
    this.cond = cond;
    this.body = body;

    this.apply = function(f){ return f(new module.exports.Loop(this.cond.apply(f), this.body.apply(f))); }
  },

  If: function(cond, body) {
    this.cond = cond;
    this.body = body;

    this.apply = function(f){ return f(new module.exports.If(this.cond.apply(f), this.body.apply(f))); }
  },

  Scope: function(stmts) {
    this.stmts = stmts;

    this.apply = function(f){ return f(new module.exports.Scope(this.stmts.map((x) => x.apply(f)))); }
  },

  CFile: function(decls) {
    this.decls = decls;


    this.apply = function(f){
      return f(new module.exports.CFile(this.decls.map((x) => x.apply(f))))
    };
  },

  // Compiler created

  Steppoint: function(position, body) {
    this.position = position;
    this.body = body;

    this.apply = function(f){ return f(new module.exports.Steppoint(this.position, this.body.apply(f))); }
  },

  Builtin: function(f) {
    this.f = f;

    this.apply = function(f){ return f(this); }
  },
}
