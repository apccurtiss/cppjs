Val = function(type, value) { this.type = type; this.value = value; };
Ref = function(type, loc) { this.type = type; this.loc = loc; }

function Environment() {
  var sp = 0;
  this.stack = [];
  this.global = {};

  this.allocate = function(v) {
    if(!(v instanceof Val)) throw "stuck error - allocating non-value (" + v + ")"
    var loc = sp;
    // TODO(alex) base stack size off type size
    sp = sp + 1;
    this.stack[loc] = v;
    return new Ref(v.type, loc);
  }

  this.pop = function(v) {
    if(!(v instanceof Val)) throw "stuck error - popping non-value (" + v + ")"
    // TODO(alex) base stack size off type size
    sp = sp - 1;
    return sp;
  }
}

function initialize_memory(ast) {
  var state = new Environment();
  state.global["puts"] = new Function("void", [ new Param("int", "x") ], [ new Print(new VarRef("x"))]);

  for(var i = 0; i < ast.length; i++) {
    if(ast[i] instanceof FunctionDecl) {
      state.global[ast[i].name] = new Function(ast[i].type, ast[i].params, ast[i].value);
    }
    else if(ast[i] instanceof VarDecl) {
      state.global[ast[i].name] = state.allocate(ast[i].val);
    }
  }

  return state;
}

Function = function(type, params, value) { this.type = type; this.params = params; this.value = value; };

module.exports = function(ast) {
  // initialize
  function is_value(ast) {
    if(ast instanceof Val) {
      return true;
    }
    else {
      return false;
    }
  }

  var memory = initialize_memory(ast);

  function eval(ast, stack_frame) {
    function mem_lookup(loc) {
      return memory.stack[loc];
    }

    function get_location(name) {
      var sv = stack_frame[name];
      return sv ? sv : memory.global[name];
    }

    if(is_value(ast)) {
      return ast;
    }

    else if(ast instanceof VarRef) {
      value = mem_lookup(get_location(ast.name).loc);
      return value;
    }

    else if(ast instanceof Call) {
      var func = get_location(ast.name);
      var frame = {};
      for(var i = 0; i < ast.args.length; i++) {
        // console.log("Setting", f.params[i].name, "to be", eval(ast.args[i], memory), "using", ast.args[i]);
        var v = eval(ast.args[i], stack_frame);
        frame[func.params[i].name] = memory.allocate(v);
      }
      // TODO(alex) close stack frame at end

      return call(func, frame);
      for(var i = 0; i < ast.args.length; i++) {
        // console.log("Setting", f.params[i].name, "to be", eval(ast.args[i], memory), "using", ast.args[i]);
        var v = eval(ast.args[i], stack_frame);
        frame[func.params[i].name] = memory.allocate(v);
      }
    }

    else if(ast instanceof Print) {
      console.log(eval(ast.text, stack_frame).value);
      return undefined;
    }

    else if(ast instanceof Return) {
      return eval(ast.value, stack_frame);
    }

    else if(ast instanceof Bop) {
      if(ast.bop == "Plus") {
        return new Val("int", eval(ast.e1, stack_frame).value + eval(ast.e2, stack_frame).value);
      }
      else if(ast.bop == "Minus") {
        return new Val("int", eval(ast.e1, stack_frame).value - eval(ast.e2, stack_frame).value);
      }
      else if(ast.bop == "Mul") {
        return new Val("int", eval(ast.e1, stack_frame).value * eval(ast.e2, stack_frame).value);
      }
      else if(ast.bop == "Div") {
        return new Val("int", eval(ast.e1, stack_frame).value / eval(ast.e2, stack_frame).value);
      }
      else {
        throw "Unimplemented";
      }
    }

    else if(ast instanceof Uop) {
      if(ast.uop == "Deref") {
        return mem_lookup(eval(ast.e1, stack_frame).value);
      }
      else if(ast.uop == "Addr") {
        return new Val("ptr", get_location(ast.e1.name).loc);
      }
      else {
        throw "Unimplemented";
      }
    }

    else {
      console.log(ast);
      throw "Unimplemented";
    }
  }

  function call(ast, stack_frame) {
    var lines = ast.value;
    for(var i = 0; i < lines.length; i++) {
      var ret = eval(lines[i], stack_frame);
      if(lines[i] instanceof Return) return ret;
    }
    return undefined;
  }

  this.typecheck = function() {
    return true;
  }

  this.run = function() {
    // TODO(alex) add argc/argv to main's stack frame?
    var ret = call(memory.global["main"], {});
    // console.log(memory);
    return ret;
  }
}
