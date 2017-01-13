var memory = require('./memory.js');
var Types = require('./types.js');

function RuntimeError(message, position) {
    this.name = 'RuntimeError';
    this.message = message || 'Parse error';
    this.position = position;
    this.stack = (new Error()).stack;
}
RuntimeError.prototype = Object.create(Error.prototype);
RuntimeError.prototype.constructor = RuntimeError;

/*StackFrame = function(start, ret, frame, name) {
    this.start = start;
    this.ret = ret;
    this.frame = frame;
    this.name = name;
};*/
Obj = function() {};
module.exports = function(parsedCode) {
    // code setup
    var functions = {};
    var code = [new Line(new Call("main", []))];
    // store all code as one block
    for (f in parsedCode.functions) {
        functions[f] = parsedCode.functions[f].frame;
        functions[f].location = code.length;
        code = code.concat(parsedCode.functions[f].body)
    }

    // stack setup
    //var stackFrames = [];
    var globalsPointer = 8;

    var globals = parsedCode.globals;
    var currentFrame = new memory.StackFrame(globals);
    var globalData = parsedCode.globalData;
    for (var i = 0; i < globalData.length; i++) {
        if (globalData[i].ast.val != undefined) {
            var val = eval(globalData[i].ast.val);
            currentFrame = currentFrame.write(val.value, globalsPointer + globalData[i].ast.position, 4, memory.signed);
        }
    }
    //stackPointer = globalsPointer + globals.size;
    
    

    // instruction setup
    var currentInstruction = 0;
    this.getCurrentLine = function() {
        return code[currentInstruction]
    };
    this.getNextLine = function() {};

    // runtime setup
    this.step = function(n) {
        for (var i = 0; i < n; i++) {
            if (currentInstruction == code.length) {
                break;
            }
            eval(this.getCurrentLine().ast);
            currentInstruction++;
        }
    }

    this.run = function() {
        while (currentInstruction != code.length) {
            eval(this.getCurrentLine().ast);
            currentInstruction++;
        }
    }

    // returning values setup
    this.dumpGlobals = function() {
        var dump = {};
        for (var i = 0; i < globals.vars.length; i++) {
            dump[globals.vars[i].name] = currentFrame.read(globalsPointer + globals.vars[i].offset, 4, memory.unsigned);
        }
        return dump;
    }

    this.dumpStack = function() {
        return currentFrame.trace(parsedCode.globalObjects);
    }

    var Node = function(type, name, position) {
        this.type = type;
        this.name = name;
        this.position = position;
    }
    var nodes = [];
    var Edge = function(start, end) {
        this.start = start;
        this.end = end;
    }
    var edges = [];

    function registerObjectLocation(typeName, name, position) {
        nodes.push(new Node(typeName, name, position));
    }
    this.guessDataStructure = function() {
        edges = [];
        for (var i = 0; i < nodes.length; i++) {
            var object = parsedCode.globalObjects[nodes[i].type];
            for (v in object.vars) {
                for (var j = 0; j < nodes.length; j++) {
                    if (nodes[j].position == currentFrame.read(nodes[i].position + object.vars[v].offset, 4, memory.unsigned)) {
                        edges.push(new Edge(nodes[i].position, nodes[j].position));
                        break;
                    }
                }
            }
        }
        return {
            nodes: nodes,
            edges: edges
        };
    }

    function resolveLocation(ast) {
        if (ast instanceof Address) {
            var base;
            if(ast.base == "global") {
              base = globalsPointer;
            }
            else if(ast.base == "frame") {
              base = currentFrame.startaddr;
            }
            else {
              base = eval(ast.base).value;
            }
            // var base = (ast.base == "global") ? globalsPointer : currentFrame().start;
            return base + ast.offset;
        } else {
            throw new RuntimeError(`Cannot get location of ${JSON.stringify(ast)}`);
        }
    }
    function getValue(ast) {
        if (ast instanceof Address) {
            var loc = resolveLocation(ast);
            return currentFrame.read(loc, 4, memory.unsigned);
        } else if (ast instanceof Val) {
            return ast.value;
        } else {
            throw (`Cannot get value of ${ast}`);
        }
    }

    // returns varied expression classes
    function eval(ast) {
        if (ast instanceof Val || ast instanceof Address) {
            return ast;
        } else if (ast instanceof Call) {
            currentFrame = new memory.StackFrame(parsedCode.functions[ast.name].frame, currentFrame)
            for (var i = 0; i < ast.args.length; i++) {
                var val = eval(ast.args[i]);
                currentFrame = currentFrame.write(val.value, currentFrame.startaddr + (4 * i), 4, memory.signed);
            }
        } else if (ast instanceof Print) {
            console.log(eval(ast.text).value);
            return undefined;
        } else if (ast instanceof Return) {
            currentFrame = currentFrame.ret()
            if (ast.value) {
                return eval(ast.value);
            } else {
                return 0;
            }
        } else if (ast instanceof Bop) {
          if (ast.bop == "Assign") {
            // TODO(alex) support direct memory location assignments
            var address = resolveLocation(eval(ast.e1));
            var v1 = eval(ast.e2);
            var val = getValue(v1);
            currentFrame = currentFrame.write(val, address, 4, memory.signed);
          }
          else {
            var v1 = getValue(eval(ast.e1));
            var v2 = getValue(eval(ast.e2));
            if (ast.bop == "Plus") {
                return new Val("int", v1 + v2);
            } else if (ast.bop == "Minus") {
                return new Val("int", v1 - v2);
            } else if (ast.bop == "Mul") {
                return new Val("int", v1 * v2);
            } else if (ast.bop == "Div") {
                return new Val("int", v1 / v2);
            }
            // TODO(alex) make int casts less janky
            else if (ast.bop == "Neq") {
                return new Val("int", v1 != v2);
            } else if (ast.bop == "Lt") {
                return new Val("int", 0 + (v1 < v2));
            } else if (ast.bop == "Gt") {
                return new Val("int", 0 + (v1 > v2));
            } else if (ast.bop == "Le") {
                return new Val("int", 0 + (v1 <= v2));
            } else if (ast.bop == "Ge") {
                return new Val("int", 0 + (v1 >= v2));
            } else {
              throw new RuntimeError(`Unimplemented`);
            }
          }
        } else if (ast instanceof Uop) {
            if (ast.cond) console.log(eval(ast.cond));
            if (ast.uop == "Not") {
                return new Val("int", !eval(ast.e1).value);
            } else if (ast.uop == "Addr") {
                var loc = resolveLocation(eval(ast.e1));
                return new Val("int", loc);
            } else if (ast.uop == "Deref") {
                var val = getValue(eval(ast.e1));
                return new Val("int", val);
            } else {
                throw new RuntimeError("Unimplemented");
            }
        } else if (ast instanceof Decl) {
            if (ast.type instanceof Types.Obj) {
                registerObjectLocation(ast.type.name, ast.name, currentFrame.startaddr - currentFrame.abstract.size + ast.position)
            }
        } else if (ast instanceof FramePointer) {
            return new Val("int", currentFrame.startaddr);
        } else if (ast instanceof Jump) {
            if (!ast.cond || eval(ast.cond).value) {
                currentInstruction += ast.distance - 1;
            }
        } else {
            console.log(ast);
            throw new RuntimeError("Unimplemented");
        }
    }
}
