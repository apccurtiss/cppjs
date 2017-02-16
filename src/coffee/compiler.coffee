Parser = require('./parser.coffee')

class AsmOp
  constructor: (@op, @inp, @reg) ->

registerize = (ast, regs) ->
  getFreeRegister = ->
    for r in ["%a", "%b", "%c", "%d"]
      if r not in regs
        return r
    throw "Add more registers!"
  if ast.op in ["Plus", "Mul", "Times", "Div", "Mod"]
    [code1, reg1] = registerize(ast.e1, regs)
    [code2, reg2] = registerize(ast.e2, regs.concat(reg1))

    code = code1.concat(code2)
    code = code.concat(new AsmOp(ast.op, reg1, reg2))

    return [code, reg2]
  else if ast instanceof Parser.Val
    reg = getFreeRegister()
    return [[new AsmOp("Load", ast.v, reg)], reg]
  else
    throw "Unimplemented"

compile = (code) ->
  functions = Parser.parse(code)

  asm = []
  locations = {}
  console.log(functions)
  for name, code of functions
    locations[name] = asm.length
    for line in code.body
      [code, reg] = registerize(line.ast, [])
      code[0].start = line.start
      code[0].end = line.end
      asm = asm.concat(code)
  return asm

module.exports = {
  compile: compile
}
