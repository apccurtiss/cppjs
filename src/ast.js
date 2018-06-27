module.exports = {
  // User created
  Typ: function Typ(typ, ptrs) {
    this.typ = typ;
    this.ptrs = ptrs;
  },

  Lit: function Lit(typ, val) {
    this.typ = typ;
    this.val = val;
  },

  Ptr: function Ptr(typ, addr) {
    this.typ = typ;
    this.addr = addr;
  },

  Ident: function Ident(name) {
    this.name = name;
  },

  Var: function Var(name) {
    this.name = name;
  },

  Decl: function Decl(typ, name, val) {
    this.typ = typ;
    this.name = name;
    this.val = val;
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

  MemberAccess: function MemberAccess(e1, field) {
    this.e1 = e1;
    this.field = field;
  },

  Assign: function Assign(e1, e2) {
    this.e1 = e1;
    this.e2 = e2;
  },

  Fn: function Fn(ret, name, params, body) {
    this.ret = ret;
    this.name = name;
    this.params = params;
    this.body = body;
  },

  ObjTmpl: function ObjTmpl(name, publ, priv) {
    this.name = name;
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

  Scope: function Scope(stmts) {
    this.stmts = stmts;
  },

  File: function File(decls) {
    this.decls = decls;
  },

  // Compiler created

  Steppoint: function Steppoint(position, body) {
    this.position = position;
    this.body = body;
  },

  Builtin: function Builtin(f) {
    this.f = f;
  },

  Frame: function Frame(fn, offsets, size) {
    this.f = f;
  },

  // Runtime objects

  Obj: function Obj(typ, publ, priv) {
    this.typ = typ;
    this.publ = publ;
    this.priv = priv;
  },

}
