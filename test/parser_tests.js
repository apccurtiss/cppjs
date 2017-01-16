var tokenize = require("../src/tokenizer.js");
var parse = require("../src/parser.js");

function expectSuccess(testFunction, description) {
  var error = undefined;
  try {
    testFunction();
  }
  catch(e) {
    error = e;
  }
  if(!error) {
    console.log(description);
    throw error;
  }
}

function expectFailure(testFunction, err) {
  var succeeded = true;
  try {
    testFunction();
  }
  catch(err) {
    succeeded = false;
  }
  if(succeeded) {
    throw err;
  }
}

expectSuccess(
  parse(tokenize(
    `int x = 4;
    int y = 6;
    int main() {
    }`
  )),
  "Unable to declare multiple variables."
);

expectSuccess(
  parse(tokenize(
    `int x, y = 4;
    int main() {
    }`
  )),
  "Unable to declare comma-separated list of variables."
)

expectSuccess(
  parse(tokenize(
    `int **x = 4;
    int main() {
    }`
  )),
  "Unable to declare pointers."
)

expectSuccess(
  parse(tokenize(
    `int x[1] = 4;
    int main() {
    }`
  )),
  "Unable to declare arrays."
)

expectSuccess(
  parse(tokenize(
    `int *x, y[5], z = 4;
    int main() {
    }`
  )),
  "Unable to declare pointers and arrays alongside regular variables in a comma-separated list."
)

expectSuccess(
  parse(tokenize(
    `int *x, y[6], z = 4;
    int main() {
      int x, y, z;
    }`
  )),
  "Unable to redeclare local variables with the same names as global ones."
)

expectSuccess(
  parse(tokenize(
    `int *x, *y, z = 4;
    int main() {
      int x, y, z;
      {
        int x, y, z;
        if(1) {
          int x, y, z;
        }
        for(1;1;1) {
          int x, y, z;
        }
      }
    }`
  )),
  "Unable to have nested inner scopes."
);

// should fail
expectFailure(
  parse(tokenize(
    `int *x, y[6];
    int main() {
      int x, y;
    }`
  )),
  "Variable redeclaration allowed."
);

expectFailure(
  parse(tokenize(
    `int main() {
      int x, y;
    }
    int main() {
      int x, y;
    }`
  )),
  "Function redeclaration allowed."
);

expectFailure(
  parse(tokenize(
    `int *x, y[6];
    int main() {
      int x, y;
    }`
  )),
  "Variable redeclaration allowed."
);

/* This test checks to make sure basic functions can exist and, when called, return correct values.
 * * function scope
 * * global variables
 * * literal values
 * * integer type
 * * multiple functions
 */
// tape('basic functions', function(t) {
//   // we're going to run two tests
//   t.plan(2);
//
//   // create the source code for them
//   var test1 = new cjs(`
//   int x = 4;
//   int y = 3;
//   float foo(int x) {
//     return x;
//   }
//   int main() {
//     return foo(y);
//   }`);
//
//   test1.run();
//
//   var test2 = new cjs(`
//   int foo(int x, int y) {
//     return bar(x) + bar(y);
//   }
//   int bar(int x) {
//     return x + 7;
//   }
//   int main() {
//     return foo(0,1);
//   }`);
//
//   test2.run();
//
//   //check to make sure they return the correct thing.
//   t.equal(test1.status,3);
//   t.equal(test2.status,15);
// });

/*
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
*/
