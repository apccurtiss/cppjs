"use strict";

var ast = require('./ast');
// var compiler = require('./compiler');

function Program(compiled_code, options) {
  this.onPrint = options.onPrint || ((text) => {});
  this.onFnCall = options.onFnCall || ((name, vars) => {});
  this.onFnEnd = options.onFnEnd || ((name, ret) => {});
  this.onDynamicAllocation = options.onDynamicAllocation || ((type, loc) => {});
  this.onAssign = options.onAssign || ((name, val) => {});
  this.errorFormat = options.errorFormat || 'cjs';
  this.types = compiled_code.types;

  this.stack = [{}];

  this.heap = {};

  this.globals = {
    'NULL': 0,
    'nullptr': 0,
    'endl': '\n',
    '!print': new ast.Builtin((p) => {
      this.onPrint(String(this.getVal(p)));
      return new ast.Var('!print');
    }),
    '!malloc': new ast.Builtin((typ) => {
      var loc = this.generateHeapAddress(4);
      this.heap[loc] = this.initMemory(typ);
      this.onDynamicAllocation(typ, loc);
      return new ast.Lit(new ast.TypPtr(typ), loc);
    }),
  };

  let i = 10000;
  this.generateHeapAddress = function(size) {
    for (;;) {
      i += size;
      return i-size;
    }
  }

  this.initMemory = function(typ) {
    if(typ instanceof ast.TypBase) {
      switch(typ.typ) {
        case 'string':
          return '';
        default:
          return 0;
      }
    }
    if(typ instanceof ast.TypPtr) {
      return undefined;
    }
    else if(typ instanceof ast.TypArr) {
      var newArr = Array(typ.size.val);
      for(var i = 0; i < newArr.length; i++) {
        newArr[i] = this.initMemory(typ.typ);
      }
      return newArr;
    }
    else if(typ instanceof ast.TypObj) {
      return Object.keys(typ.fields).reduce(
        (acc, h) => {
          if(!(typ.fields[h] instanceof ast.TypFn)) {
            acc[h] = this.initMemory(typ.fields[h]);
          }
          return acc;
        }, {});
    }
    else if(typ instanceof ast.TypName) {
      return this.initMemory(this.types[typ.typ]);
    }
    else {
      throw Error('Unsupported type: ' + typ.constructor.name)
    }
  };

  this.getMemory = function(loc) {
    if (loc instanceof ast.IndexAccess){
      return this.getMemory(loc.e1)[this.getVal(loc.index)];
    }
    else if (loc instanceof ast.MemberAccess){
      return this.getMemory(loc.e1)[loc.field];
    }
    else {
      var currentStackFrame = this.stack[this.stack.length-1];
      if(loc instanceof ast.Var) {
        if(loc.name in currentStackFrame) {
          return currentStackFrame[loc.name];
        }
        return this.globals[loc.name];
      }
      else {
        return this.heap[loc.e1.val];
      }
    }
  }

  this.setMemory = function(loc, val) {
    if (loc instanceof ast.IndexAccess){
      this.getMemory(loc.e1)[this.getVal(loc.index)] = val;
    }
    else if (loc instanceof ast.MemberAccess){
      this.getMemory(loc.e1)[loc.field] = val;
    }
    else {
      var currentStackFrame = this.stack[this.stack.length-1];
      if(loc instanceof ast.Var) {
        if(loc.name in currentStackFrame) {
          currentStackFrame[loc.name] = val;
        }
        this.globals[loc.name] = val;
      }
      else {
        this.heap[loc.e1.val] = val;
      }
    }
  }

  this.getVal = function(leaf) {
    if(leaf instanceof ast.Var || leaf instanceof ast.Deref) {
      return this.getMemory(leaf);
    }
    else if(leaf instanceof ast.IndexAccess) {
      return this.getMemory(leaf.e1)[this.getVal(leaf.index)];
    }
    else if(leaf instanceof ast.MemberAccess) {
      return this.getMemory(leaf.e1)[leaf.field];
    }
    else if(leaf instanceof ast.Lit) {
      return leaf.val;
    }
    else {
      throw Error('Internal error: Expression was not variable, index, deref, member access, or value!');
    }
  }

  for(var fn of compiled_code.functions) {
    this.globals[fn.name] = fn;
  }

  this.stepgen = function(current, next) {
    if(current instanceof ast.Builtin || current instanceof ast.TypBase ||
      current instanceof ast.Lit || current instanceof ast.Var
      || current instanceof ast.Nop) {
      return next(current);
    }

    else if(current instanceof ast.TypPtr) {
      return this.stepgen(current.typ,
        (vt) => next(new ast.TypPtr(vt)));
    }

    else if(current instanceof ast.TypName) {
      return next(current);
    }

    else if(current instanceof ast.TypArr) {
      return this.stepgen(current.typ,
        (vt) => this.stepgen(current.size,
          (vs) => next(new ast.TypArr(vt, vs))));
    }

    else if(current instanceof ast.TypObj) {
      var fields = Object.keys(current.fields).reduce((acc, h) => {
        return this.stepgen(current.fields[h], (hv) => {
          acc[h] = hv;
          return acc;
        });
      }, {});
      return next(new ast.TypObj(current.name, fields));
    }

    else if(current instanceof ast.Seq) {
      return current.elems.slice(0,-1).reduceRight((acc, h, i) => {
        return this.stepgen(h, (_) => {
          return acc;
        });
      }, this.stepgen(current.elems[current.elems.length-1], next));
    }

    else if(current instanceof ast.Uop) {
      return this.stepgen(current.e1, (v1) => {
        switch(current.op) {
          case '-':
            return next(new ast.Lit('int', -this.getVal(v1)));
          case '+':
            return next(v1);
          default:
            throw Error('Unimplemented uop: ' + current.op);
        }
      });
    }

    else if(current instanceof ast.Decl) {
      return next(undefined);
    }

    else if(current instanceof ast.Bop) {
      return this.stepgen(current.e1, (v1) =>
        this.stepgen(current.e2, (v2) => {
          switch(current.op) {
            case '=':
              this.setMemory(v1, this.getVal(v2));
              this.onAssign(v1, this.getVal(v2));
              return next(v2);
            case '+':
              return next(new ast.Lit('int', this.getVal(v1) + this.getVal(v2)));
            case '-':
              return next(new ast.Lit('int', this.getVal(v1) - this.getVal(v2)));
            case '*':
              return next(new ast.Lit('int', this.getVal(v1) * this.getVal(v2)));
            case '/':
              return next(new ast.Lit('int', Math.floor(this.getVal(v1) / this.getVal(v2))));
            case '%':
              return next(new ast.Lit('int', this.getVal(v1) % this.getVal(v2)));
            case '==':
              return next(new ast.Lit('bool', this.getVal(v1) == this.getVal(v2)));
            case '!=':
              return next(new ast.Lit('bool', this.getVal(v1) != this.getVal(v2)));
            case '<':
              return next(new ast.Lit('bool', this.getVal(v1) < this.getVal(v2)));
            case '>':
              return next(new ast.Lit('bool', this.getVal(v1) > this.getVal(v2)));
            case '<=':
              return next(new ast.Lit('bool', this.getVal(v1) <= this.getVal(v2)));
            case '>=':
              return next(new ast.Lit('bool', this.getVal(v1) >= this.getVal(v2)));
            default:
              throw Error('Unimplemented bop: ' + current.op);
          }
        })
      );
    }

    else if(current instanceof ast.MemberAccess) {
      return this.stepgen(current.e1, (v1) => {
        return next(new ast.MemberAccess(v1, current.field));
      });
    }

    else if(current instanceof ast.IndexAccess) {
      return this.stepgen(current.e1, (v1) => {
        return this.stepgen(current.index, (v2) => {
          return next(new ast.IndexAccess(v1, v2));
        });
      });
    }

    else if(current instanceof ast.Deref) {
      return this.stepgen(current.e1, (v1) => {
        return next(new ast.Deref(new ast.Lit(undefined, this.getVal(v1))));
      });
    }

    else if(current instanceof ast.Return) {
      return this.stepgen(current.e1, (v1) => {
        var ret_val = new ast.Lit(undefined, this.getVal(v1));
        return this.stack[this.stack.length - 1]['!retptr'](ret_val);
      });
    }

    else if(current instanceof ast.Call) {
      return this.stepgen(current.fn, (v1) => {
        v1 = this.getVal(v1);
        if(v1 instanceof ast.Builtin) {
          console.assert(current.args.length == 1);
          return this.stepgen(current.args[0], (r) => {
            return next(v1.f.apply(null, [r]))
          });
        }
        else {
          var retptr = (r) => {
            this.onFnEnd(v1.name, r);
            this.stack.pop();
            return next(r);
          };
          var newFrame = {
            '!retptr': retptr,
          };
          return current.args.reduceRight((acc, h, i) => {
            return this.stepgen(h, (v) => {
              newFrame[v1.params[i].name] = this.getVal(v);
              return acc;
            });
          }, (_) => {
            this.position = current.position;
            this.onFnCall(v1.name, v1.frame);
            for(var v in v1.frame) {
              if(v in newFrame) {
                this.onAssign(new ast.Var(v), newFrame[v]);
              }
              else {
                newFrame[v] = this.initMemory(v1.frame[v]);
              }
            }
            this.stack.push(newFrame);
            return this.stepgen(v1.body, (_) => retptr(new ast.Lit()));
          });
        }
      });
    }

    else if(current instanceof ast.Steppoint) {
      return (_) => {
        this.position = current.position;
        return this.stepgen(current.body, next);
      };
    }

    else if(current instanceof ast.Loop) {
      return this.stepgen(current.cond, (r) => {
        if(this.getVal(r)) {
          return this.stepgen(current.body, (_) => this.stepgen(current, next));
        }
        else {
          return next(undefined);
        }
      });
    }

    else if(current instanceof ast.If) {
      return this.stepgen(current.cond, (r) => {
        if(this.getVal(r)) {
          return this.stepgen(current.body, (_) => next);
        }
        else if (current.orelse) {
          return this.stepgen(current.orelse, (_) => next);
        }
        else {
          return next(undefined);
        }
      });
    }
    throw Error('Unimplemented type: ' + '"' + current.constructor.name) + '"';
  }

  var stepper = this.stepgen(new ast.Call(new ast.Var('main'), []), (_) => {
    this.position = undefined;
    return null;
  });

  this.step = function() {
    if(stepper != null) {
      stepper = stepper();
    }
    return stepper;
  }

  this.run = () => {
    while(this.step());
  };
}

module.exports = {
  Program: Program,
  ast: ast,
}
