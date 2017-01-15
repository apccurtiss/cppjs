Types = require("./types.js")

function MemoryError(message, position) {
  this.name = 'MemoryError';
  this.message = message || 'Memory error occured';
}
MemoryError.prototype = Object.create(Error.prototype);
MemoryError.prototype.constructor = MemoryError;

function Segfault(position, message) {
  this.name = 'Segfault';
  this.message = `(${position}) A segfault? In Javascript? Believe it, bub.`;
}
Segfault.prototype = Object.create(Error.prototype);
Segfault.prototype.constructor = Segfault;

function AllocationTable (initial_state) {
  if (initial_state == undefined) {
    this.state = [];
  } else {
    this.state = initial_state;
  }

  this.insert = function(key, value) {
    var i;
    for(i = 0; i < this.state.length; i++) {
      if (this.state[i].address > key) {
        break;
      }
    }
    var before = this.state.slice(0,i);
    var added = [{address: key, length: value}];
    var after = this.state.slice(i);
    return new AllocationTable(before.concat(added).concat(after));
  }

  this.remove = function(key) {
    var i = 0;
    for (i = 0; i < this.state.length; i++) {
      if (this.state[i].address == key) {
        break;
      }
    }

    if (i == 0) {
      throw new Segfault(0);
    }

    var removed = this.state.splice(i,1);
    return new AllocationTable(removed);
  }
}

function Memory (initial_size, initial_state) {
  if (initial_size == undefined) {
    this.size = 128;
  } else if (initial_size < 8) {
    throw new MemoryError('Memory Objects must have a size of 8 or more.')
  } else {
    this.size = initial_size;
  }

  if (initial_state == undefined) {
    this.data = new ArrayBuffer(this.size);
  } else {
    this.data = initial_state.slice(0,this.size);
  }

  this.read = function (address, size, typeflag) {
    if (address > this.size || address <= 0) {
      throw new Segfault(address);
    }
    var ret = undefined;
    //set boolean flags here for ease of coding later on
    var float = false;
    var signed = true;

    if (typeflag == 'float') {
      float = true;
    } else if (typeflag == 'unsigned') {
      signed = false;
    }

    if (size == 1) {
      if (float) {
        throw new MemoryError('Floating point numbers may not have a size of 1 byte');
      } else if (signed) {
        ret = (new Int8Array(this.data, address, 1))[0];
      } else {
        ret = (new Uint8Array(this.data, address, 1))[0];
      }
    } else if (size == 2) {
      if (float) {
        throw new MemoryError('Floating point numbers may not have a size of 2 bytes');
      } else if (signed) {
        ret = (new Int16Array(this.data, address, 1))[0];
      } else {
        ret = (new Uint16Array(this.data, address, 1))[0];
      }
    } else if (size == 4) {
      if (float) {
        ret = (new Float32Array(this.data, address, 1))[0];
      } else if (signed) {
        ret = (new Int32Array(this.data, address, 1))[0];
      } else {
        ret = (new Uint32Array(this.data, address, 1))[0];
      }
    } else if (size == 8) {
      if (float) {
        ret = (new Float64Array(this.data, address, 1))[0];
      } else {
        throw new MemoryError('8 byte numbers must be floats');
      }
    }

  return ret;
  }

  this.write = function (value, address, size, typeflag) {
    if (address > this.size || address <= 0) {
      throw new Segfault(address);
    }
    var modified = this.data.slice(0)
    //set boolean flags here for ease of coding later on
    var float = false;
    if (typeflag == 'float') {
      float = true;
    } else if (typeflag == 'signed') {
      signed = true;
    } else if (typeflag == 'unsigned') {
      signed = false;
    }

    if (size == 1) {
      if (float) {
        throw new MemoryError('Floating point numbers may not have a size of 1 byte');
      } else if (signed) {
        (new Int8Array(modified, address, 1))[0] = value;
      } else {
        (new Uint8Array(modified, address, 1))[0] = value;
      }
    } else if (size == 2) {
      if (float) {
        throw new MemoryError('Floating point numbers may not have a size of 2 bytes');
      } else if (signed) {
        (new Int16Array(modified, address, 1))[0] = value;
      } else {
        (new Uint16Array(modified, address, 1))[0] = value;
      }
    } else if (size == 4) {
      if (float) {
        (new Float32Array(modified, address, 1))[0] = value;
      } else if (signed) {
        (new Int32Array(modified, address, 1))[0] = value;
      } else {
        (new Uint32Array(modified, address, 1))[0] = value;
      }
    } else if (size == 8) {
      if (float) {
        (new Float64Array(modified, address, 1))[0] = value;
      } else {
        throw new MemoryError('8 byte numbers must be floats');
      }
    }

    return new Memory(this.size, modified);
  }

  this.resize = function (newsize) {
    if (newsize < this.size) {
      throw new MemoryError("You cannot resize memory to be smaller");
    }
    return new Memory(this.size, this.data);
  }

}

