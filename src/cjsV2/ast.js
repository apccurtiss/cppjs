module.exports = {
  Typ: function Typ(typ, ptrs) {
    this.typ = typ;
    this.ptrs = ptrs;
  },

  Lit: function Lit(typ, val) {
    this.typ = typ;
    this.val = val;
  },

  Decl: function Decl(typ, name) {
    this.typ = typ;
    this.name = name;
  },

  Uop: function Uop(op, e1) {
    this.op = op;
    this.e1 = e1;
  },

  Bop: function Bop(op, e1, e2) {
    this.op = op;
    this.e1 = e1;
    this.e2 = e2;
  },

  Top: function Top(op, e1, e2) {
    this.op = op;
    this.e1 = e1;
    this.e2 = e2;
    this.e3 = e3;
  },

  Fn: function Fn(ret, name, params, body) {
    this.ret = ret;
    this.name = name;
    this.params = params;
    this.body = body;
  },

  ObjTmpl: function ObjTmpl(publ, priv) {
    this.publ = publ;
    this.priv = priv;
  },

  Call: function Call(fn, args) {
    this.fn = fn;
    this.args = args;
  },

  Loop: function Loop(cond, body) {
    this.cond = cond;
    this.body = body;
  },

  If: function If(cond, body) {
    this.cond = cond;
    this.body = body;
  },

  Scope: function Scope(body) {
    this.body = body;
  },
}
