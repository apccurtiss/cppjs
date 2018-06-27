"use strict";

var ast = require('./ast');
var parser = require('./parser');
var compiler = require('./compiler');

function Program(options) {
  this.onPrint = options.onPrint || ((text) => {console.log(text)});
  this.onFnCall = options.onFnCall || ((name, vars) => {});
  this.onDynamicAllocation = options.onDynamicAllocation || ((type, loc) => {});
  this.onAssign = options.onAssign || ((name, val) => {});
  this.errorFormat = options.errorFormat || 'cjs';

  let i = 10000;
  this.generateHeapAddress = function(size) {
    for (;;) {
      // console.log("I: ", i)
      i += size;
      return i-size;
    }
  }

  this.memory = {
    '!print': new ast.Builtin((p) => {
      // console.log("Printing: ", p);
      console.log(this.getVal(p));
      return new ast.Var('!print');
    }),
    '!malloc': new ast.Builtin((typ) => {
      var loc = this.generateHeapAddress(4);
      this.memory[loc] = {};
      this.onDynamicAllocation(typ, loc);
      // console.log("Here:", loc)
      return new ast.Lit('ptr', loc);
    }),
  };

  this.getMemory = function(loc) {
    if(loc instanceof ast.Var) {
      return this.memory[loc.name];
    }
    else if (loc instanceof ast.Lit){
      return this.memory[loc.val];
    }
    else if (loc instanceof ast.MemberAccess){
      return this.getMemory(loc.e1)[loc.field];
    }
    else {
      throw Error('Internal error: Location was not a var, lit, or member access.');
    }
  }

  this.setMemory = function(loc, val) {
    if(loc instanceof ast.Var) {
      this.memory[loc.name] = val;
    }
    else if (loc instanceof ast.Lit){
      this.memory[loc.val] = val;
    }
    else if (loc instanceof ast.MemberAccess){
      this.getMemory(loc.e1)[loc.field] = val;
    }
    else {
      throw Error('Internal error: Location was not a var, lit, or member access.');
    }
  }

  this.getVal = function(leaf) {
    if(leaf instanceof ast.Var) {
      return this.getMemory(leaf);
    }
    else if(leaf instanceof ast.MemberAccess) {
      // console.log("Memory: ", this.memory)
      // console.log("e1: ", leaf.e1)
      return this.getMemory(leaf.e1)[leaf.field];
    }
    else if(leaf instanceof ast.Lit) {
      return leaf.val;
    }
    else {
      throw Error('Internal error: Expression was not variable or value!');
    }
  }

  var parsed_file = parser.parseFile(options.code);
  console.log("Parsed file: ")
  console.log(JSON.stringify(parsed_file, null, 1));
  var compiled_file = compiler.compile(parsed_file);
  console.log("Preprocessed file: ")
  console.log(JSON.stringify(compiled_file, null, 1));

  for(var decl of compiled_file.decls) {
    if(decl instanceof ast.Fn) {
      this.memory[decl.name] = decl;
    }
    else if(decl instanceof ast.ObjTmpl) {
      continue;
    }
    else {
      throw Error('Unimplemented type: ' + '"' + decl.constructor.name + '"');
    }
  }

  this.stepgen = function(current, next) {
    if(current instanceof ast.Builtin || current instanceof ast.Lit ||
       current instanceof ast.Var) {
      // console.log("On: ", current)
      return next(current);
    }

    else if(current instanceof ast.Scope) {
      return current.stmts.reduceRight((acc, h) => {
        // console.log("h: ", h);
        // console.log("acc: ", acc);
        return this.stepgen(h, (_) => acc);
      }, next);
    }

    else if(current instanceof ast.Uop) {
      return this.stepgen(current.e1, (v1) => {
        switch(current.op) {
          case '-':
            return next(new ast.Lit('int', -this.getVal(v1)));
          case '+':
            return next(v1);
          case '*':
            return next(new ast.Lit('ptr', this.getMemory(v1)));
          default:
            throw Error('Unimplemented uop: ' + current.op);
        }
      });
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
            case '<<':
              return next(new ast.Lit('int', this.getVal(v1) << this.getVal(v2)));
            case '!=':
              return next(new ast.Lit('bool', this.getVal(v1) != this.getVal(v2)));
            case '<':
              return next(new ast.Lit('bool', this.getVal(v1) != this.getVal(v2)));
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
          console.assert(current.args.length == 0);
          this.onFnCall(v1.name);
          return (_) => this.stepgen(v1.body, next)
        }
      });
    }

    else if(current instanceof ast.Steppoint) {
      // console.log("On: ", current)
      // this.position = current.position;
      return (_) => {
        // console.log("Inside: ", current)
        this.position = current.position;
        return this.stepgen(current.body, next);
      };
    }

    else if(current instanceof ast.Loop) {
      return this.stepgen(current.cond, (r) => {
        if(this.getVal(r)) {
          return this.stepgen(current.body, this.stepgen(current, next));
        }
        else {
          return next();
        }
      });
    }

    throw Error('Unimplemented type: ' + '"' + current.constructor.name) + '"';
  }

  // console.log(this.memory['main'].body.body)
  // stepper = this.stepgen(this.memory['main'].body, (_) => {
  // var tmp_ast = new ast.Steppoint({end:1}, new ast.Steppoint({end:2}, new ast.Lit(2, 2)));
  // var tmp_ast = new ast.Scope([
  //   new ast.Steppoint({start: 1, end: 2}, new ast.Lit(1, 1)),
  //   new ast.Steppoint({start: 3, end: 4}, new ast.Lit(2, 2)),
  // ]);
  // var tmp_ast = new ast.Scope([
  //   new ast.Lit(1, 1),
  //   new ast.Lit(2, 2),
  // ]);
  // console.log(tmp_ast)
  // var stepper = this.stepgen(tmp_ast, (n) => {
  //   this.position = undefined;
  //   this.done = true;
  //   return n;
  // });
  // console.log(stepper)
  var stepper = this.stepgen(new ast.Call(new ast.Var('main'), []), (_) => {
    this.position = undefined;
    this.done = true;
    return null;
  })();

  this.step = function() {
    stepper = stepper();
    return stepper;
  }

  this.run = function() {
    while(this.step());
  };
}

module.exports = {
  Program: Program,
}
