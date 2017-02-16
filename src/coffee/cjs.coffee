Tokenizer = require('./tokenizer.coffee')
Compiler = require('./compiler.coffee')

class Program
  constructor: (code) ->
    @load(code)
  load: (code) ->
    @tokens = Tokenizer.tokenize(code)
    @code = Compiler.compile(@tokens)
  dumpCode: ->
    return @code

compile = (code) ->
  return new Program(code)

module.exports = {
  compile: compile
}
