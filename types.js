var baseSizes = {
  "int": 8,
  "float": 8,
  "char": 1,
  "ptr": 8,
};

module.exports = {
  Arr: function(type, size) { this.type = type; this.size = size; },
  Obj: function(name) { this.name = name; },
  Ptr: function(type) { this.type = type; },
  sizeof: function(type) { return baseSizes[type]; },
  typeof: function(ast) {

  },
};
