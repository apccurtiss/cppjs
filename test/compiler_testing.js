var compiler = require("../src/compiler.js");
var parser = require("../src/parser.js");
var test = require("tape");

test('Default #DEFINE variables', function(t) {
  t.plan(1);

  t.doesNotThrow(() => compiler.compile(`
    int main ( ) {
      int *x = NULL;
      int *y = nullptr;
    }`));

  t.end();
});

test('Undefined variables', function(t) {
  t.plan(1);

  t.throws(() => compiler.compile(`
    int main ( ) {
      int x = 2;
      y = 1;
    }`));

  t.end();
});
