Val = function(type, value) { this.type = type; this.value = value; };
Ref = function(type, loc) { this.type = type; this.loc = loc; }

function Environment() {
  this.stack = [];
  this.global = {};

  var sp = 1024;
  this.memory = new ArrayBuffer(sp);
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
    sp -= element_size;
    // alignment
    sp -= (sp % element_size);
    int32[sp / element_size] = val.value;
    return new Ref(val.type, sp);
  }

  this.get = function(ref) {
    if(!(ref instanceof Ref)) throw `stuck error - getting non-referance (${ref})`
    var element_size = 4;
    return int32[ref.loc / element_size];
  }
}

function initialize_memory(ast) {
  var state = new Environment();
  state.global["print"] = new Function("void", [ new Param("int", "x") ], [ new Print(new VarRef("x"))]);

  for(var i = 0; i < ast.length; i++) {
    if(ast[i] instanceof FunctionDecl) {
      state.global[ast[i].name] = new Function(ast[i].type, ast[i].params, ast[i].value);
    }
    else if(ast[i] instanceof VarDecl) {
      state.global[ast[i].name] = state.push(ast[i].val);
    }
  }

  return state;
}

Function = function(type, params, value) { this.type = type; this.params = params; this.value = value; };

module.exports = function(ast) {
  // returns boolean
  function is_value(ast) {
    return (ast instanceof Val);
  }

  var memory = initialize_memory(ast);

  // returns varied expression classes
  function eval(ast, stack_frame) {
    // console.log("AST:", ast);
    // returns raw number
    function mem_lookup(ref) {
      return memory.get(ref);
    }

    // returns instance of Ref
    function get_location(name) {
      var sv = stack_frame[name];
      return sv ? sv : memory.global[name];
    }

    if(is_value(ast)) {
      return ast;
    }

    else if(ast instanceof VarRef) {
      var ref = get_location(ast.name);
      var value = mem_lookup(ref);
      return new Val(ref.type, value);
    }

    else if(ast instanceof Call) {
      var func = get_location(ast.name);
      var frame = {};
      for(var i = 0; i < ast.args.length; i++) {
        // console.log("Setting", f.params[i].name, "to be", eval(ast.args[i], memory), "using", ast.args[i]);
        var v = eval(ast.args[i], stack_frame);
        frame[func.params[i].name] = memory.push(v);
      }
      // TODO(alex) close stack frame at end
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
      else if(ast.bop == "Assign") {
        // TODO(alex) support direct memory location assignments
        var ref = get_location(ast.e1.name);
        var val = eval(ast.e2, stack_frame);
        return memory.assign(ref, val);
      }
      else {
        console.log(ast);
        throw "Unimplemented";
      }
    }

    else if(ast instanceof Uop) {
      if(ast.uop == "Deref") {
        return mem_lookup(eval(ast.e1, stack_frame));
      }
      else if(ast.uop == "Addr") {
        return new Val("ptr", get_location(ast.e1.name).loc);
      }
      else {
        console.log(ast);
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
