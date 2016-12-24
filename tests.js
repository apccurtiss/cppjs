var test = require('tape')

var interpret = require('./c.js')

/* This test checks to make sure basic functions can exist and, when called, return correct values.
 * * function scope
 * * global variables
 * * literal values
 * * integer type
 * * multiple functions
 */
test('basic functions test', function(t) {
  // we're going to run two tests
  t.plan(2);
  
  // create the source code for them
  test1 = `
  int x = 4;
  int y = 3;
  int foo(int x) {
    return x;
  }
  int main() {
    return foo(y);
  }`;
  
  test2 = `
  int foo(int x, int y) {
    return bar(x) + bar(y)
  }
  int bar(int x) {
    return x + 7;
  }
  int main() {
    return foo(0,1);
  }`;
  
  //check to make sure they return the correct thing.
  t.equal(interpret(test1),3);
  t.equal(interpret(test2),15);
});

// Additional tests to be added
/*
var assign = `
int x = 1;
int main() {
  x = 2;
  print(x);
}
`;

var ref = `
int x = 2;
int main() {
  print(&x);
}
`;

var functions = `
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
`;
*/
