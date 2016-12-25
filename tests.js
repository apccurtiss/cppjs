var Program = require("./c.js")
function test(action) {
  return (code) => {
    if(action) {
      console.log(`Testing ${action}:`);
    }

    try {
      var p = new Program(code);
      console.log(`Test passed and returned ${p.status_code}`);
    }
    catch(err) {
      if (err.name == "ParseError") {
        console.log(`Parsing failed with message:`);
        err.position ? console.log(`${err.message} on line ${err.position.lnum}:\n${err.position.line}\n${Array(err.position.index).join(" ")}^`) : console.log(err.message);
      }
      else if (err.name == "TokenError") {
        console.log(`Tokenizing failed with message:`);
        err.position ? console.log(`${err.message} on line ${err.position.lnum}:\n${err.position.line}\n${Array(err.position.index).join(" ")}^`) : console.log(err.message);
      }
      else if (err.name == "RuntimeError") {
        console.log(`Program crashed with message:`);
        console.log(err.message);
      }
      else {
        console.log(`Test failed with internal Javascript error:`);
        console.log(err);
      }
    }
    console.log();
  }
}

test("Variable assignment")(
`int x = 1;
int main() {
  x = 2;
  print(x);
}
`);

test("Variable references")(`
int x = 2;
int y = 4;
int main() {
  print(&x);
}
`);

test("Functions")(`
int x = 2;
int y = 0;
int foo(int x) {
  print(x + 7);
  return x;
}
int main() {
  print(2 * x);
  return foo(y);
}
`);

test("Comparisons")(`
int x = 5;
int y = 10;

int main() {
  return (x <= y);
}
`);

test("Inner Variable Declarations")(`
int x = 5;

int main() {
  int z = x;
  return(z + 7);
}
`);

test("While loops")(`
int divide(int x, int y) {
  int z = 0;
  while ((z + 1) * y <= x) {
    z = z + 1;
  }
  return z;
}

int main() {
  return divide(4,2);
}
`);

test("Basic functions")(`
int x = 4;
int y = 3;
int foo(int x) {
  return x;
}
int main() {
  return foo(y);
}
`);

test("More functions")(`
int foo(int x, int y) {
  return bar(x) + bar(y);
}
int bar(int x) {
  return x + 7;
}
int main() {
  return foo(0,1);
}
`);

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
