var compiler = require("../src/compiler.js");
var parser = require("../src/parser.js");
var test = require("tape");

test('Arithmatic expressions', function(t) {
  t.plan(12);

  t.doesNotThrow(() => parser.parseExpr(`1`));
  t.doesNotThrow(() => parser.parseExpr(`a`));
  t.doesNotThrow(() => parser.parseExpr(`a + b`));
  t.doesNotThrow(() => parser.parseExpr(`- a`));
  t.doesNotThrow(() => parser.parseExpr(`+ a + b`));
  t.doesNotThrow(() => parser.parseExpr(`- a - - b`));
  t.doesNotThrow(() => parser.parseExpr(`- - - - + + + - - a`));
  t.doesNotThrow(() => parser.parseExpr(`1 + 2 + a + b`));
  t.doesNotThrow(() => parser.parseExpr(`1 - 2 - a - b`));
  t.doesNotThrow(() => parser.parseExpr(`1 * 2 * a * b`));
  t.doesNotThrow(() => parser.parseExpr(`1 / 2 / a / b`));
  t.doesNotThrow(() => parser.parseExpr(`( 1 )`));

  t.end();
});

test('Statements', function(t) {
  t.plan(7);

  t.doesNotThrow(() => parser.parseStmt(` 1 + 2 + 3 ; `));
  t.doesNotThrow(() => parser.parseStmt(` { 1 + 2 ; 3 + 4 ; } `));
  t.doesNotThrow(() => parser.parseStmt(` return 1 ; `));
  t.doesNotThrow(() => parser.parseStmt(` if ( 1 + 2 ) { 1 + 2 ; } else { 3 + 4 ; } `));
  t.doesNotThrow(() => parser.parseStmt(` while ( 1 + 2 ) { 1 + 2 ; } `));
  t.doesNotThrow(() => parser.parseStmt(` for ( int i = 0 ; i < 10 ; i ++ ) { } `));
  t.doesNotThrow(() => parser.parseStmt(` ; `));

  t.end();
});

test('Comments', function(t) {
  t.plan(7);

  t.doesNotThrow(() => parser.parseStmt(`//`));
  t.doesNotThrow(() => parser.parseStmt(`// should work`))
  t.doesNotThrow(() => parser.parseStmt(`/**/`));
  t.throws(() => parse.parseStmt(`/* should fail`));

  t.doesNotThrow(() => parser.parseStmt(`1 + 2 + 3; // ignore me`))
  t.doesNotThrow(() => parser.parseStmt(` 1 + 2 /* mwahahaha */ + 3; `))
  t.doesNotThrow(() => parser.parseStmt(` if ( 1 + 2 ) { 1 + 2 ; // ignore me\n} else { 3 + 4 ; } `));

  t.end();
});

test('Strings', function(t) {
  t.plan(3);

  t.doesNotThrow(() => parser.parseExpr(`"asdf"`));
  t.doesNotThrow(() => parser.parseExpr(`" this is a string "`));
  t.throws(() => parser.parseExpr(`" " "`));

  t.end();
});

test('Function declarations', function(t) {
  t.plan(6);

  t.doesNotThrow(() => parser.parseFile(` int main ( ) { } `));
  t.doesNotThrow(() => parser.parseFile(` int main ( ) { 1 + 2; } `));
  t.doesNotThrow(() => parser.parseFile(` int main ( int argc, char * argv ) { 1 + 2; } `));
  t.doesNotThrow(() => parser.parseFile(` int main ( int argc, char * argv ) { 1 + 2; 3; ; 4; } `));
  t.doesNotThrow(() => parser.parseFile(` int main ( int argc, char * argv ) { 1 + 2; 3; ; 4; return 5; return 6; } `));
  t.doesNotThrow(() => parser.parseFile(` int *main ( int argc, char * argv ) { 1 + 2; 3; ; 4; return 5; return 6; } `));

  t.end();
});

test('Variable definitions', function(t) {
  t.plan(10);

  t.doesNotThrow(() => parser.parseStmt(` int x ; `));
  t.doesNotThrow(() => parser.parseStmt(` int x = 1 + 2 / 3 ; `));
  t.doesNotThrow(() => parser.parseStmt(` int x = y ; `));
  t.doesNotThrow(() => parser.parseStmt(` int * x = & y ; `));
  t.doesNotThrow(() => parser.parseStmt(` int * * * x = & y ; `));
  t.doesNotThrow(() => parser.parseStmt(` int x [ 10 ] ; `));
  t.doesNotThrow(() => parser.parseStmt(` int x [ 10 * 40 ] ; `));
  t.doesNotThrow(() => parser.parseStmt(` int x [ 10 ] [ 50 ] ; `));
  t.doesNotThrow(() => parser.parseStmt(` int * x , * y [ 10 ] ; `));
  t.doesNotThrow(() => parser.parseStmt(` int * x , * y [ 10 ] , z ; `));

  t.end();
});

test('Syntactially complex expressions', function(t) {
  t.plan(7);

  t.doesNotThrow(() => parser.parseExpr(`a.next`));
  t.doesNotThrow(() => parser.parseExpr(`a[10]`));
  t.doesNotThrow(() => parser.parseExpr(`*a`));
  t.doesNotThrow(() => parser.parseExpr(`&a`));
  t.doesNotThrow(() => parser.parseExpr(`(*a).next`));
  t.doesNotThrow(() => parser.parseExpr(`a.next[10]`));
  t.doesNotThrow(() => parser.parseExpr(`a.next[10].ptr->val`));

  t.end();
});

test('Classes and structs', function(t) {
  t.plan(2);

  t.doesNotThrow(() => parser.parseFile(`
    struct Node {
      int key ;
      Node * left , * right ;
    } ;
  `));

  t.doesNotThrow(() => parser.parseFile(`
    struct Node {
      /* Binary tree */
      int key ;
      Node * left , * right ;

      // constructor
      int Node ( int k , Node * l , Node * r ) {
        key = k ;
        left = l ;
        right = r ;
      }
    } ;
  `));

  t.end();
});
