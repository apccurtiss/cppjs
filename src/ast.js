module.exports = {
  // Types
  TypName: function(name) {
    this.name = name;
    this.asString = () => name;

    this.apply = function(f){ return this; }
    this.walk = function(f){ return this; }
  },

  TypBase: function(typ) {
    this.typ = typ;
    this.asString = () => typ;

    this.apply = function(f){ return this; }
    this.walk = function(f){ return this; }
  },

  TypPtr: function(typ) {
    this.typ = typ;
    this.asString = () => typ.asString() + '*';

    this.apply = function(f){ return new module.exports.TypPtr(f(this.typ)); }
    this.walk = function(f){ f(this.typ); return this; };
  },

  TypArr: function(typ, size) {
    this.typ = typ;
    this.size = size;
    this.asString = () => typ.asString() + (size == undefined) ? '[]' : '[' + size + ']';

    this.apply = function(f){ return new module.exports.TypArr(f(this.typ), f(size)); }
    this.walk = function(f){ f(this.typ); f(size); return this; };
  },

  TypObj: function(name, fields) {
    this.name = name;
    this.fields = fields;
    this.asString = () => {
      if(name != undefined) {
        return name;
      }
      let ret = '{ ';
      for(field of fields) {
        ret += field.typ == this ? this.name : field.typ.asString() + ' ' + field.name + '; ';
      }
      ret += ret + ' }';
      return ret;
    };

    this.apply = function(f){ return new module.exports.TypObj(this.name, this.fields.map(f)); };
    this.walk = function(f){ this.fields.map(f); return this; };
  },

  TypFn: function(ret, params) {
    this.ret = ret;
    this.params = params;

    this.apply = function(f){ return new module.exports.TypFn(f(this.ret), this.params.map(f)); };
    this.walk = function(f){ f(this.ret), this.params.map(f); return this; };
  },

  // LValues

  Var: function(name, typ) {
    this.name = name;
    this.typ = typ;
    this.asString = () => name;

    this.apply = function(f){ return new module.exports.Var(this.name, this.typ ? f(this.typ) : this.typ); }
    this.walk = function(f){ f(this.typ); return this; };
  },

  MemberAccess: function(e1, field, e1typ) {
    this.e1 = e1;
    this.field = field;
    this.e1typ = e1typ;
    this.asString = () => e1.asString() + '.' + field;

    this.apply = function(f){ return new module.exports.MemberAccess(f(this.e1), this.field, this.e1typ ? f(this.e1typ) : this.e1typ); }
    this.walk = function(f){ f(this.e1); f(this.e1typ); return this; };
  },

  IndexAccess: function(e1, index, e1typ) {
    this.e1 = e1;
    this.index = index;
    this.e1typ = e1typ;
    this.asString = () => e1.asString() + '[' + index.val + ']';

    this.apply = function(f){ return new module.exports.IndexAccess(f(this.e1), f(this.index), this.e1typ ? f(this.e1typ) : this.e1typ); }
    this.walk = function(f){
      f(this.e1);
      f(this.index);
      if(this.e1typ) {
        f(this.e1typ);
      }
      return this;
    };
  },

  Deref: function(e1, e1typ) {
    this.e1 = e1;
    this.e1typ = e1typ;
    this.asString = () => '*' + this.e1.asString();

    this.apply = function(f){ return new module.exports.Deref(f(this.e1), this.e1typ ? f(this.e1typ) : this.e1typ); }
    this.walk = function(f){
      f(this.e1);
      if(this.e1typ) {
        f(this.e1typ);
      }
      return this;
    };
  },

  // Expressions

  Uop: function(op, e1) {
    this.op = op;
    this.e1 = e1;

    this.apply = function(f){ return new module.exports.Uop(this.op, f(this.e1)); }
    this.walk = function(f){ f(this.e1); return this; };
  },

  Bop: function(op, e1, e2) {
    this.op = op;
    this.e1 = e1;
    this.e2 = e2;

    this.apply = function(f){ return new module.exports.Bop(this.op, f(this.e1), f(this.e2)); }
    this.walk = function(f){ f(this.e1); f(this.e2); return this; };
  },

  Ternary: function(cond, e1, e2) {
    this.cond = cond;
    this.e1 = e1;
    this.e2 = e2;

    this.apply = function(f){ return new module.exports.Ternary(f(this.cond), f(this.e1), f(this.e2)); }
    this.walk = function(f){ f(this.cond); f(this.e1); f(this.e2); return this; };
  },

  Nop: function() {
    this.apply = function(f){ return this; }
    this.walk = function(f){ return; return this; };
  },

  Lit: function(typ, val) {
    this.typ = typ;
    this.val = val;
    this.asString = () => val;

    this.apply = function(f){ return this; }
    this.walk = function(f){ return this; };
  },

  Call: function(fn, args, position) {
    this.fn = fn;
    this.args = args;
    this.position = position;

    this.apply = function(f){ return new module.exports.Call(f(fn), this.args.map(f), this.position); }
    this.walk = function(f){ f(fn); this.args.map(f); return this; };
  },

  // Statements

  Decl: function(typ, name, init) {
    this.typ = typ;
    this.name = name;
    this.init = init;

    this.apply = function(f){ return new module.exports.Decl(f(this.typ), this.name, this.init ? f(this.init) : this.init ); }
    this.walk = function(f){
      f(this.typ);
      if(this.init) {
        f(this.init);
      }
      return this;
    };
  },

  Fn: function(ret, name, params, body, frame, position) {
    this.ret = ret;
    this.name = name;
    this.params = params;
    this.body = body;
    this.frame = frame;
    this.position = position;

    this.apply = function(f){
      var newFrame = {};
      for(var v in this.frame) {
        newFrame[v] = f(this.frame[v]);
      }
      return new module.exports.Fn(f(this.ret), this.name, this.params.map(f), f(this.body), newFrame, this.position);
    }
    this.walk = function(f){ f(this.ret); f(this.name); this.params.map(f); f(this.body); return this; };
  },

  Typedef: function(name, typ) {
    this.name = name;
    this.typ = typ;

    this.apply = function(f){ return new module.exports.Typedef(this.name, f(this.typ)); };
    this.walk = function(f){ f(this.typ); return this; };
  },

  Return: function(e1) {
    this.e1 = e1;

    this.apply = function(f){ return new module.exports.Return(f(this.e1)); }
    this.walk = function(f){ f(this.e1); return this; };
  },

  Loop: function(cond, body) {
    this.cond = cond;
    this.body = body;

    this.apply = function(f){ return new module.exports.Loop(f(this.cond), f(this.body)); }
    this.walk = function(f){ f(this.cond); f(this.body); return this; };
  },

  If: function(cond, body, orelse) {
    this.cond = cond;
    this.body = body;
    this.orelse = orelse;

    this.apply = function(f){ return new module.exports.If(f(this.cond), f(this.body), this.orelse ? f(this.orelse) : this.orelse ); }
    this.walk = function(f){
      f(this.cond);
      f(this.body);
      if(this.orelse) {
        f(this.orelse);
      }
      return this;
    };
  },

  Scope: function(body) {
    this.body = body;

    this.apply = function(f){ return new module.exports.Scope(f(this.body)); }
    this.walk = function(f){ f(this.body); return this; }
  },

  Seq: function(elems) {
    this.elems = elems;

    this.apply = function(f){ return new module.exports.Seq(this.elems.map(f)); }
    this.walk = function(f){ this.elems.map(f); return this; }
  },

  // Compiler metadata

  Steppoint: function(position, body) {
    this.position = position;
    this.body = body;

    this.apply = function(f){ return new module.exports.Steppoint(this.position, f(this.body)); }
    this.walk = function(f){ f(this.body); return this; }
  },


  ObjField: function(name, visibility, typ, init) {
    this.name = name;
    this.visibility = visibility;
    this.typ = typ;
    this.init = init;

    this.apply = function(f){ return new module.exports.ObjField(this.name, this.visibility, f(this.typ), this.init ? f(this.init) : this.init) };
    this.walk = function(f){
      f(this.typ);
      if(this.init) {
        f(this.init);
      }
      return this;
    };
  },

  Builtin: function(f) {
    this.f = f;

    this.apply = function(f){ return this; }
    this.walk = function(f){ return this; }
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
