"use strict";

var ast = require('./ast');

function MemoryModel(builtins, typedefs) {
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DataView
  // var buffer = new ArrayBuffer(1024);
  // var view = new DataView(buffer);
  // var loc = 4;
  // view.setInt8(loc, 10);
  // view.getInt8(loc);

  var memory = {};

  var stack = [{ '!bot': 10000, }];
  var heap = {};
  var globals = {};

  var generator = (function* addressGenerator() {
    var i = 0;
    while(1) {
      var next = yield i;
      i += next || 1;
    };
  })();

  for(var name in builtins) {
    var addr = generator.next().value;
    globals[name] = addr;
    memory[addr] = builtins[name];
  }

  function getCurrentStackFrame() {
    return stack[stack.length-1];
  }

  function defaultMemory(typ) {
    if(typ instanceof ast.TypBase) {
      switch(typ.typ) {
        case 'string':
          return '';
        default:
          return 0;
      }
    }
    else if(typ instanceof ast.TypPtr) {
      return undefined;
    }
    else if(typ instanceof ast.TypArr) {
      var newArr = Array(typ.size.val);
      for(var i = 0; i < newArr.length; i++) {
        newArr[i] = defaultMemory(typ.typ);
      }
      return newArr;
    }
    else if(typ instanceof ast.TypObj) {
      return Object.keys(typ.fields).reduce(
        (acc, h) => {
          if(!(typ.fields[h] instanceof ast.TypFn)) {
            acc[h] = defaultMemory(typ.fields[h]);
          }
          return acc;
        }, {});
    }
    else if(typ instanceof ast.TypName) {
      return defaultMemory(typedefs[typ.typ]);
    }
    else {
      throw Error('Unsupported type: ' + typ.constructor.name)
    }
  };

  function lookupAddress(loc, typ) {
    return memory[loc];
  }

  function setAddress(loc, typ, val) {
    return memory[loc] = val;
  }

  this.malloc = function(typ) {
    var address = generator.next().value;
    setAddress(address, typ, defaultMemory(typ));
    return address;
  };

  this.call = function(fn, args, onRet) {
    var stack_bot = getCurrentStackFrame()['!bot'];

    // Add return pointer
    var new_frame = { '!retptr': stack_bot, };
    memory[stack_bot] = onRet;
    stack_bot -= 4;

    // Add frame variables
    for(var v in fn.frame) {
      memory[stack_bot] = (v in args) ? args[v] : defaultMemory(fn.frame[v]);
      new_frame[v] = stack_bot;
      stack_bot -= 1;
    }

    // Push new frame to stack
    new_frame['!bot'] = stack_bot;
    stack.push(new_frame);
  }

  this.ret = function() {
    stack.pop();
  }

  this.getAddress = function(node) {
    if(node instanceof ast.Lit) {
      return node.val;
    }
    else if(node instanceof ast.Var) {
      var stackFrame = getCurrentStackFrame();
      if(node.name in stackFrame) {
        return lookupAddress(stackFrame[node.name]);
      }
      return lookupAddress(globals[node.name]);
    }
    else if(node instanceof ast.Deref) {
      return this.lookupAddress(this.lookupLValue(node.e1));
    }
    else if(node instanceof ast.IndexAccess) {
      return this.lookupLValue(node.e1)[this.lookupLValue(node.index)];
    }
    else if(node instanceof ast.MemberAccess) {
      return this.lookupLValue(node.e1)[node.field];
    }
  }

  this.lookupLValue = function(node, typ) {
    console.assert(ast.isReducedLValue(node));
    function lookup(node) {
      if(node instanceof ast.Lit) {
        return node.val;
      }
      else if(node instanceof ast.Var) {
        var stackFrame = getCurrentStackFrame();
        if(node.name in stackFrame) {
          return lookupAddress(stackFrame[node.name]);
        }
        return lookupAddress(globals[node.name]);
      }
      else if(node instanceof ast.Deref) {
        return lookupAddress(lookup(node.e1));
      }
      else if(node instanceof ast.IndexAccess) {
        return lookup(node.e1)[lookup(node.index)];
      }
      else if(node instanceof ast.MemberAccess) {
        return lookup(node.e1)[node.field];
      }
    }
    return lookup(node);
  }

  this.setLValue = function(node, typ, val) {
    console.assert(ast.isReducedLValue(node));
    if(node instanceof ast.Var) {
      var stackFrame = getCurrentStackFrame();
      if(node.name in stackFrame) {
        return setAddress(stackFrame[node.name], typ, val);
      }
      return setAddress(globals[node.name], typ, val);
    }
    else if(node instanceof ast.Deref) {
      // Checks if it's got a val, if not, look it up
      setAddress(node.e1.val || this.lookupLValue(node.e1), typ, val);
    }
    else if(node instanceof ast.IndexAccess) {
      this.lookupLValue(node.e1)[this.lookupLValue(node.index)] = val;
    }
    else if(node instanceof ast.MemberAccess) {
      this.lookupLValue(node.e1)[node.field] = val;
    }
  }
}

module.exports = {
  MemoryModel: MemoryModel,
}
