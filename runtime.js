function State() {
  this.memory = [];
}

Function = function(type, params, value) { this.type = type; this.params = params; this.value = value; };

module.exports = function(ast) {
  // initialize
  var state = new State();
  var global_memory = {
    puts: new Function("void", [ new Param("int", "x") ], [ new Print(new VarRef("x"))])
  };
  var Location = function(type, value) {
    this.type = type;
    this.value = value;
  }

  for(var i = 0; i < ast.length; i++) {
    if(ast[i] instanceof FunctionDecl) {
      global_memory[ast[i].name] = new Function(ast[i].type, ast[i].params, ast[i].value);
    }
    else if(ast[i] instanceof VarDecl) {
      global_memory[ast[i].name] = new Location(ast[i].type, ast[i].value);
    }
  }

  function is_value(ast) {
    if(ast instanceof Const) {
      return true;
    }
    else {
      return false;
    }
  }

  function eval(ast, stack_frame) {
    function lookup(v) {
      var sv = stack_frame[v];
      return sv ? sv : global_memory[v];
    }
    if(is_value(ast)) {
      return ast;
    }
    else if(ast instanceof VarRef) {
      value = lookup(ast.name);
      return value;
    }
    else if(ast instanceof Call) {
      var func = lookup(ast.name);
      var frame = {};
      for(var i = 0; i < ast.args.length; i++) {
        // console.log("Setting", f.params[i].name, "to be", eval(ast.args[i], memory), "using", ast.args[i]);
        frame[f.params[i].name] = eval(ast.args[i], stack_frame);
      }
      return call(func, frame);
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
        return new Const("int", eval(ast.e1, stack_frame).value + eval(ast.e2, stack_frame).value);
      }
      if(ast.bop == "Minus") {
        return new Const("int", eval(ast.e1, stack_frame).value - eval(ast.e2, stack_frame).value);
      }
      if(ast.bop == "Mul") {
        return new Const("int", eval(ast.e1, stack_frame).value * eval(ast.e2, stack_frame).value);
      }
      if(ast.bop == "Div") {
        return new Const("int", eval(ast.e1, stack_frame).value / eval(ast.e2, stack_frame).value);
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
    return call(global_memory["main"], {});
  }
}
