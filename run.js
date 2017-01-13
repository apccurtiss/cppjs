// var preprocess = require("./preprocesser");
var tokenize = require("./tokenizer");
var parse = require("./parser");
var Runtime = require("./runtime");

var test1 = `
float foo(int x) {
  int y = 7;
  return x;
}
int main() {
  if(1 + 6 + 9) {
    int x = 6;
    print(foo(y));
    print(y);
    for(x = 0; x < 6; x = x + 1) {
      if(x / 2 == 0) {
        print(x);
      }
    }
    print(1 + 2 + 5 / 7 + 9);
  }
}`;

var test2 = `
int x = 5, **a = 7, b[8];
int y = 6;
char c[8] = 6;
char *d;
char e;
int f;
int foo(int x) {
  if(x) {
    int x = 7;
    int y = 8;
    d = 7;
  }
}
int main() {
  int x;
  int z;
  x = 6;
  y = 8;
  z = 7;
  foo(x);
}`;

var test3 = `
struct node {
  int y;
  int z;
}
int x;
char y;
int main() {
  int x;
  int y;
  struct node test;
  x = y;
  test.y;
  test.z;
  int z;
}`;


var test4 = `
struct node {
  struct node *next;
}
int x = 7;
int y = 4 + 9;
int main() {
  struct node a, b, c, *current;
  a.next = &b;
  b.next = &c;
  c.next = 0;

  current = &a;
  while(current != 0) {
    current = (*current).next;
  }
}`;

/*
Assign:
  Loc(12 + esp)
  to be:
  Loc(Deref(Location(x + esp)) + 0)
*/
function run(ptu) {
  // try {
    // var tu = preprocess(ptu);
    // console.log("Preprocessed:");
    // console.log(tu);
    var tu = ptu;
    var tok = tokenize(tu);
    // console.log("Tokenized:");
    // console.log(tok);
    var res = parse(tok);
    // console.log(res.functions["main"].body[9].ast.e2.offset.e1);
    // console.log(res.globalObjects);
    var rt = new Runtime(res);
    rt.step(1);
    console.log("\n======================================\n");
    console.log(rt.getCurrentLine());
    console.log("Globals:");
    console.log(rt.dumpGlobals());
    console.log("Stack:");
    var stack = rt.dumpStack();
    for(var j = 0; j < stack.length; j++) {
      console.log(stack[j]);
    }
    // var functions = res.functions;
    // var globals = res.globals;
    // console.log("Functions:");
    // console.log(functions);
    // console.log("Globals:");
    // console.log(globals);
    // console.log("Main:");
    // console.log(res.functions["main"].frame);
    // var body = res.functions["main"].body;
    // for(var i = 0; i < body.length; i++) {
    //   console.log("I: " + i)
    //   console.log(body[i]);
    // }
    // console.log(res.globalData);

    // console.log("Foo:");
    // console.log(functions["foo"].frame);
    // var body = functions["foo"].body;
    // for(var i = 0; i < body.length; i++) {
    //   console.log(body[i].ast);
    // }
    // for(var i = 0; i < globals.vars.length; i++) {
    //   console.log(globals.vars[i]);
    // }
  //
  // catch (err) {
  //   console.log("Error:");
  //   console.log(err.message);
  //   console.log(err.stack);
  //   process.exit();
  // }
  // for(var i = 0; i < functions.length; i++) {
  //   for(var j = 0; j < functions[i].value.length; j++) {
  //     var line = functions[i].value[j];
  //     if(line instanceof Redirect) {
  //
  //     }
  //     else {
  //       console.log(`${j}: ${ptu.slice(line.start, line.end)}`);
  //     }
  //     // console.log(`  (Parsed from \"${code.slice(line.start, line.end)}\" [${line.start}:${line.end}])`);
  //   }
  // }

}
// run(`
// int main() {
//   int a, b, *c, *d;
//   a;
//   a = 6;
//   b = a;
//   c = &a;
// }
//   `)
run(test4);
