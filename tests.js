var interpret = require("./c.js")

test1 = `
int x = 2;
int x = 1;
int y = 0;
int foo(int x) {
  puts(x);
  return x;
}
int main() {
  puts(2 * x);
  return foo(y);
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
