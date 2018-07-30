"use strict";

var ast = require('./ast');
var mem = require('./memory');

function Program(compiled_code, options) {
  this.onPrint = options.onPrint || ((text) => {});
  this.onFnCall = options.onFnCall || ((name, vars) => {});
  this.onFnEnd = options.onFnEnd || ((name, ret) => {});
  this.onDynamicAllocation = options.onDynamicAllocation || ((type, loc) => {});
  this.onAssign = options.onAssign || ((name, val) => {});
  this.errorFormat = options.errorFormat || 'cjs';
  this.types = compiled_code.types;

  var functions = {
    '!print': new ast.Builtin((p) => {
      this.onPrint(String(valueOf(p)));
      return new ast.Var('!print');
    }),
  };

  for(var fn of compiled_code.functions) {
    functions[fn.name] = fn;
  }

  var memory = new mem.MemoryModel(functions, compiled_code.typedefs);

  function valueOf(leaf) {
    if(leaf instanceof ast.Lit) {
      return leaf.val;
    }
    else {
      console.assert(ast.isReducedLValue(leaf));
      return memory.lookupLValue(leaf);
    }
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

    else if(current instanceof ast.TypFn) {
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
            return next(new ast.Lit(new ast.TypBase('int'), -valueOf(v1)));
          case '+':
            return next(v1);
          case 'new':
            var loc = memory.malloc(v1);
            this.onDynamicAllocation(v1, loc)
            return next(new ast.Lit(new ast.TypBase('int'), loc));
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
              memory.setLValue(v1, undefined, valueOf(v2));
              this.onAssign(v1, valueOf(v2));
              return next(v2);
            case '+':
              return next(new ast.Lit('int', valueOf(v1) + valueOf(v2)));
            case '-':
              return next(new ast.Lit('int', valueOf(v1) - valueOf(v2)));
            case '*':
              return next(new ast.Lit('int', valueOf(v1) * valueOf(v2)));
            case '/':
              return next(new ast.Lit('int', Math.floor(valueOf(v1) / valueOf(v2))));
            case '%':
              return next(new ast.Lit('int', valueOf(v1) % valueOf(v2)));
            case '==':
              return next(new ast.Lit('bool', valueOf(v1) == valueOf(v2)));
            case '!=':
              return next(new ast.Lit('bool', valueOf(v1) != valueOf(v2)));
            case '<':
              return next(new ast.Lit('bool', valueOf(v1) < valueOf(v2)));
            case '>':
              return next(new ast.Lit('bool', valueOf(v1) > valueOf(v2)));
            case '<=':
              return next(new ast.Lit('bool', valueOf(v1) <= valueOf(v2)));
            case '>=':
              return next(new ast.Lit('bool', valueOf(v1) >= valueOf(v2)));
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
        return next(new ast.Deref(new ast.Lit(undefined, valueOf(v1))));
      });
    }

    else if(current instanceof ast.Return) {
      return this.stepgen(current.e1, (v1) => {
        var ret_val = new ast.Lit(undefined, valueOf(v1));
        return memory.lookupLValue(new ast.Var('!retptr'))(ret_val);
      });
    }

    else if(current instanceof ast.Call) {
      return this.stepgen(current.fn, (v1) => {
        var fn = valueOf(v1);
        if(fn instanceof ast.Builtin) {
          console.assert(current.args.length == 1);
          return this.stepgen(current.args[0], (r) => {
            return next(fn.f.apply(null, [r]))
          });
        }
        else {
          // console.log('V1:', v1);
          // console.log('Fn:', fn);
          console.assert(current.args.length == fn.params.length);
          var args = {};
          return current.args.reduceRight((acc, h, i) => {
            return this.stepgen(h, (v) => {
              args[fn.params[i].name] = valueOf(v);
              return acc;
            });
          }, (_) => {
            // Give state information to user
            this.position = current.position;
            this.onFnCall(fn.name, fn.frame);
            for(var a in args) {
              this.onAssign(new ast.Var(a), args[a]);
            }

            // This function will be called when the function returns
            var onRet = (r) => {
              this.onFnEnd(fn.name, r);
              memory.ret();
              return next(r);
            };

            // Add stack frame to memory
            memory.call(fn, args, onRet);

            return this.stepgen(fn.body, (_) => onRet(new ast.Lit()));
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
        if(valueOf(r)) {
          return this.stepgen(current.body, (_) => this.stepgen(current, next));
        }
        else {
          return next(undefined);
        }
      });
    }

    else if(current instanceof ast.If) {
      return this.stepgen(current.cond, (r) => {
        if(valueOf(r)) {
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
}
