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

var nu_stream_as_string = (p) => parse.bind(p,
  (ps) => parse.always(nu.reduce(
    (h, acc) => h + acc,
    ps)));

var consume_all = (p) => parse.expected('Not end of file', lang.then(p, parse.eof));


var step_point = (p) => {
  return bind_list(
    parse.getPosition, p, parse.getPosition,
    (start, result, end) => new ast.Steppoint({start: start.index, end: end.index}, result))
  };

var semi = parse.expected('semicolon', text.character(';'))

var letter_or_under = parse.either(text.letter, text.character('_'))
var ident = ws(parse.bind(
  nu_stream_as_string(parse.cons(
  letter_or_under, parse.many(parse.either(letter_or_under, text.digit)))),
  (id) => parse.always(id)));

var word = (w) => parse.attempt(lang.then(text.string(w), parse.look(parse.not(letter_or_under))));

var typ = parse.bind(ident, (t) => parse.always(new ast.TypName(t)));

var var_name = ident;

var integer_lit = parse.bind(
  nu_stream_as_string(parse.many1(text.digit)),
  (n) => parse.always(new ast.Lit(new ast.TypBase('int'), Number(n))));

var string_lit = parse.bind(
  lang.between(
    text.character('"'),
    text.character('"'),
    nu_stream_as_string(parse.many(text.noneOf('"')))),
  (str) => parse.always(new ast.Lit(new ast.TypPtr(new ast.TypBase('char')), str)));

var literal = parse.choice(
  integer_lit,
  string_lit);

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
    literal,
    parse.bind(ident, (n) => parse.always(new ast.Var(n))),
    lang.between(text.character('('),
                 text.character(')'),
                 ws(expr))));
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
            new ast.MemberAccess(op == '.' ? e : new ast.Deref(e), field)),
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
var group3 = bind_list(
  parse.many(ws(text.trie(['sizeof', '++', '--', '~', '!', '-', '+', '&', '*', 'delete']))),
  parse.choice(
    parse.bind(parse.next(word('new'), typ), (t) => parse.always(new ast.Uop('new', t))),
    group2
  ),
  (ops, e) => {
    return nu.foldr(
      (acc, op) => {
        if(op == '*') {
          return new ast.Deref(acc);
        }
        return new ast.Uop(op, acc);
      },
      e,
      ops)
    });
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
      parse.next(word('if'), ws(text.character('('))),
      text.character(')'),
      ws(step_point(expr)))),
    ws(stmt),
    parse.optional(undefined,
      parse.next(word('else'),
      ws(stmt))),
    (cond, body, orelse) => {
      return new ast.If(cond, body, orelse)
    }));

var while_loop = parse.late(() =>
  bind_list(
    ws(lang.between(
      parse.next(word('while'), ws(text.character('('))),
      text.character(')'),
      ws(step_point(expr)))),
    ws(stmt),
    (cond, body) => {
      return new ast.Loop(cond, body)
    }));

var for_loop = parse.late(() =>
  bind_list(
    parse.next(
      parse.next(word('for'), ws(text.character('('))),
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
    word('return'),
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
  declarator(typ), ws(params), ws(scope),
  (decl, params, body) => {
    var frame = {};
    for(var p of params) {
      frame[p.name] = p.typ;
    }
    function countVars(node) {
      if(node instanceof ast.Decl) {
        frame[node.name] = node.typ;
      }
      return node.apply(countVars);
    }
    countVars(body);
    return new ast.Fn(decl.typ, decl.name, params, body, frame);
    // new ast.Fn(decl.typ, decl.name, params, body)
  });

var obj_tmpl = bind_list(
  text.trie(['class', 'struct']),
  ws(parse.optional(undefined, var_name)),
  lang.between(
    text.character('{'),
    text.character('}'),
    ws(parse.eager(parse.many(ws(parse.choice(
      lang.then(text.trie(['public', 'private']), ws(':')),
      parse.attempt(fn_def),
      lang.then(var_decls, ws(semi))
    )))))),
  (type, name, lines) => {
    var publ = type == 'struct';
    var fields = [];
    for(var line of lines) {
      if(line == 'public') publ = true;
      else if(line == 'private') publ = false;
      else if(line instanceof ast.Fn){
        var typ = new ast.TypFn(line.ret, line.params);
        fields.push(new ast.ObjField(line.name, publ ? 'public' : 'private', typ, line));
      }
      else if(line instanceof ast.Seq){
        for(var decl of line.elems) {
          fields.push(new ast.ObjField(decl.name, publ ? 'public' : 'private', decl.typ, decl.init));
        }
      }
    }
    return new ast.TypObj(name, fields);
  });

var file = parse.bind(
    parse.eager(parse.many(
      ws(parse.choice(
        parse.bind(lang.then(obj_tmpl, ws(semi)),
          (obj_tmpl) => parse.always(new ast.Typedef(obj_tmpl.name, obj_tmpl))),
        fn_def)))),
    (body) => parse.always(new ast.Seq(body)));

var parseFile = (s) => parse.run(consume_all(file), s)
var parseFn = (s) => parse.run(consume_all(fn_def), s)
var parseExpr = (s) => parse.run(consume_all(expr), s)
var parseStmt = (s) => parse.run(consume_all(stmt), s)

module.exports = {
  parseFile: parseFile,
  parseFn: parseFn,
  parseExpr: parseExpr,
  parseStmt: parseStmt,
}
