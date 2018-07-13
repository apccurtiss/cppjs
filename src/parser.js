"use strict";

var parse = require('bennu').parse;
var text = require('bennu').text;
var lang = require('bennu').lang;
var nu = require('nu-stream').stream;
var ast = require('./ast');

var ws = (p) => lang.between(
  parse.many(text.space),
  parse.many(text.space),
  p);

var bind_list = (...args) => {
  var parsers = args.slice(0, -1);
  var f = args[args.length - 1];
  return parse.bind(parse.eager(
    parse.enumerationa(parsers)),
    (results) => parse.always(f.apply(null, results)));
}

var step_point = (p) => {
  return bind_list(
    parse.getPosition, p, parse.getPosition,
    (start, result, end) => new ast.Steppoint({start: start.index, end: end.index}, result))
  };

var semi = parse.expected('semicolon', text.character(';'))

var letter_or_under = parse.either(text.letter, text.character('_'))
var ident = ws(parse.bind(parse.cons(
  letter_or_under, parse.many(parse.either(letter_or_under, text.digit))),
  (chars) => parse.always(nu.foldl(
    (acc, c) => acc + c,
    '',
    chars
  ))));

var typ = parse.bind(ident, (t) => parse.always(new ast.TypName(t)));

var var_name = ident;

var number = parse.bind(
  parse.many1(text.digit),
  (ds) => parse.always(new ast.Lit('int', Number(nu.reduce(
    (d, acc) => d + acc,
    ds)))));

var prefxs = (ops, next) => parse.bind(
  parse.many(ws(ops)),
  (ops) => parse.bind(
    next,
    (e) => parse.always(nu.foldr(
      (acc, op) => new ast.Uop(op, acc),
      e,
      ops
  ))));

var bopsl = (ops, next) => lang.chainl1(
  parse.bind(
    ws(ops),
    (op) => parse.always((e1, e2) => new ast.Bop(op, e1, e2))),
  next);

var bopsr = (ops, next) => lang.chainr1(
  parse.bind(
    ws(ops),
    (op) => parse.always((e1, e2) => new ast.Bop(op, e1, e2))),
  next);

var ternary = (next) => lang.chainr1(
  bind_list(
    lang.between(
      ws(text.character('?')),
      ws(text.character(':')),
      next
    ),
    (e1) => parse.always((cond, e2) => new ast.Ternary(cond, e2, e3))),
  next);

// https://msdn.microsoft.com/en-us/library/126fe14k.aspx
var expr = parse.late(() => group18);
var group0 = ws(parse.choice(
    number,
    parse.bind(ident, (n) => parse.always(new ast.Var(n))),
    lang.between(text.character('('),
                 text.character(')'),
                 expr)));
var group1 = bopsl(text.string('::'), group0);
var group2 = parse.late(() => parse.choice(
    // TODO(alex): Casting
    // TODO(alex): typeid
    // Because this group's postfix operators parse in very different ways, each
    // parser returns a function that creates the AST node, allowing them to be
    // called in sequence, with the result of each one being passed to the next.
    bind_list(
      parse.getPosition,
      group1,
      parse.many(ws(parse.choice(
        parse.bind(text.trie(['++', '--']), (op) => parse.always((e) =>
          new ast.Uop(op, e))),
        bind_list(
          text.trie(['.', '->']),
          ws(ident),
          (op, field) => (e) =>
            new ast.MemberAccess(op == '.' ? e : new ast.Uop('*', e), field)),
        parse.bind(lang.between(
          ws(text.character('[')),
          ws(text.character(']')),
          expr),
          (index) => parse.always((e) =>
            new ast.IndexAccess(e, index))),
        bind_list(lang.between(
          ws(text.character('(')),
          ws(text.character(')')),
          // Group17 used here because commas are a valid operator in group18.
          parse.eager(lang.sepBy(ws(text.character(',')), group17))),
          parse.getPosition,
          (args, endPos) => (e, startPos) =>
            new ast.Call(e, args, { start: startPos, end: endPos }))))),
      (startPos, e, opfns) => {
        return nu.foldl(
        (acc, opfn) => opfn(acc, startPos),
        e,
        opfns
      )
    })));
// TODO(alex): Add casting
var group3 = prefxs(text.trie(['sizeof', '++', '--', '~', '!', '-', '+', '&',
    '*', 'new', 'delete']), group2);
var group4 = bopsl(text.trie(['.*', '->*']), group3);
var group5 = bopsl(text.oneOf('*/%'), group4);
var group6 = bopsl(text.oneOf('+-'), group5);
var group7 = bopsl(text.trie(['<<', '>>']), group6);
var group8 = bopsl(text.trie(['<', '>', '<=', '>=']), group7);
var group9 = bopsl(text.trie(['==', '!=']), group8);
var group10 = bopsl(text.character('&'), group9);
var group11 = bopsl(text.character('^'), group10);
var group12 = bopsl(text.character('|'), group11);
var group13 = bopsl(text.string('&&'), group12);
var group14 = bopsl(text.string('||'), group13);
var group15 = ternary(group14);
var group16 = bopsr(text.trie(['=', '*=', '/=', '+=', '-=']), group15);
var group17 = group16; // TODO(alex) throw
var group18 = bopsl(text.character(','), group17);

