var interpret = require("./c.js")

test1 = `
int x = 2;
int y = 1;
int z = 0;
int foo(int x) {
  print(x);
  return x;
}
int main() {
  print(2 * x);
  return foo(z);
}
`

ret = interpret(test1);
if (ret != 0) {
  console.log("test1 failed, returned " + ret + " instead of 0\n")
} else {
  console.log("test1 PASSED\n")
}

test2 = `
int divide(x,y) {
  int z = 0;
  while ((z + 1) * y <= x) {
    z += 1
  }
  return z
}

int main() {
  return divide(4,2);
}
`

ret = interpret(test2);
if (ret != 2) {
  console.log("test1 failed, returned " + ret + " instead of 2")
}

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
