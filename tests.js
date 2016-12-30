var Program = require("./c.js");

function Test(name) {
  this.code;
  this.expect = function(expected_output) {
    if(!this.code) {
      console.log("Test code needs to be added first!");
      return;
    }
    if(!expected_output) {
      expected_output = "";
    }

    try {
      var output = "";
      var p = new Program(this.code, (x) => { output += (x + "\n"); });
      p.run();
      output = output.slice(0, -1);
      if(expected_output != output) {
        console.log(`\x1b[31m${name}:`, `\x1b[33m`, `\nReturns\n\"${output}\"\ninstead of\n\"${expected_output}\"`, `\x1b[37m\n`);
      }
    }
    catch(err) {
      if (err.name == "ParseError") {
        console.log(`\x1b[31m${name}: parsing failed with message:\n`, `\x1b[33m`, err.message);
        err.position ? console.log(`${err.message} on line ${err.position.lnum}:\n${err.position.line}\n${Array(err.position.index).join(" ")}^`) : console.log(err.message);
      }
      else if (err.name == "TokenError") {
        console.log(`\x1b[31m${name}: tokenizing failed with message:\n`, `\x1b[33m`, err.message);
        err.position ? console.log(`${err.message} on line ${err.position.lnum}:\n${err.position.line}\n${Array(err.position.index).join(" ")}^`) : console.log(err.message);
      }
      else if (err.name == "RuntimeError") {
        console.log(`\x1b[31m${name}: program crashed with message:`, `\x1b[33m`);
        console.log(err.message);
      }
      else {
        console.log(`\x1b[31m${name}:`);
        console.log(`\x1b[33mtest failed with internal Javascript error:`);
        console.log(err);
      }
      console.log("\x1b[37m");
    }
    return output;
  }
}

var test1 = new Test("Variable assignment");
test1.code =
`int x = 1;
int main() {
  x = 2;
  print(x);
}`
test1.expect("2");

var test2 = new Test("Variable references")
test2.code =
`int x = 2;
int y = 4;
int main() {
  int z = &x;
  print(z);
  print(*z);
}`
test2.expect("2");

var test3 = new Test("Functions");
test3.code =
`int x = 2;
int y = 0;
int foo(int x) {
  print(x + 7);
  return x;
}
int main() {
  print(2 * x);
  return foo(y);
}`
test3.expect("4\n7");

var test4 = new Test("Comparisons");
test4.code =
`int x = 5;
int y = 10;

int main() {
  print(x <= y);
}`
test4.expect("1");

var test5 = new Test("While loops");
test5.code =
`int divide(int x, int y) {
  int z = 0;
  while ((z + 1) * y <= x) {
    z = z + 1;
  }
  return z;
}

int main() {
  return divide(4,2);
}`
test5.expect("2");

var test6 = new Test("Basic functions");
test6.code =
`int x = 4;
int y = 3;
int foo(int x) {
  return x;
}
int main() {
  print(foo(y));
}`
test6.expect("3");

var test7 = new Test("More functions");
test7.code =
`int foo(int x, int y) {
  return bar(x) + bar(y);
}
int bar(int x) {
  return x + 7;
}
int main() {
  print(foo(0,1));
}`
test7.expect("15");

var test8 = new Test("Inner Variable Declarations");
test8.code =
`int x = 5;

int main() {
  int z = x;
  print(z + 7);
}`
test8.expect("12");

//*/
// var test = require('tape');
//
// var interpret = require('./c.js');
//
// /* This test checks to make sure basic functions can exist and, when called, return correct values.
//  * * function scope
//  * * global variables
//  * * literal values
//  * * integer type
//  * * multiple functions
//  */
// tape('basic functions test', function(t) {
//   // we're going to run two tests
//   t.plan(2);
//
//   // create the source code for them
//   test1 = `
//   int x = 4;
//   int y = 3;
//   int foo(int x) {
//     return x;
//   }
//   int main() {
//     return foo(y);
//   }`;
//
//   test2 = `
//   int foo(int x, int y) {
//     return bar(x) + bar(y)
//   }
//   int bar(int x) {
//     return x + 7;
//   }
//   int main() {
//     return foo(0,1);
//   }`;
//
//   //check to make sure they return the correct thing.
//   t.equal(interpret(test1),3);
//   t.equal(interpret(test2),15);
// });
