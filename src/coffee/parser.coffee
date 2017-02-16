class Line
  constructor: (@ast, @start, @end) ->

class ParseError extends Error
  constructor: (@message, @position) ->
class CFunction
  constructor: (@type, @params, @body) ->
class Op
  constructor: (@op, @e1, @e2) ->
class Val
  constructor: (@type, @v) ->
class Var
  constructor: (@name) ->

Globals = {}
Globals.functions = {}
Globals.tokens = []
Globals.currentToken = 0

nextToken = ->
  if(Globals.currentToken >= Globals.tokens.length)
    throw new ParseError("Unexpected end of file")
  return Globals.tokens[Globals.currentToken]
peek = (type) ->
  return nextToken().type == type
pop = (type) ->
  if(!type || peek(type))
    Globals.currentToken++;
    return Globals.tokens[Globals.currentToken - 1]
  return false;
need = (type, message) ->
  tok = pop(type)
  if(!tok)
    throw new ParseError(message || "Expected '#{type}' but got '#{nextToken().type}'", nextToken().position)
  return tok

# popPattern = ->
#   startToken = Globals.currentToken
#   try
#     for arg in arguments
#       if(arg instanceof Function)
#         arg()
#       else
#         need(arg)
#   catch err
#     Globals.currentToken = startToken
#     return false
#   Globals.currentToken = startToken
#   return true

parseList = (start, end, delim, parseFunction) ->
  list = []
  need("OParen")
  if(!pop("CParen"))
    while(true)
      list.push(parseFunction())
      if !pop("Comma") then break
    need("CParen")
  return list

tryToParse = (parseFunction) ->
  start = Globals.currentToken
  try
    return parseFunction()
  catch error
    Globals.currentToken = start
    return false

parseExpr = () ->
  # function names refer to levels of precedence, as in http://en.cppreference.com/w/c/language/operator_precedence
  level14 = ->
    helper = (acc) ->
      if(pop("Assign"))
        return helper(new Op("Assign", acc, level7()))
      else
        return acc
    return helper(level7())

  level7 = ->
    helper = (acc) ->
      if(pop("Eq"))
        return helper(new Op("Eq", acc, level6()))
      else if(pop("Neq"))
        return helper(new Op("Neq", acc, level6()))
      else
        return acc
    return helper(level6())

  level6 = ->
    helper = (acc) ->
      if(cmp = (pop("Eq") || pop("Neq") || pop("Lt") || pop("Gt") || pop("Le") || pop("Ge")))
        return helper(new Op(cmp.type, acc, level4()))
      else
        return acc
    return helper(level4())


  level4 = ->
    helper = (acc) ->
      if(pop("Plus"))
        return helper(new Op("Plus", acc, level3()))
      else if(pop("Minus"))
        return helper(new Op("Minus", acc, level3()))
      else
        return acc
    return helper(level3())

  level3 = ->
    helper = (acc) ->
      if(pop("Star"))
        return helper(new Op("Mul", acc, level2()))
      else if(pop("Div"))
        return helper(new Op("Div", acc, level2()))
      else if(pop("Mod"))
        return helper(new Op("Mod", acc, level2()))
      else
        return acc
    return helper(level2())

  level2 = ->
    helper = ->
      if(pop("Star"))
        return new Op("Deref", helper())
      else if(pop("SingleAnd"))
        return new Op("Addr", helper())
      else
        return level1()
    return helper()

  level1 = ->
    helper = (acc) ->
      if(pop("Dot"))
        objType = Types.typeof(acc).name
        fieldName = need("Ident").string
        obj = objLookup(objType)
        field = obj.get(fieldName)
        base = if acc.base != undefined then cc.base else acc
        offset = if acc.offset != undefined then acc.offset + field.offset else field.offset
        if(field)
          return new Address(base, offset, field.type, "#{acc.name}.#{fieldName}")
        throw new ParseError("An object of type '#{objType}' has no member '#{fieldName}'")
      else
        return acc
    return helper(atom())

  atom = ->
    if(a = pop("LitInt"))
      return new Val("int", parseInt(a.string))
    else if(a = pop("Ident"))
      if(peek("OParen"))
        call = Call(a.string, parseList("OParen", "CParen", "Comma", parseExpr))
        return call
      else
        return new Var(a.string)
    else if(pop("OParen"))
      p = parseExpr()
      need("CParen")
      return p
    else
      throw new ParseError("Unexpected token of type '#{nextToken().type}'", nextToken().position)

  return level14()  

parseVarDecls = ->
  decls = []
  s = nextToken().position
  baseType = parseType()
  while(true)
    type = baseType
    # pointer modifier
    while(pop("Star"))
      type = new Types.Ptr(type)
    ident = need("Ident")
    # array modifier
    while(pop("OBracket"))
      type = new Types.Arr(type, parseExpr())
      need("CBracket")
    value = if pop("Assign") then parseExpr() else undefined
    # offset = currentFrame.push(type, ident.string, sizeof(type));
    # varInsert(type, ident, offset);
    decls.push(new Line(new Decl(type, ident.string, offset, value), s, nextToken().position))
    if(pop("Comma"))
      s = nextToken().position
    else
      break
  need("Semi")
  return decls

asLine = (f) ->
  s = nextToken().position
  r = f()
  e = nextToken().position
  return new Line(r, s, e)

parseScope = ->
  body = []
  need("OBrace")
  while(!pop("CBrace"))
    body = body.concat(asLine(parseExpr))
    need("Semi")
  return body

parseFunction = ->
  type = need("Type").string
  name = need("Ident").string

  if Globals.functions[name] != undefined
    throw new ParseError("function #{name} is defined at two locations")

  params = parseList("OParen", "CParen", "Comma", -> new Param(need("Type").string, need("Ident").string))
  body = parseScope()

  Globals.functions[name] = new CFunction(type, params, body)

parse = (tokens) ->
  Globals.tokens = tokens
  while(Globals.currentToken < Globals.tokens.length)
    parseFunction()
  return Globals.functions

module.exports = {
  parse: parse
  Val: Val
}