var declarator = (baseParser) => bind_list(
  baseParser,
  parse.many(ws(text.character('*'))),
  ws(var_name),
  parse.many(lang.between(
    ws(text.character('[')),
    ws(text.character(']')),
    expr)),
  (base, ptrs, name, arrs) => new ast.Decl(nu.foldl(
    (acc, h) => new ast.TypArr(acc, h),
    nu.foldl(
      (acc, _) => new ast.TypPtr(acc),
      base,
      ptrs),
    arrs), name));

var var_decls = parse.bind(typ, (t) => parse.bind(
  // parse.always([]),
  parse.eager(lang.sepBy1(ws(text.character(',')),
    bind_list(
      declarator(parse.always(t)),
      parse.optional(undefined, parse.next(
        // Group 17 used because ',' is a valid operator at group 18
        ws(text.character('=')),
        group17)),
      (decl, assign) => {
        if(assign) {
          decl.init = assign;
        }
        return decl;
      }
    ))),
    (decls) => parse.always(new ast.Seq(decls))));

var if_stmt = parse.late(() =>
  bind_list(
    ws(lang.between(
      parse.next(text.string('if'), ws(text.character('('))),
      text.character(')'),
      ws(step_point(expr)))),
    ws(stmt),
    parse.optional(undefined,
      parse.next(text.string('else'),
      ws(stmt))),
    (cond, body, orelse) => {
      return new ast.If(cond, body, orelse)
    }));

var while_loop = parse.late(() =>
  bind_list(
    ws(lang.between(
      parse.next(text.string('while'), ws(text.character('('))),
      text.character(')'),
      ws(step_point(expr)))),
    ws(stmt),
    (cond, body) => {
      return new ast.Loop(cond, body)
    }));

var for_loop = parse.late(() =>
  bind_list(
    parse.next(
      parse.next(text.string('for'), ws(text.character('('))),
      step_point(parse.either(parse.attempt(var_decls), expr))),
    lang.between(
      ws(semi),
      ws(semi),
      step_point(expr)),
    lang.then(
      step_point(expr),
      ws(text.character(')'))),
    ws(stmt),
    (init, cond, inc, body) => {
      return new ast.Scope(new ast.Seq([
        init,
        new ast.Loop(cond, new ast.Seq([
          body,
          inc,
        ])),
      ]));
    }));

var scope = parse.late(() => lang.between(
    text.character('{'),
    text.character('}'),
    parse.bind(ws(stmts), s => parse.always(new ast.Scope(new ast.Seq(s))))))

var stmt = ws(parse.choice(
  if_stmt,
  while_loop,
  for_loop,
  scope,
  step_point(parse.bind(lang.between(
    text.string('return'),
    semi,
    ws(expr)),
    (e) => parse.always(new ast.Return(e)))),
  step_point(parse.attempt(lang.then(var_decls, semi))),
  step_point(lang.then(expr, semi)),
  step_point(parse.next(semi, parse.always(new ast.Nop())))));

var stmts = parse.eager(parse.many(ws(stmt)));

var params = lang.between(
  text.character('('),
  text.character(')'),
  parse.eager(
    ws(lang.sepBy(ws(text.character(',')), declarator(typ)))));

var fn_def = bind_list(
  typ, ws(ident), ws(params), ws(scope),
  (typ, name, params, body) => new ast.Fn(typ, name, params, body));

var obj_tmpl = bind_list(
  text.trie(['class', 'struct']),
  ws(parse.optional(undefined, var_name)),
  lang.between(
    text.character('{'),
    text.character('}'),
    ws(parse.eager(parse.many(ws(parse.either(
      lang.then(text.trie(['public', 'private']), ws(':')),
      lang.then(var_decls, ws(semi))
    )))))),
  (type, name, decls) => {
    var publ = type == 'struct';
    var publ = [];
    var priv = [];
    for(var decl of decls) {
      if(decl == 'public') publ = true;
      else if(decl == 'private') publ = false;
      else {
        for(var v of decl.elems) {
          if (publ) publ.push(v);
          else priv.push(v);
        }
      }
    }
    return new ast.ObjTmpl(name, publ, priv);
  });

var file = parse.bind(lang.then(
    parse.eager(parse.many(
      ws(parse.choice(
        lang.then(obj_tmpl, ws(semi)),
        fn_def)))),
    parse.eof),
    (body) => parse.always(new ast.CFile(body)));

var parseFile = (s) => parse.run(file, s)
var parseFn = (s) => parse.run(fn_def, s)
var parseExpr = (s) => parse.run(expr, s)
var parseStmt = (s) => parse.run(stmt, s)

module.exports = {
  parseFile: parseFile,
  parseFn: parseFn,
  parseExpr: parseExpr,
  parseStmt: parseStmt,
}
