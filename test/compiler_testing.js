var compiler = require("../src/compiler.js");
var parser = require("../src/parser.js");
var test = require("tape");

test('Basic arithmatic expressions', function(t) {
  t.plan(9);

  t.doesNotThrow(() => compiler.compileExpr(`1`));
  t.doesNotThrow(() => compiler.compileExpr(`a`));
  t.doesNotThrow(() => compiler.compileExpr(`+ a + b`));
  t.doesNotThrow(() => compiler.compileExpr(`- a - - b`));
  t.doesNotThrow(() => compiler.compileExpr(`- - - - + + + - - a`));
  t.doesNotThrow(() => compiler.compileExpr(`1 + 2 + a + b`));
  t.doesNotThrow(() => compiler.compileExpr(`1 - 2 - a - b`));
  t.doesNotThrow(() => compiler.compileExpr(`1 * 2 * a * b`));
  t.doesNotThrow(() => compiler.compileExpr(`1 / 2 / a / b`));

  t.end();
});

test('Basic statements', function(t) {
  t.plan(7);

  t.doesNotThrow(() => compiler.compileStmt(` 1 + 2 + 3 ; `));
  t.doesNotThrow(() => compiler.compileStmt(` { 1 + 2 ; 3 + 4 ; } `));
  t.doesNotThrow(() => compiler.compileStmt(` return 1 ; `));
  t.doesNotThrow(() => compiler.compileStmt(` if ( 1 + 2 ) { 1 + 2 ; } else { 3 + 4 ; } `));
  t.doesNotThrow(() => compiler.compileStmt(` while ( 1 + 2 ) { 1 + 2 ; } `));
  t.doesNotThrow(() => compiler.compileStmt(` for ( int i = 0 ; i < 10 ; i ++ ) { } `));
  t.doesNotThrow(() => compiler.compileStmt(` ; ; ; `));

  t.end();
});

test('Basic function declarations', function(t) {
  t.plan(5);

  t.doesNotThrow(() => compiler.compileFile(` int main ( ) { } `));
  t.doesNotThrow(() => compiler.compileFile(` int main ( ) { 1 + 2; } `));
  t.doesNotThrow(() => compiler.compileFile(` int main ( int argc, char * argv ) { 1 + 2; } `));
  t.doesNotThrow(() => compiler.compileFile(` int main ( int argc, char * argv ) { 1 + 2; 3; ; 4; } `));
  t.doesNotThrow(() => compiler.compileFile(` int main ( int argc, char * argv ) { 1 + 2; 3; ; 4; return 5; return 6; } `));

  t.end();
});

test('Variable definitions', function(t) {
  t.plan(10);

  t.doesNotThrow(() => compiler.compileStmt(` int x ; `));
  t.doesNotThrow(() => compiler.compileStmt(` int x = 1 + 2 / 3 ; `));
  t.doesNotThrow(() => compiler.compileStmt(` int x = y ; `));
  t.doesNotThrow(() => compiler.compileStmt(` int * x = & y ; `));
  t.doesNotThrow(() => compiler.compileStmt(` int * * * x = & y ; `));
  t.doesNotThrow(() => compiler.compileStmt(` int x [ 10 ] ; `));
  t.doesNotThrow(() => compiler.compileStmt(` int x [ 10 * 40 ] ; `));
  t.doesNotThrow(() => compiler.compileStmt(` int x [ 10 ] [ 50 ] ; `));
  t.doesNotThrow(() => compiler.compileStmt(` int * x , * y [ 10 ] ; `));
  t.doesNotThrow(() => compiler.compileStmt(` int * x , * y [ 10 ] , z ; `));

  t.end();
});

test('Syntactially complex expressions', function(t) {
  t.plan(7);

  t.doesNotThrow(() => compiler.compileExpr(`a.next`));
  t.doesNotThrow(() => compiler.compileExpr(`a[10]`));
  t.doesNotThrow(() => compiler.compileExpr(`*a`));
  t.doesNotThrow(() => compiler.compileExpr(`&a`));
  t.doesNotThrow(() => compiler.compileExpr(`(*a).next`));
  t.doesNotThrow(() => compiler.compileExpr(`a.next[10]`));
  t.doesNotThrow(() => compiler.compileExpr(`a.next[10].ptr->val`));

  t.end();
});

test('Classes and structs', function(t) {
  t.plan(1);

  t.doesNotThrow(() => compiler.compileFile(`
    struct Node {
      int key ;
      Node * left , right ;
    } ;
  `));

  t.end();
});
  // t.doesNotThrow(() => parse(tokenize(
  //   `int **x = 4;
  //   int main() {
  //   }`
  // )), undefined, "pointer declaration and initialization")
  //
  // t.doesNotThrow(() => parse(tokenize(
  //   `int x[1];
  //   int main() {
  //   }`
  // )), undefined, "array declaration")
  //
  // t.doesNotThrow(() => parse(tokenize(
  //   `int *x, y[5], z = 4;
  //   int main() {
  //   }`
  // )), undefined, "multiple declatations on one line")
  //
  // t.doesNotThrow(() => parse(tokenize(
  //   `int *x, y[6], z = 4;
  //   int main() {
  //     int x, y, z;
  //   }`
  // )), undefined, "shadowing of variables in different scopes")
  //
  // t.doesNotThrow(() => parse(tokenize(
  //   `int *x, *y, z = 4;
  //   int main() {
  //     int x, y, z;
  //     {
  //       int x, y, z;
  //       if(1) {
  //         int x, y, z;
  //       }
  //       for(1;1;1) {
  //         int x, y, z;
  //       }
  //     }
  //   }`
  // )), undefined, "multiple shadowing of multiple variables")
  //
  // t.throws(() => parse(tokenize(
  //   `int main() {
  //     int x, y;
  //     int x = 2;
  //   }`
  // )), undefined, "variable redeclaration should thow an error")
  //
  // t.throws(() => parse(tokenize(
  //   `int main() {
  //     int x, y;
  //   }
  //   int main() {
  //     int x, y;
  //   }`
  // )), undefined, "function redeclaration should throw an error")
