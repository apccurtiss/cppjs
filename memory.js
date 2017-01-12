function MemoryError(message, position) {
  this.name = 'MemoryError';
  this.message = message || 'Memory error occured';
}
MemoryError.prototype = Object.create(Error.prototype);
MemoryError.prototype.constructor = MemoryError;

function Segfault(message, position) {
  this.name = 'Segfault';
  this.message = 'A segfault? In Javascript? Believe it, bub.';
}
Segfault.prototype = Object.create(Error.prototype);
Segfault.prototype.constructor = Segfault;

Memory = function(initial_size) {
  if (initial_size == undefined) {
    this.size = 128;
  } else {
    this.size = initial_size;
  }
  
  this.data = new ArrayBuffer(this.size);
  this.read = function (address, size, typeflag) {
    if (address > this.size || address <= 0) {
      throw new Segfault;
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
      throw new Segfault;
    }
    var ret = undefined;
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
        (new Int8Array(this.data, address, 1))[0] = value;
      } else {
        (new Uint8Array(this.data, address, 1))[0] = value;
      }
    } else if (size == 2) {
      if (float) {
        throw new MemoryError('Floating point numbers may not have a size of 2 bytes');
      } else if (signed) {
        (new Int16Array(this.data, address, 1))[0] = value;
      } else {
        (new Uint16Array(this.data, address, 1))[0] = value;
      }
    } else if (size == 4) {
      if (float) {
        (new Float32Array(this.data, address, 1))[0] = value;
      } else if (signed) {
        (new Int32Array(this.data, address, 1))[0] = value;
      } else {
        (new Uint32Array(this.data, address, 1))[0] = value;
      }
    } else if (size == 8) {
      if (float) {
        (new Float64Array(this.data, address, 1))[0] = value;
      } else {
        throw new MemoryError('8 byte numbers must be floats');
      }
    }
  }
  
  return
}

module.exports = {
  Memory: Memory,
  signed: "signed",
  unsigned: "unsigned",
  float: "float"
}
