import { Token, tokenize } from "./tokenizer";
import { Tokens as Tok, Operators as Op, Types as Type, TextPosition, CompilerError } from "./shared";
import { visualPosition } from "./display";

export class CFunc { constructor(public type: Type, public name: string, public params: string[], public body: Expr[]) {} }
export class Expr { constructor() {} }
export class Lit extends Expr { constructor(public type: Type, public value: any) { super() } }
export class Binary extends Expr { constructor(public bop: Op, public e1: Expr, public e2: Expr) { super() } }
export class Var extends Expr { constructor(public name: string) { super() } }
export class Decl extends Expr { constructor(public name: string, public type: string, public value?: Expr) { super() } }
export class Seq extends Expr { constructor(public e1: Expr, public e2: Expr) { super() } }

type Parser<A> = (Token: Token[]) => [A, Token[]]

function combine<A,B>(a: [A], b: B): [A, B] {
  let [ap] = a;
  return [ap, b];
}

class ParserMonad<A> {
  private err: Error = undefined
  constructor( public tokens: Token[], private r?: [A] ) {}

  see( t: Tok ): Boolean {
    return getType(this.tokens[0]) == t;
  }

  then<B>( f: Parser<B> ): ParserMonad<A|B|[A, B]> {
    let [a] = this.r;
    let [b, rest] = f(this.tokens);
    let c: [A, B] = [a, b];
    return new ParserMonad(rest, c);
  }

  thenDrop( t: Tok ): ParserMonad<A> {
    let [, rest] = need(t, this.tokens);
    return new ParserMonad(rest, this.r);
  }

  thenGetValueOf( t: Tok ): ParserMonad<[A, string]> {
    let [a] = this.r;
    let [b, rest] = need(t, this.tokens);
    let c: [A, string] = [a, b.value];
    return new ParserMonad(rest, [c]);
  }

  result(): [A, Token[]] {
    if ( this.err != undefined ) {
      throw this.err;
    }
    let [r] = this.r;
    return [r, this.tokens];
  }
}

class State {
  private err: Error = undefined;
  constructor( public v: Expr, public tokens: Token[] ) {}
  private test( f: () => State ): State {
    try {
      return this.err == undefined ? f() : this;
    }
    catch (e) {
      this.err = e;
    }
    return this;
  }

  then( f: (Token) => [Expr, Token[]] ) {
    return this.test( () => {
      let [e, rest] = f(this.tokens);
      return new State(new Seq(this.v, e), rest);
    } );
  }

  thenExpect( t: Tok ): State {
    return this.test( () => {
      let [, rest] = need(t, this.tokens);
      return new State(this.v, rest);
    } );
  }

  extract(): [Expr, Token[]] {
    if ( this.err != undefined ) {
      throw this.err;
    }
    return [this.v, this.tokens];
  }
}

function oneOf(tokens: Token[], fs: [Parser<Expr>]): State {
  let err: Error = undefined;
  for (let f of fs) {
    try {
      let [e, rest] = f(tokens);
      return new State(e, rest);
    }
    catch (e) {
      err = e;
    }
  }
  throw err;
}

function need(type: Tok, tokens: Token[]): [Token, Token[]] {
  let [first, ...rest] = tokens;
  if (getType(first) != type) {
    throw new CompilerError(`Expected token of type ${Tok[type]}`, getPosition(first));
  }
  return [first, rest];
}

function pop(type: Tok, tokens: Token[]): [Token, Token[]] {
  let [first, ...rest] = tokens;
  if (getType(first) != type) {
    return [undefined, tokens];
  }
  return [first, rest];
}

function getType(token: Token): Tok {
  return (token == undefined) ? undefined : token.type;
}

function getPosition(token: Token): TextPosition {
  return (token == undefined) ? undefined : token.position;
}

let expression: Parser<Expr> = function(tokens: Token[]): [Expr, Token[]] {
  function parseBinary(tokens: Token[], nextLevel: Parser<Expr>, valid) {
    function loop(acc: Expr, tokens: Token[]) {
      let [first, ...rest] = tokens;
      let op = valid[getType(first)];
      if(op != undefined) {
          let [e2, restp] = nextLevel(rest);
          return loop(new Binary(op, acc, e2), restp);
      }
      return [acc, tokens];
    }
    let [acc, rest] = nextLevel(tokens);
    return loop(acc, rest);
  }

  // http://en.cppreference.com/w/cpp/language/operator_precedence
  let level6: Parser<Expr> = function(tokens) {
    return parseBinary(tokens, level5, {
      [Tok.Plus]: Op.Plus,
      [Tok.Minus]: Op.Minus,
    });
  }

  let level5: Parser<Expr> = function(tokens) {
    return parseBinary(tokens, atom, {
      [Tok.Star]: Op.Times,
      [Tok.Div]: Op.Divide,
    });
  }

  let atom: Parser<Expr> = function(tokens) {
    let [first, ...rest] = tokens;

    if (first == undefined) {
      throw new CompilerError('Unexpected EOF', undefined);
    }
    switch(getType(first)) {
      case Tok.OParen: {
        let [e, restp] = expression(rest);
        let [, restpp] = need(Tok.CParen, restp);
        return [e, restpp];
      }
      case Tok.LitInt: {
        let v = new Lit(Type.Integer, parseInt(first.value))
        return [v, rest];
      }
      case Tok.Var: {
        let v = new Var(first.value)
        return [v, rest]
      }
    }
    throw new CompilerError(`Unexpected token "${first.value}"`, first.position)
  }
  return level6(tokens);
}

