"use strict";

var ast = require('./ast');
var mem = require('./memory');

function Program(compiled_code, options) {
  function deferErrors(f) {
    if(!f) return () => {};
    return (...args) => {
      try {
        f(...args);
      }
      catch(e) {
        console.error(e);
      };
    }
  }
  this.onPrint = deferErrors(options.onPrint);
  this.onFnCall = deferErrors(options.onFnCall);
  this.onFnEnd = deferErrors(options.onFnEnd);
  this.onDynamicAllocation = deferErrors(options.onDynamicAllocation);
  this.onAssign = deferErrors(options.onAssign);
  this.onPositionChange = deferErrors(options.onPositionChange);
  this.errorFormat = options.errorFormat || 'cjs';
  this.types = compiled_code.types;
  this.steppoints = compiled_code.steppoints;

  var functions = {
    '!print': new ast.Builtin((p) => {
      this.onPrint(String(valueOf(p)));
      return new ast.Var('!print');
    }),
  };

  for(var fn of compiled_code.functions) {
    functions[fn.name] = fn;
  }

  var memory = new mem.MemoryModel(functions);

  function valueOf(leaf) {
    if(leaf instanceof ast.Lit) {
      return leaf.val;
    }
    else {
      console.assert(ast.isReducedLValue(leaf));
      return memory.valueOfLValue(leaf);
    }
  }

  this.stepgen = function(current, next) {
    if(current instanceof ast.Builtin || current instanceof ast.Nop ||
      current instanceof ast.Lit || current instanceof ast.Var ||
      current instanceof ast.TypPtr || current instanceof ast.TypBase ||
      current instanceof ast.TypFn) {
      return next(current);
    }

    // Types

    else if(current instanceof ast.TypArr) {
      return this.stepgen(current.typ,
        (vt) => this.stepgen(current.size,
          (vs) => next(new ast.TypArr(vt, vs))));
    }

    else if(current instanceof ast.TypObj) {
      var fields = current.fields.reduce((acc, f) => {
        return this.stepgen(f, (fv) => {
          acc.push(fv);
          return acc;
        });
      }, []);
      return next(new ast.TypObj(current.name, fields, current.constructors));
    }

    // LValues

    else if(current instanceof ast.MemberAccess) {
      return this.stepgen(current.e1, (v1) => {
        return next(new ast.MemberAccess(v1, current.field, current.e1typ));
      });
    }

    else if(current instanceof ast.IndexAccess) {
      return this.stepgen(current.e1, (v1) => {
        return this.stepgen(current.index, (v2) => {
          return next(new ast.IndexAccess(v1, v2, current.e1typ));
        });
      });
    }

    else if(current instanceof ast.Deref) {
      return this.stepgen(current.e1, (v1) => {
        return next(new ast.Deref(new ast.Lit(current.e1typ, valueOf(v1)), current.e1typ));
      });
    }

    // Other AST Nodes

    else if(current instanceof ast.ObjField) {
      return this.stepgen(current.typ,
        (tv) => {
          if(current.init) {
            return this.stepgen(current.init,
              (iv) => next(new ast.ObjField(current.name, current.visibility, tv, iv)));
          }
          return next(new ast.ObjField(current.name, current.visibility, tv, current.init));
        });
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
          case '&':
            return next(new ast.Lit(new ast.TypPtr(v1.typ), memory.addrOfLValue(v1)));
          case '!':
            return next(new ast.Lit(new ast.TypBase('bool'), !valueOf(v1)));
          case 'new':
            var loc = memory.malloc(v1);
            this.onDynamicAllocation(v1, loc);
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
      return this.stepgen(current.e1, (e1) =>
        this.stepgen(current.e2, (e2) => {
          switch(current.op) {
            case '=':
              var v2 = valueOf(e2);
              memory.setLValue(e1, v2);
              this.onAssign(e1, v2);
              return next(e2);
            case '+':
              return next(new ast.Lit('int', valueOf(e1) + valueOf(e2)));
            case '-':
              return next(new ast.Lit('int', valueOf(e1) - valueOf(e2)));
            case '*':
              return next(new ast.Lit('int', valueOf(e1) * valueOf(e2)));
            case '/':
              return next(new ast.Lit('int', Math.floor(valueOf(e1) / valueOf(e2))));
            case '%':
              return next(new ast.Lit('int', valueOf(e1) % valueOf(e2)));
            case '==':
              return next(new ast.Lit('bool', valueOf(e1) == valueOf(e2)));
            case '!=':
              return next(new ast.Lit('bool', valueOf(e1) != valueOf(e2)));
            case '<':
              return next(new ast.Lit('bool', valueOf(e1) < valueOf(e2)));
            case '>':
              return next(new ast.Lit('bool', valueOf(e1) > valueOf(e2)));
            case '<=':
              return next(new ast.Lit('bool', valueOf(e1) <= valueOf(e2)));
            case '>=':
              return next(new ast.Lit('bool', valueOf(e1) >= valueOf(e2)));
            default:
              throw Error('Unimplemented bop: ' + current.op);
          }
        })
      );
    }

    else if(current instanceof ast.Return) {
      return this.stepgen(current.e1, (v1) => {
        var ret_val = new ast.Lit(undefined, valueOf(v1));
        return memory.valueOfLValue(new ast.Var('!retptr'))(ret_val);
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
          var args = current.args;
          if(v1 instanceof ast.MemberAccess) {
            args.unshift(new ast.Lit(new ast.TypPtr(v1.e1typ), memory.addrOfLValue(v1.e1)));
          }
          var argVals = {};
          console.assert(args.length == fn.params.length);
          return args.reduceRight((acc, h, i) => {
            return this.stepgen(h, (v) => {
              argVals[fn.params[i].name] = valueOf(v);
              return acc;
            });
          }, (_) => {
            // Give state information to user
            if(v1 instanceof ast.MemberAccess) {
              var fnName = v1.e1typ.name + '::' + fn.name;
              var argList = fn.params.slice(1).map((p) => argVals[p.name]);
            }
            else {
              var fnName = fn.name;
              var argList = fn.params.map((p) => argVals[p.name]);
            }
            this.onPositionChange(current.position);
            this.onFnCall(fnName, argList, fn.frame, fn.position);
            for(var a in argVals) {
              this.onAssign(new ast.Var(a), argVals[a]);
            }

            // This function will be called when the function returns
            var onRet = (r) => {
              this.onFnEnd(fn.name, r);
              memory.ret();
              return next(r);
            };

            // Add stack frame to memory
            memory.call(fn, argVals, onRet);

            return this.stepgen(fn.body, (_) => onRet(new ast.Lit()));
          });
        }
      });
    }

    else if(current instanceof ast.Steppoint) {
      return (_) => {
        this.onPositionChange(current.position);
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
    console.trace("Here:")
    throw Error('Unimplemented type: ' + '"' + current.constructor.name) + '"';
  }

  var stepper = this.stepgen(new ast.Call(new ast.Var('main'), []), (_) => {
    this.onPositionChange(null);
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
  initMemory: mem.initMemory,
}
