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