function parseJoined(start: Tok, delimiter: Tok, end: Tok): (f: (Token) => [Expr, Token[]], Token) => [Expr[], Token[]] {
  return (parseFunc: (Token) => [Expr, Token[]], tokens: Token[]) => {
    let expr, exprs: Expr[] = [];
    let [, rest] = pop(start, tokens);
    while(rest[0].type != end) {
      [expr, rest] = parseFunc(rest);
      exprs.push(expr);
    }
    return [exprs, rest];
  }
}

function pattern(tokens: Token[], ...fs: (Parser<any>)[]): [any[], Token[]] {
  let e, result = [];
  for (let f of fs) {
    [e, tokens] = f(tokens);
    result.push(e);
  }
  return [result, tokens];
}

function wrapped( f: Parser<any>, start: Tok, end: Tok ): Parser<any> {
  return (tokens: Token[]) => {
    return new ParserMonad(tokens)
      .thenDrop(start)
      .then(f)
      .thenDrop(end).result()
  }
}

function parenthetical( f: Parser<any> ): Parser<any> {
  return wrapped(f, Tok.OParen, Tok.CParen);
}

function braced( f: Parser<any> ): Parser<any> {
  return wrapped(f, Tok.OBrace, Tok.CBrace);
}

function list<A>( f: Parser<A>, delimiter: Tok ): Parser<A[]> {
  return function r(tokens: Token[]) {
    let [e, rest] = f(tokens);
    let lp, l = [e];
    if (getType(rest[0]) == delimiter) {
      [, rest] = pop(delimiter, rest);
      [lp, rest] = r(rest);
      l = l.concat(lp);
    }
    return [l, rest];
  }
}

function funcDecl(tokens: Token[]): [Expr, Token[]] {
  return;
  // return new ParserMonad(tokens)
  //   .thenGetValueOf(Tok.Type)
  //   .thenGetValueOf(Tok.Var)
  //   .then(parenthetical(list(expression, Tok.Comma)))
  //   .then(braced(expression))
  //   .result( (typ, x, p, b) => new CFunc(Type.Integer, x, p, b) )
}

function varDecl(tokens: Token[]): [Expr, Token[]] {
  throw "Test!"
  // let [[typ, name, v], rest] = pattern(tokens,
  //
  // );
  // return [new Decl(name, typ, v), rest];
}

function line(tokens: Token[]): State {
  return oneOf(tokens, [
    expression,
    varDecl,
    funcDecl,
  ]).thenExpect(Tok.Semicolon);
}

function parse(tokens): Expr[] {
  let expr, exprs: Expr[] = [];
  while(tokens.length > 0) {
    [expr, tokens] = line(tokens).extract();
    exprs.push(expr);
  }
  return exprs;
}

function format(e: any) {
  console.log(e)
  if (e instanceof Array) {
    let s = "";
    for (let i of e) {
      s += format(i) + ","
    }
    return s;
  }
  else if (e instanceof CFunc) {
    return `Function ${format(e.name)}(${format(e.params)}): ${format(Type[e.type])} {
      ${format(e.body)}
    }`
  }
  else if (e instanceof Var) {
    return e.name;
  }
  else if (e instanceof Lit) {
    return e.value.toString();
  }
  else if (typeof e == "string") {
    return e;
  }
  else if (typeof e == "number") {
    return e.toString();
  }
  else {
    return `Unformattable: ${typeof e} (${JSON.stringify(e)})`
  }
}

class testMonad<A,B> {
  constructor(private f, private tokens: Token[]) {}
  bind<C>(a: (Token) => [C, Token[]]) {
    let [r, rest] = a(this.tokens);
    return new testMonad(
      () => f(...rest)
    , rest);
  }

  result(a: (A) => B) {
    return a(this.f);
  }
}

(function test() {
  let t = '1 + 2 + 3'
  // let p = foo<Expr, string>((tokens: Token[]) => [expression(tokens), tokens], "Hello", tokenize(t));
  let x: [number, number, string] = [1, 2, "Hello"];
  console.log(combine([1,2], 2))
  let test = (...x) => x
  let asdf = [1, 2]
  console.log(test(...asdf))
  console.log(test(1, 2, 3))


  let q = [1, "Hello"]
  let w = ["Bonjour", true]
  let e = "Wakka wakka";

  
  let testa = (x: number) => x
  let testb = (a, ...b) => a
  // console.log(p(tokenize(t)))
  // let code = 'int x(1, 2) { x };'
  // try {
  //   console.log(JSON.stringify(parse(tokenize(code))))
  // }
  // catch(e) {
  //   if (e instanceof CompilerError) {
  //     if (e.position == undefined) {
  //       e.position = { row: 0, col: code.length }
  //     }
  //     console.log("Compiler Error: ")
  //     console.log(e.message);
  //     console.log(visualPosition(code, e.position));
  //   }
  //   else {
  //     throw e;
  //   }
  // }
})()