function Heap(initial_data, initial_allocations) {
  if (initial_data == undefined) {
    this.memory = new Memory(128);
  } else {
    this.memory = initial_data;
  }

  if (initial_allocations == undefined) {
    this.allocations = new AllocationTable();
  } else {
    this.allocations = initial_allocations;
  }

  this.read = function (address, size, typeflag) {
    return this.memory.read(address, size, typeflag);
  }

  this.write = function (value, address, size, typeflag) {
    return new Heap(this.memory.write(value, address, size, typeflag), this.allocations);
  }

  this.malloc = function (size) {
    var last = 8;
    for (var x in this.allocations.state) {
      if (x.address - last >= size) {
        break;
      } else {
        last = x.address + x.length;
      }
    }

    return {
      address: last,
      state: new Heap(this.memory, this.allocations.insert(last, size))
    };
  }

  this.free = function (address) {
    return new Heap(this.memory, this.allocations.remove(address))
  };
}

function MemoryCell(offset, type, name) {
  this.offset = offset;
  this.type = type;
  this.name = name;
}

function AbstractFrame(name) {
  this.name = name;
  this.size = 0;
  this.vars = [];
  this.push = function(type, name, size) {
    this.size += !(this.size % size) ? 0 : (size - (this.size % size));
    this.vars.push(new MemoryCell(this.size, type, name));
    this.size += size;
    return this.size - size;
  }
}

function StackFrame(abstract, prev) {
  this.prev = prev;
  this.startaddr = 8;
  if (this.prev == undefined) {
    this.memory = new Memory(128);
  } else {
    this.startaddr = prev.startaddr + prev.size;
    this.startaddr += 8 - (this.startaddr % 8)
    this.memory = prev.memory;
  }
  this.size = abstract.size;
  this.abstract = abstract;

  this.ret = function() {
    return this.prev;
  }

  this.read = function(address, size, typeflag) {
    return this.memory.read(address, size, typeflag);
  }

  this.write = function(value, address, size, typeflag) {
    var mod = new StackFrame(this.abstract, this.prev);
    mod.memory = this.memory.write(value, address, size, typeflag);
    return mod;
  }

  this.name = function() {
    if (this.n == undefined) {
      return "Stack Frame at " + this.startaddr;
    }
    return this.abstract.name + " at " + this.startaddr;
  }

  this.trace = function(objects) {
    var trace = []
    if (this.prev != undefined) {
      trace = this.prev.trace();
    }
    var curr = new Object;
    curr = {}
    for (var j = 0; j < this.abstract.vars.length; j++) {
      if (this.abstract.vars[j].type instanceof Types.Obj) {
        objdef = objects[this.abstract.vars[j].type.name]
        var members = {};
        for (var k in objdef.vars) {
          members[k] = this.memory.read(this.startaddr + this.abstract.vars[j].offset + objdef.vars[k].offset, 4, "unsigned");
        }
        curr[this.abstract.vars[j].name] = members;
      } else {
        curr[this.abstract.vars[j].name] = this.memory.read(this.startaddr + this.abstract.vars[j].offset, 4, "unsigned");

      }
    }
    trace.push(curr);
    return trace;
  }
}

module.exports = {
  Memory: Memory,
  Heap: Heap,
  AbstractFrame: AbstractFrame,
  MemoryCell: MemoryCell,
  StackFrame: StackFrame,
  signed: "signed",
  unsigned: "unsigned",
  float: "float"
}
