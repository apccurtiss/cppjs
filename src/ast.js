function Typ(typ, ptrs) {
  this.typ = typ;
  this.ptrs = ptrs;
  this.toString = () => {
    return typ + Array(ptrs+1).join('*');
  }
}

function Lit(typ, val) {
  this.typ = typ;
  this.val = val;
}

function Ptr(typ, addr) {
  this.typ = typ;
  this.addr = addr;
}

function Ident(name) {
  this.name = name;
}

function Var(name) {
  this.name = name;
}

function Decl(typ, name, val) {
  this.typ = typ;
  this.name = name;
  this.val = val;
}

function Uop(op, e1) {
  this.op = op;
  this.e1 = e1;
}

function Bop(op, e1, e2) {
  this.op = op;
  this.e1 = e1;
  this.e2 = e2;
}

function Top(op, e1, e2) {
  this.op = op;
  this.e1 = e1;
  this.e2 = e2;
  this.e3 = e3;
}

function MemberAccess(e1, field) {
  this.e1 = e1;
  this.field = field;
}

function Assign(e1, e2) {
  this.e1 = e1;
  this.e2 = e2;
}

function Fn(ret, name, params, body, frame) {
  this.ret = ret;
  this.name = name;
  this.params = params;
  this.body = body;
  this.frame = frame;
}

function ObjTmpl(name, publ, priv) {
  this.name = name;
  this.publ = publ;
  this.priv = priv;
}

function Call(fn, args) {
  this.fn = fn;
  this.args = args;
}

function Loop(cond, body) {
  this.cond = cond;
  this.body = body;
}

function If(cond, body) {
  this.cond = cond;
  this.body = body;
}

function Scope(stmts) {
  this.stmts = stmts;
}

function File(decls) {
  this.decls = decls;
}

// Compiler created

function Steppoint(position, body) {
  this.position = position;
  this.body = body;
}

function Builtin(f) {
  this.f = f;
}

function Frame(fn, offsets, size) {
  this.f = f;
}

// Runtime objects

function Obj(typ, publ, priv) {
  this.typ = typ;
  this.publ = publ;
  this.priv = priv;
}

function Walker(fn) {
  function walk(node) {
    fn(node);
    if(node instanceof Typ || node instanceof Lit ||
       node instanceof Var || node instanceof Ident ||
       node instanceof ObjTmpl) {
      return node;
    }
    else if(node instanceof Decl) {
      return new Decl(node.name, walk(node.val));
    }
    else if(node instanceof Uop) {
      return new Uop(node.op, walk(node.e1));
    }
    else if(node instanceof Bop) {
      return new Bop(node.op, walk(node.e1), walk(node.e2));
    }
    else if(node instanceof Top) {
      return new Top(node.op, walk(node.e1), walk(node.e2), walk(node.e3));
    }
    else if(node instanceof Fn) {
      return new Fn(node.ret, node.name, node.params, walk(node.body), node.frame);
    }
    else if(node instanceof Call) {
      return new Call(walk(node.fn), node.args.map(walk));
    }
    else if(node instanceof Loop) {
      return new Loop(walk(node.cond), walk(node.body));
    }
    else if(node instanceof If) {
      return new If(walk(node.cond), walk(node.body));
    }
    else if(node instanceof Scope) {
      return new Scope(node.stmts.map(walk));
    }
    else if(node instanceof File) {
      return new File(node.decls.map(walk));
    }
    else if(node instanceof Steppoint) {
      return new Steppoint(node.position, walk(node.body));
    }
    else {
      throw Error('Unimplemented type: ' + node.constructor.name);
    }
  }

  this.walk = walk;
}

module.exports = {
  Typ: Typ,
  Lit: Lit,
  Ptr: Ptr,
  Ident: Ident,
  Var: Var,
  Decl: Decl,
  Uop: Uop,
  Bop: Bop,
  Top: Top,
  MemberAccess: MemberAccess,
  Assign: Assign,
  Fn: Fn,
  ObjTmpl: ObjTmpl,
  Call: Call,
  Loop: Loop,
  If: If,
  Scope: Scope,
  File: File,
  Steppoint: Steppoint,
  Builtin: Builtin,
  Frame: Frame,
  Obj: Obj,
  Walker: Walker,
}
