var tokenizer = require("./tokenizer.js");
var test = require('tape');

test('lines of code', function(t) {
  t.plan(3);
  
  var test1 = "int x = 5;";
  var test2 = "double x = 4.07;";
  var test3 = "(7 - 11.5)/(2 + 3.506) % 8;";
  
  t.deepLooseEqual(
    tokenizer(test1),
    [ { type: 'Int',
        string: 'int',
        position: { lnum: 1, line: 'int x = 5;', index: 1 } },
      { type: 'Ident',
        string: 'x',
        position: { lnum: 1, line: 'int x = 5;', index: 5 } },
      { type: 'Assign',
        string: '=',
        position: { lnum: 1, line: 'int x = 5;', index: 7 } },
      { type: 'LitInt',
        string: '5',
        position: { lnum: 1, line: 'int x = 5;', index: 9 } },
      { type: 'Semi',
        string: ';',
        position: { lnum: 1, line: 'int x = 5;', index: 10 } }
    ],
    test1
  );
  
  t.deepLooseEqual(
    tokenizer(test2),
    [ { type: 'Double',
        string: 'double',
        position: { lnum: 1, line: 'double x = 4.07;', index: 1 } },
      { type: 'Ident',
        string: 'x',
        position: { lnum: 1, line: 'double x = 4.07;', index: 8 } },
      { type: 'Assign',
        string: '=',
        position: { lnum: 1, line: 'double x = 4.07;', index: 10 } },
      { type: 'LitDouble',
        string: '4.07',
        position: { lnum: 1, line: 'double x = 4.07;', index: 12 } },
      { type: 'Semi',
        string: ';',
        position: { lnum: 1, line: 'double x = 4.07;', index: 16 } }
    ],
    test2
  );

  t.deepLooseEqual(
    tokenizer(test3),
    [ { type: 'OParen',
        string: '(',
        position: { lnum: 1, line: '(7 - 11.5)/(2 + 3.506) % 8;', index: 1 } },
      { type: 'LitInt',
        string: '7',
        position: { lnum: 1, line: '(7 - 11.5)/(2 + 3.506) % 8;', index: 2 } },
      { type: 'Minus',
        string: '-',
        position: { lnum: 1, line: '(7 - 11.5)/(2 + 3.506) % 8;', index: 4 } },
      { type: 'LitDouble',
        string: '11.5',
        position: { lnum: 1, line: '(7 - 11.5)/(2 + 3.506) % 8;', index: 6 } },
      { type: 'CParen',
        string: ')',
        position: { lnum: 1, line: '(7 - 11.5)/(2 + 3.506) % 8;', index: 10 } },
      { type: 'Div',
        string: '/',
        position: { lnum: 1, line: '(7 - 11.5)/(2 + 3.506) % 8;', index: 11 } },
      { type: 'OParen',
        string: '(',
        position: { lnum: 1, line: '(7 - 11.5)/(2 + 3.506) % 8;', index: 12 } },
      { type: 'LitInt',
        string: '2',
        position: { lnum: 1, line: '(7 - 11.5)/(2 + 3.506) % 8;', index: 13 } },
      { type: 'Plus',
        string: '+',
        position: { lnum: 1, line: '(7 - 11.5)/(2 + 3.506) % 8;', index: 15 } },
      { type: 'LitDouble',
        string: '3.506',
        position: { lnum: 1, line: '(7 - 11.5)/(2 + 3.506) % 8;', index: 17 } },
      { type: 'CParen',
        string: ')',
        position: { lnum: 1, line: '(7 - 11.5)/(2 + 3.506) % 8;', index: 22 } },
      { type: 'Mod',
        string: '%',
        position: { lnum: 1, line: '(7 - 11.5)/(2 + 3.506) % 8;', index: 24 } },
      { type: 'LitInt',
        string: '8',
        position: { lnum: 1, line: '(7 - 11.5)/(2 + 3.506) % 8;', index: 26 } },
      { type: 'Semi',
        string: ';',
        position: { lnum: 1, line: '(7 - 11.5)/(2 + 3.506) % 8;', index: 27 } }
    ],
    test3
  )
})

