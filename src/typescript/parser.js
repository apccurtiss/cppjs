"use strict";
exports.__esModule = true;
var tokenizer_1 = require("./tokenizer");
var tokens = tokenizer_1.tokenize('1 + 2 + 3');
for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    console.log(tokenizer_1.TokenType[token.type], token.position);
}
