"use strict";

var ast = require('./ast');

function MemoryModel(builtins) {
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DataView
  // var buffer = new ArrayBuffer(1024);
  // var view = new DataView(buffer);
  // var esp = 0;
  // var ebp = 0;
  //
  // var loc = 4;
  // view.setInt8(loc, 10);
  // view.getInt8(loc);

  var memory = {};

  function valueAtAddress(loc, typ) {
    return memory[loc];
  }

  function setAddress(loc, typ, val) {
    return memory[loc] = val;
  }

  var stack = [{ '!bot': 10000 },];
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

  function getTypSize(typ) {
    if(typ instanceof ast.TypBase) {
      switch(typ.typ) {
        case 'string':
          return 4;
        default:
          return 4;
      }
    }
    else if(typ instanceof ast.TypPtr) {
      return 4;
    }
    else if(typ instanceof ast.TypArr) {
      return getTypSize(typ.typ) * typ.size.val;
    }
    else if(typ instanceof ast.TypObj) {
      return typ.fields.reduce(
        (acc, field) => {
          if(!(field.typ instanceof ast.TypFn)) {
            return acc + getTypSize(field.typ);
          }
          return acc;
        }, 0);
    }
    else {
      throw Error('Unsupported type: ' + typ.constructor.name)
    }
  }

  function initMemory(loc, typ) {
    if(typ instanceof ast.TypBase) {
      switch(typ.typ) {
        case 'string':
          setAddress(loc, typ, '');
        default:
          setAddress(loc, typ, 0);
      }
    }
    else if(typ instanceof ast.TypPtr) {
      setAddress(loc, typ, 0);
    }
    else if(typ instanceof ast.TypArr) {
      var elementSize = getTypSize(typ.typ);
      for(var i = 0; i < typ.size.val; i++) {
        initMemory(loc + i * elementSize, typ.typ);
      }
    }
    else if(typ instanceof ast.TypObj) {
      typ.fields.reduce(
        (acc, field) => {
          if(!(field.typ instanceof ast.TypFn)) {
            initMemory(loc + acc, field.typ);
            return acc + getTypSize(field.typ);
          }
          return acc;
        }, 0);
    }
    else {
      throw Error('Unsupported type: ' + typ.constructor.name)
    }
  }

  this.malloc = function(typ) {
    var address = generator.next(getTypSize(typ)).value;
    initMemory(address, typ);
    return address;
  };

  this.call = function(fn, args, onRet) {
    var stack_bot = getCurrentStackFrame()['!bot'];

    // Add return pointer
    stack_bot -= 4;
    var new_frame = { '!retptr': stack_bot, };
    setAddress(stack_bot, undefined, onRet);

    // Add frame variables
    for(var v in fn.frame) {
      stack_bot -= getTypSize(fn.frame[v]);
      // initMemory(stack_bot, fn.frame[v]);
      setAddress(stack_bot, fn.frame[v], args[v])
      new_frame[v] = stack_bot;
    }

    // Push new frame to stack
    new_frame['!bot'] = stack_bot;
    stack.push(new_frame);
  }

  this.ret = function() {
    stack.pop();
  }

  this.addrOfLValue = function(node) {
    // console.log("Getting info on:", node)
    console.assert(ast.isReducedLValue(node));
    if(node instanceof ast.Var) {
      var stackFrame = getCurrentStackFrame();
      if(node.name in stackFrame) {
        return stackFrame[node.name];
      }
      return globals[node.name];
    }
    else if(node instanceof ast.Deref) {
      if(node.e1 instanceof ast.Lit) {
        return node.e1.val;
      }
      return this.valueOfLValue(node.e1);
    }
    else if(node instanceof ast.IndexAccess) {
      var addr = this.addrOfLValue(node.e1);
      var elementSize = getTypSize(node.e1typ);
      return addr + elementSize * this.valueOfLValue(node.index);
    }
    else if(node instanceof ast.MemberAccess) {
      var addr = this.addrOfLValue(node.e1);
      var offset = 0;
      for(var field of node.e1typ.fields) {
        if(field.name == node.field) {
          return addr + offset;
        }
        offset += getTypSize(field.typ);
      }
    }
  }

  this.valueOfLValue = function(node) {
    // console.log("Getting value of:", node);
    var addr = this.addrOfLValue(node);
    // console.log("Address:", addr)
    // console.log("Memory:", memory)
    // console.log("Stack:", stack)
    // console.log("Val:", valueAtAddress(addr, node.typ))
    return valueAtAddress(addr, node.typ);
  }

  this.setLValue = function(node, val) {
    // console.log("Setting:", node)
    // console.log("To be:", val)
    // console.log(memory)
    // console.log(stack)
    var addr = this.addrOfLValue(node);
    // console.log(addr)
    setAddress(addr, node.typ, val);
    // console.log(memory)
  }
}

module.exports = {
  MemoryModel: MemoryModel,
}
