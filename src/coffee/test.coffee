cjs = require('./cjs.coffee')

code = '''
int main() {
  1 + 2 + 3 + 4 + 5;
  2 * 4 * 6 * 8 * 10;
}
'''

try
  program = cjs.compile(code)
  code = program.dumpCode()
  console.log("Code:")
  console.log(code)
catch error
  console.log("Error:")
  console.log(error.message)
  if error.name == "ParseError"
    console.log("Line #{error.position.col}:")
    console.log(code.split('\n')[error.position.col-1])
    console.log(Array(error.position.row).join(" ") + "^")
