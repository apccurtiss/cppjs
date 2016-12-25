Val = function(type, value) { this.type = type; this.value = value; };
Ref = function(type, loc) { this.type = type; this.loc = loc; }

function Memory(size) {
  this.memory = new ArrayBuffer(size);
  var int32 = new Int32Array(this.memory);
  // TODO(alex) base stack size off type size
  this.assign = function(ref, val) {
    if(!(ref instanceof Ref)) throw `stuck error - assigning to non-referance (${ref})`
    if(!(val instanceof Val)) throw `stuck error - assigning non-value (${val})`
    var element_size = 4;
    int32[ref.loc / element_size] = val.value;
    return val.value;
  }

  this.push = function(val) {
    if(!(val instanceof Val)) throw `stuck error - allocating non-value (${val})`
    var element_size = 4;
    // TODO(alex) come up with a cleaner way of doing this?
    size -= element_size;
    // alignment
    size -= (size % element_size);
    int32[size / element_size] = val.value;
    return new Ref(val.type, size);
  }

  this.get = function(ref) {
    if(!(ref instanceof Ref)) throw `stuck error - getting non-referance (${ref})`
    var element_size = 4;
    return int32[ref.loc / element_size];
  }
}

Function = function(type, params, value) { this.type = type; this.params = params; this.value = value; };

module.exports = function(ast) {
  var memory = new Memory(1024);
  var global_env = {};

  // initialize
  global_env["print"] = new Function("void", [ new Param("int", "x") ], [ new Print(new VarRef("x"))]);

  for(var i = 0; i < ast.length; i++) {
    if(ast[i] instanceof FunctionDecl) {
      global_env[ast[i].name] = new Function(ast[i].type, ast[i].params, ast[i].value);
    }
    else if(ast[i] instanceof VarDecl) {
      global_env[ast[i].name] = memory.push(ast[i].val);
    }
  }

  // returns boolean
  function is_value(ast) {
    return (ast instanceof Val);
  }

  // returns varied expression classes
  function eval(ast, env) {
    // returns integer
    function mem_lookup(ref) {
      // console.trace();
      return memory.get(ref);
    }

    // returns instance of Ref
    function get_location(name) {
      return env[name];
    }

    if(is_value(ast)) {
      return ast;
    }

    else if(ast instanceof VarRef) {
      var ref = get_location(ast.name);
      // console.log("Env:");
      // console.log(env);
      // console.log("Name:");
      // console.log(ast.name);
      var value = mem_lookup(ref);
      return new Val(ref.type, value);
    }

    else if(ast instanceof Call) {
      var func = get_location(ast.name);
      var frame = global_env;
      for(var i = 0; i < ast.args.length; i++) {
        // console.log("Setting", f.params[i].name, "to be", eval(ast.args[i], memory), "using", ast.args[i]);
        var v = eval(ast.args[i], env);
        frame[func.params[i].name] = memory.push(v);
      }
      // TODO(alex) close stack frame at end
      return call(func, frame);
    }

    else if(ast instanceof Print) {
      console.log(eval(ast.text, env).value);
      return undefined;
    }

    else if(ast instanceof Return) {
      return eval(ast.value, env);
    }

    else if(ast instanceof Bop) {
      // TODO(alex) simplify
      // TODO(alex) allow for different types, and cast between them
      if(ast.bop == "Plus") {
        return new Val("int", eval(ast.e1, env).value + eval(ast.e2, env).value);
      }
      else if(ast.bop == "Minus") {
        return new Val("int", eval(ast.e1, env).value - eval(ast.e2, env).value);
      }
      else if(ast.bop == "Mul") {
        return new Val("int", eval(ast.e1, env).value * eval(ast.e2, env).value);
      }
      else if(ast.bop == "Div") {
        return new Val("int", eval(ast.e1, env).value / eval(ast.e2, env).value);
      }
      // TODO(alex) make int casts less janky
      else if(ast.bop == "Lt") {
        return new Val("int", 0 + (eval(ast.e1, env).value < eval(ast.e2, env).value));
      }
      else if(ast.bop == "Gt") {
        return new Val("int", 0 + (eval(ast.e1, env).value > eval(ast.e2, env).value));
      }
      else if(ast.bop == "Le") {
        return new Val("int", 0 + (eval(ast.e1, env).value <= eval(ast.e2, env).value));
      }
      else if(ast.bop == "Ge") {
        return new Val("int", 0 + (eval(ast.e1, env).value >= eval(ast.e2, env).value));
      }
      else if(ast.bop == "Assign") {
        // TODO(alex) support direct memory location assignments
        var ref = get_location(ast.e1.name);
        var val = eval(ast.e2, env);
        return memory.assign(ref, val);
      }
      else {
        console.log(ast);
        throw `Unimplemented`;
      }
    }

    else if(ast instanceof Uop) {
      if(ast.uop == "Deref") {
        return mem_lookup(eval(ast.e1, env));
      }
      else if(ast.uop == "Addr") {
        return new Val("ptr", get_location(ast.e1.name).loc);
      }
      else {
        console.log(ast);
        throw "Unimplemented";
      }
    }

    else if(ast instanceof VarDecl) {
      env[ast.name] = memory.push(eval(ast.val, env));
      return env;
    }

    else {
      console.log(ast);
      throw "Unimplemented";
    }
  }

  function call(ast, env) {
    var lines = ast.value;
    for(var i = 0; i < lines.length; i++) {
      var ret = eval(lines[i], env);
      if(lines[i] instanceof Return) return ret;
      if(lines[i] instanceof VarDecl) env = ret;
    }
    return undefined;
  }

  this.typecheck = function() {
    // TODO(alex) should check that variable declarations are allowed
    return true;
  }

  this.run = function() {
    // TODO(alex) add argc/argv to main's stack frame?
    var ret = call(global_env["main"], global_env);
    // console.log(memory);
    return ret;
  }
}