test("control stuctures", function(t) {
  t.plan(2);
  
  var test1 = `int foo(int bar) {
      int koala = bar * 112;
      int ice_cream = bar / 2;
      int justCamelCase = ((ice_cream + koala) / (1 + koala)) % ice_cream;
      return justCamelCase;
    }`;
  var test2 = `int joking = 0;
    for (int index = 0; index < 10; index++) {
      joking += 1;
    }`;
    
  t.deepLooseEqual(
    tokenizer(test1),
    [ { type: 'Int',
        string: 'int',
        position: { lnum: 1, line: 'int foo(int bar) {', index: 1 } },
      { type: 'Ident',
        string: 'foo',
        position: { lnum: 1, line: 'int foo(int bar) {', index: 5 } },
      { type: 'OParen',
        string: '(',
        position: { lnum: 1, line: 'int foo(int bar) {', index: 8 } },
      { type: 'Int',
        string: 'int',
        position: { lnum: 1, line: 'int foo(int bar) {', index: 9 } },
      { type: 'Ident',
        string: 'bar',
        position: { lnum: 1, line: 'int foo(int bar) {', index: 13 } },
      { type: 'CParen',
        string: ')',
        position: { lnum: 1, line: 'int foo(int bar) {', index: 16 } },
      { type: 'OBrace',
        string: '{',
        position: { lnum: 1, line: 'int foo(int bar) {', index: 18 } },
      { type: 'Int',
        string: 'int',
        position: { lnum: 2, line: '      int koala = bar * 112;', index: 7 } },
      { type: 'Ident',
        string: 'koala',
        position: { lnum: 2, line: '      int koala = bar * 112;', index: 11 } },
      { type: 'Assign',
        string: '=',
        position: { lnum: 2, line: '      int koala = bar * 112;', index: 17 } },
      { type: 'Ident',
        string: 'bar',
        position: { lnum: 2, line: '      int koala = bar * 112;', index: 19 } },
      { type: 'Star',
        string: '*',
        position: { lnum: 2, line: '      int koala = bar * 112;', index: 23 } },
      { type: 'LitInt',
        string: '112',
        position: { lnum: 2, line: '      int koala = bar * 112;', index: 25 } },
      { type: 'Semi',
        string: ';',
        position: { lnum: 2, line: '      int koala = bar * 112;', index: 28 } },
      { type: 'Int',
        string: 'int',
        position: { lnum: 3, line: '      int ice_cream = bar / 2;', index: 7 } },
      { type: 'Ident',
        string: 'ice_cream',
        position: { lnum: 3, line: '      int ice_cream = bar / 2;', index: 11 } },
      { type: 'Assign',
        string: '=',
        position: { lnum: 3, line: '      int ice_cream = bar / 2;', index: 21 } },
      { type: 'Ident',
        string: 'bar',
        position: { lnum: 3, line: '      int ice_cream = bar / 2;', index: 23 } },
      { type: 'Div',
        string: '/',
        position: { lnum: 3, line: '      int ice_cream = bar / 2;', index: 27 } },
      { type: 'LitInt',
        string: '2',
        position: { lnum: 3, line: '      int ice_cream = bar / 2;', index: 29 } },
      { type: 'Semi',
        string: ';',
        position: { lnum: 3, line: '      int ice_cream = bar / 2;', index: 30 } },
      { type: 'Int',
        string: 'int',
        position:
          {
           lnum: 4,
           line: '      int justCamelCase = ((ice_cream + koala) / (1 + koala)) % ice_cream;',
           index: 7 } },
      { type: 'Ident',
        string: 'justCamelCase',
        position:
          {
           lnum: 4,
           line: '      int justCamelCase = ((ice_cream + koala) / (1 + koala)) % ice_cream;',
           index: 11 } },
      { type: 'Assign',
        string: '=',
        position:
          {
           lnum: 4,
           line: '      int justCamelCase = ((ice_cream + koala) / (1 + koala)) % ice_cream;',
           index: 25 } },
      { type: 'OParen',
        string: '(',
        position:
          {
           lnum: 4,
           line: '      int justCamelCase = ((ice_cream + koala) / (1 + koala)) % ice_cream;',
           index: 27 } },
      { type: 'OParen',
        string: '(',
        position:
          {
           lnum: 4,
           line: '      int justCamelCase = ((ice_cream + koala) / (1 + koala)) % ice_cream;',
           index: 28 } },
      { type: 'Ident',
        string: 'ice_cream',
        position:
          {
           lnum: 4,
           line: '      int justCamelCase = ((ice_cream + koala) / (1 + koala)) % ice_cream;',
           index: 29 } },
      { type: 'Plus',
        string: '+',
        position:
          {
           lnum: 4,
           line: '      int justCamelCase = ((ice_cream + koala) / (1 + koala)) % ice_cream;',
           index: 39 } },
      { type: 'Ident',
        string: 'koala',
        position:
          {
           lnum: 4,
           line: '      int justCamelCase = ((ice_cream + koala) / (1 + koala)) % ice_cream;',
           index: 41 } },
      { type: 'CParen',
        string: ')',
        position:
          {
           lnum: 4,
           line: '      int justCamelCase = ((ice_cream + koala) / (1 + koala)) % ice_cream;',
           index: 46 } },
      { type: 'Div',
        string: '/',
        position:
          {
           lnum: 4,
           line: '      int justCamelCase = ((ice_cream + koala) / (1 + koala)) % ice_cream;',
           index: 48 } },
      { type: 'OParen',
        string: '(',
        position:
          {
           lnum: 4,
           line: '      int justCamelCase = ((ice_cream + koala) / (1 + koala)) % ice_cream;',
           index: 50 } },
      { type: 'LitInt',
        string: '1',
        position:
          {
           lnum: 4,
           line: '      int justCamelCase = ((ice_cream + koala) / (1 + koala)) % ice_cream;',
           index: 51 } },
      { type: 'Plus',
        string: '+',
        position:
          {
           lnum: 4,
           line: '      int justCamelCase = ((ice_cream + koala) / (1 + koala)) % ice_cream;',
           index: 53 } },
      { type: 'Ident',
        string: 'koala',
        position:
          {
           lnum: 4,
           line: '      int justCamelCase = ((ice_cream + koala) / (1 + koala)) % ice_cream;',
           index: 55 } },
      { type: 'CParen',
        string: ')',
        position:
          {
           lnum: 4,
           line: '      int justCamelCase = ((ice_cream + koala) / (1 + koala)) % ice_cream;',
           index: 60 } },
      { type: 'CParen',
        string: ')',
        position:
          {
           lnum: 4,
           line: '      int justCamelCase = ((ice_cream + koala) / (1 + koala)) % ice_cream;',
           index: 61 } },
      { type: 'Mod',
        string: '%',
        position:
          {
           lnum: 4,
           line: '      int justCamelCase = ((ice_cream + koala) / (1 + koala)) % ice_cream;',
           index: 63 } },
      { type: 'Ident',
        string: 'ice_cream',
        position:
          {
           lnum: 4,
           line: '      int justCamelCase = ((ice_cream + koala) / (1 + koala)) % ice_cream;',
           index: 65 } },
      { type: 'Semi',
        string: ';',
        position:
          {
           lnum: 4,
           line: '      int justCamelCase = ((ice_cream + koala) / (1 + koala)) % ice_cream;',
           index: 74 } },
      { type: 'Return',
        string: 'return',
        position: { lnum: 5, line: '      return justCamelCase;', index: 7 } },
      { type: 'Ident',
        string: 'justCamelCase',
        position: { lnum: 5, line: '      return justCamelCase;', index: 14 } },
      { type: 'Semi',
        string: ';',
        position: { lnum: 5, line: '      return justCamelCase;', index: 27 } },
      { type: 'CBrace',
        string: '}',
        position: { lnum: 6, line: '    }', index: 5 } }
    ],
    test1
  )
  
  t.deepLooseEqual(
    tokenizer(test2),
    [ { type: 'Int',
        string: 'int',
        position: { lnum: 1, line: 'int joking = 0;', index: 1 } },
      { type: 'Ident',
        string: 'joking',
        position: { lnum: 1, line: 'int joking = 0;', index: 5 } },
      { type: 'Assign',
        string: '=',
        position: { lnum: 1, line: 'int joking = 0;', index: 12 } },
      { type: 'LitInt',
        string: '0',
        position: { lnum: 1, line: 'int joking = 0;', index: 14 } },
      { type: 'Semi',
        string: ';',
        position: { lnum: 1, line: 'int joking = 0;', index: 15 } },
      { type: 'For',
        string: 'for',
        position:
          {
           lnum: 2,
           line: '    for (int index = 0; index < 10; index++) {',
           index: 5 } },
      { type: 'OParen',
        string: '(',
        position:
          {
           lnum: 2,
           line: '    for (int index = 0; index < 10; index++) {',
           index: 9 } },
      { type: 'Int',
        string: 'int',
        position:
          {
           lnum: 2,
           line: '    for (int index = 0; index < 10; index++) {',
           index: 10 } },
      { type: 'Ident',
        string: 'index',
        position:
          {
           lnum: 2,
           line: '    for (int index = 0; index < 10; index++) {',
           index: 14 } },
      { type: 'Assign',
        string: '=',
        position:
          {
           lnum: 2,
           line: '    for (int index = 0; index < 10; index++) {',
           index: 20 } },
      { type: 'LitInt',
        string: '0',
        position:
          {
           lnum: 2,
           line: '    for (int index = 0; index < 10; index++) {',
           index: 22 } },
      { type: 'Semi',
        string: ';',
        position:
          {
           lnum: 2,
           line: '    for (int index = 0; index < 10; index++) {',
           index: 23 } },
      { type: 'Ident',
        string: 'index',
        position:
          {
           lnum: 2,
           line: '    for (int index = 0; index < 10; index++) {',
           index: 25 } },
      { type: 'Lt',
        string: '<',
        position:
          {
           lnum: 2,
           line: '    for (int index = 0; index < 10; index++) {',
           index: 31 } },
      { type: 'LitInt',
        string: '10',
        position:
          {
           lnum: 2,
           line: '    for (int index = 0; index < 10; index++) {',
           index: 33 } },
      { type: 'Semi',
        string: ';',
        position:
          {
           lnum: 2,
           line: '    for (int index = 0; index < 10; index++) {',
           index: 35 } },
      { type: 'Ident',
        string: 'index',
        position:
          {
           lnum: 2,
           line: '    for (int index = 0; index < 10; index++) {',
           index: 37 } },
      { type: 'PostInc',
        string: '++',
        position:
          {
           lnum: 2,
           line: '    for (int index = 0; index < 10; index++) {',
           index: 42 } },
      { type: 'CParen',
        string: ')',
        position:
          {
           lnum: 2,
           line: '    for (int index = 0; index < 10; index++) {',
           index: 44 } },
      { type: 'OBrace',
        string: '{',
        position:
          {
           lnum: 2,
           line: '    for (int index = 0; index < 10; index++) {',
           index: 46 } },
      { type: 'Ident',
        string: 'joking',
        position: { lnum: 3, line: '      joking += 1;', index: 7 } },
      { type: 'Plus',
        string: '+',
        position: { lnum: 3, line: '      joking += 1;', index: 14 } },
      { type: 'Assign',
        string: '=',
        position: { lnum: 3, line: '      joking += 1;', index: 15 } },
      { type: 'LitInt',
        string: '1',
        position: { lnum: 3, line: '      joking += 1;', index: 17 } },
      { type: 'Semi',
        string: ';',
        position: { lnum: 3, line: '      joking += 1;', index: 18 } },
      { type: 'CBrace',
        string: '}',
        position: { lnum: 4, line: '    }', index: 5 } }
    ],
    test2
  )
  
})
