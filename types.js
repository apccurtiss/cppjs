var baseSizes = {
  "int": 4,
  "float": 4,
  "char": 1,
  "ptr": 4,
};

module.exports = {
  Arr: function(type, size) { this.type = type; this.size = size; },
  Obj: function(name) { this.name = name; },
  Ptr: function(type) { this.type = type; },
  sizeof: function(type) { return baseSizes[type]; },
  typeof: function(ast) {
    if(ast instanceof Uop) {
      if(ast.uop == "Deref") {
        if(ast.e1.type instanceof this.Ptr) {
          return ast.e1.type.type;
        }
        return "void";
      }
    }
    else if (ast instanceof Bop) {

    }
    else if(ast instanceof Location) {
      return ast.type;
    }
  },
};
