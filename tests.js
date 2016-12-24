var interpret = require("./c.js")
function test(action, options) {
  return (code) => {
    if(action) {
      console.log(`Testing ${action}:`);
    }

    try {
      ret = interpret(code, options);
      console.log(`Test passed and returned ${ret}`)
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
`
)

test("Variable references")(`
int x = 2;
int main() {
  print(&x);
}
`)

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
`)

test("Comparisons")(`
int x = 5;
int y = 10;

int main() {
  return (x <= y);
}
`)

test("While loops")(`
int divide(int x, int y) {
  int z = 0;
  while ((z + 1) * y <= x) {
    z += 1
  }
  return z
}

int main() {
  return divide(4,2);
}
`)
