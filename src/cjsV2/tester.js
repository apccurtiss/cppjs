var parse = require('./parser.js');
var runtime = require('./runtime.js');
const { exec } = require('child_process');
var fs = require('fs');
var path = require('path');

var filePath = path.join(__dirname, 'start.html');

// function stringifyAST(ast, level) {
//   var level = level || 0;
//   var indent = Array(level+1).join(" ");
//   if(typeof ast === "string" || typeof ast === "number") {
//     return(indent + ast)
//   }
//   else if(ast instanceof Array) {
//     if(!ast.length) { return indent + "[]"; }
//     return(indent + "[\n" + ast.map((x) => stringifyAST(x, level+2)).join(",\n") + "\n" + indent + "]")
//   }
//   else {
//     var ret = indent + ast.constructor.name + ' {\n';
//     for(i of Object.keys(ast)) {
//       ret += stringifyAST(ast[i], level+2) + ',\n';
//     }
//     ret += indent + '}';
//     return ret;
//   }
// }

function getLineOfIndex(str, position) {
    var lineStart = Math.max(str.lastIndexOf('\n', position), 0),
        lineEnd = str.indexOf('\n', position),
        // row = str.slice(lineStart).split('\n').length,
        col = position - lineStart;
    return str.slice(lineStart, lineEnd) +  ("\n" + Array(col).join(" ") + "^");
}

// function GCCError(f, e, fn, s, p) {
//   // f = f.replace(/\\/g, "/");
//   var lineStart = s.lastIndexOf('\n', p),
//       lineEnd = s.indexOf('\n', p),
//       row = s.slice(lineStart).split("\n").length,
//       col = p - lineStart;
//   err = (f + ": In function '" + fn + "':\n");
//   err += (f + ":" + row + ":" + col + ": error: " + e);
//   err += ("\n " + s.slice(lineStart+1, lineEnd));
//   err += ("\n " + Array(col).join(" ") + "^\n");
//   this.toString = () => err;
// }

function testFile(f) {
  fs.readFile(f, 'utf8', (err, data) => {
    if (err) {
      throw err;
    }

    d = data.replace(/\r\n/g, '\n')

    try {
      // console.log(f)
      ast = parse.parseFile(d);
      // console.log(ast)
      // var p = new runtime.Program({
      //   ast: ast,
      // });
      // p.run();
      // console.log(f, ':')
      // console.log('success');
      // return { result: 'success', output: out };

    }
    catch (err) {
      console.log(f, ':')
      console.log('error: ', err.message);
      console.log(getLineOfIndex(d, err.position.index));
      // return { result: 'error', output: err };
      // msg = "expected '" + e.expected + "' before '" + e.found + "' token";
      // out = new GCCError(f, msg, "int x()", d, e.position.index).toString();
    }

    // command = 'g++ -c ' + f;
    // exec(command, (error, stdout, stderr) => {
    //   msg = (`On file: ${f}`)
    //   expected = (stdout + stderr).replace(/\r\n/g, '\n') + '\n';

    //   if(out != expected) {
    //     msg += "\n" + ("Expected:")
    //     msg += "\n" + (expected);
    //     msg += "\n" + ("Got:")
    //     msg += "\n" + (out);
    //   }
    //   console.log(msg)
    // });
  });
}

testDir = "./pass_tests/";
fs.readdir(testDir, function(err, list) {
  if (err) {
    return console.log("Directory error: " + err);
  }

  for(file of list) {
    ((fullPath) => {
      if(fullPath.endsWith(".cpp")){
        fs.stat(fullPath, function(err, stat) {
          if (stat && !stat.isDirectory()) {
            testFile(fullPath);
          }
        });
      }
    })(path.resolve(testDir, file))
  }
});
//
// function handleError(e, d, path) {
//   var msg = "expected '" + e.expected + "' before '" + e.found + "' token";
//   if(e.position) {
//     console.log(new GCCError(path, msg, "int x()", d, e.position.index).toString());
//   }
//   else {
//     console.log(e);
//   }
// }
// ((path) => {
//   readFile(path, (d) => {
//     try {
//       ast = parse.parseFile(d);
//       console.log(stringifyAST(ast));
//     }
//     catch (e) {
//       handleError(e, d, path);
//     }
//   });
// })(process.argv[2])
