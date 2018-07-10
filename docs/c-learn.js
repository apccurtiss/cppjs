require=(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
/*
 * THIS FILE IS AUTO GENERATED FROM 'lib/incremental.kep'
 * DO NOT EDIT
*/
"use strict";
var __o = require("./parse"),
    stream = require("nu-stream")["stream"],
    provide, provideString, finish, parseIncState, parseInc, runIncState, runInc, runManyState, runManyStream, runMany,
        bind = __o["bind"],
    getParserState = __o["getParserState"],
    next = __o["next"],
    optional = __o["optional"],
    parseState = __o["parseState"],
    Parser = __o["Parser"],
    ParserState = __o["ParserState"],
    Position = __o["Position"],
    runState = __o["runState"],
    trampoline = __o["trampoline"],
    streamFrom = stream["from"],
    isEmpty = stream["isEmpty"],
    NIL = stream["NIL"],
    memoStream = stream["memoStream"],
    Request = (function(chunk, k) {
        var self = this;
        (self.chunk = chunk);
        (self.k = k);
    }),
    Session = (function(done, k, chunks) {
        var self = this;
        (self.done = done);
        (self.k = k);
        (self.chunks = chunks);
    });
(Session.prototype.addChunk = (function(c) {
    var self = this;
    return new(Session)(self.done, self.k, self.chunks.concat(c));
}));
(Session.prototype.hasChunk = (function(c) {
    var self = this;
    return (c < self.chunks.length);
}));
(Session.prototype.getChunk = (function(c) {
    var self = this;
    return self.chunks[c];
}));
var IncrementalState = (function(chunk, state) {
    var self = this;
    (self.chunk = chunk);
    (self.state = state);
});
Object.defineProperties(IncrementalState.prototype, ({
    input: ({
        get: (function() {
            var self = this;
            return self.state.input;
        })
    }),
    position: ({
        get: (function() {
            var self = this;
            return self.state.position;
        })
    }),
    userState: ({
        get: (function() {
            var self = this;
            return self.state.userState;
        })
    })
}));
(IncrementalState.prototype.eq = (function(other) {
    var self = this;
    return ((other && (other.chunk === self.chunk)) && self.state.eq(other.state));
}));
(IncrementalState.prototype.isEmpty = (function() {
    var self = this;
    return self.state.isEmpty();
}));
(IncrementalState.prototype.first = (function() {
    var self = this;
    return self.state.first();
}));
(IncrementalState.prototype.next = (function(x) {
    var self = this;
    if ((!self._next)) {
        var chunk = self.chunk;
        (self._next = bind(next(self.state.next(x), getParserState), (function(innerState) {
            var state;
            return (innerState.isEmpty() ? new(Parser)((function(_, m, cok) {
                return new(Request)((chunk + 1), (function(i) {
                    return cok(x, new(IncrementalState)((chunk + 1), innerState
                        .setInput(i)), m);
                }));
            })) : ((state = new(IncrementalState)(chunk, innerState)), new(Parser)((function(_,
                m, cok) {
                return cok(x, state, m);
            }))));
        })));
    }
    return self._next;
}));
(IncrementalState.prototype.setInput = (function(input) {
    var self = this;
    return new(IncrementalState)(self.chunk, self.state.setInput(input));
}));
(IncrementalState.prototype.setPosition = (function(position) {
    var self = this;
    return new(IncrementalState)(self.chunk, self.state.setPosition(position));
}));
(IncrementalState.prototype.setUserState = (function(userState) {
    var self = this;
    return new(IncrementalState)(self.chunk, self.state.setUserState(userState));
}));
var forceProvide = (function(c, r) {
    if (r.done) return r;
    var r2 = r.addChunk(c),
        result = trampoline(r2.k(c));
    while (((result instanceof Request) && r2.hasChunk(result.chunk))) {
        (result = trampoline(result.k(r2.getChunk(result.chunk))));
    }
    return ((result instanceof Request) ? new(Session)(false, result.k, r2.chunks) : result);
});
(provide = (function(c, r) {
    return (isEmpty(c) ? r : forceProvide(c, r));
}));
(provideString = (function(input, r) {
    return provide(streamFrom(input), r);
}));
var x = forceProvide.bind(null, NIL);
(finish = (function(z) {
    var r = x(z);
    return r.k();
}));
(parseIncState = (function(p, state, ok, err) {
    var pok = (function(x0, s) {
        return new(Session)(true, ok.bind(null, x0, s));
    }),
        perr = (function(x0, s) {
            return new(Session)(true, err.bind(null, x0, s));
        });
    return provide(state.input, new(Session)(false, (function(i) {
        return parseState(p, new(IncrementalState)(0, state.setInput(i)), pok, perr);
    }), []));
}));
(parseInc = (function(p, ud, ok, err) {
    return parseIncState(p, new(ParserState)(NIL, Position.initial, ud), ok, err);
}));
var ok = (function(x0) {
    return x0;
}),
    err = (function(x0) {
        throw x0;
    });
(runIncState = (function(p, state) {
    return parseIncState(p, state, ok, err);
}));
(runInc = (function(p, ud) {
    return runIncState(p, new(ParserState)(NIL, Position.initial, ud));
}));
(runManyState = (function(p, state) {
    var manyP = optional(NIL, bind(p, (function(x0) {
        return new(Parser)((function(state0, m, _, _0, eok, _1) {
            return eok(memoStream(x0, runState.bind(null, manyP, state0, m)), state0, m);
        }));
    })));
    return runState(manyP, state);
}));
(runManyStream = (function(p, s, ud) {
    return runManyState(p, new(ParserState)(s, Position.initial, ud));
}));
(runMany = (function(p, input, ud) {
    return runManyStream(p, streamFrom(input), ud);
}));
(exports["provide"] = provide);
(exports["provideString"] = provideString);
(exports["finish"] = finish);
(exports["parseIncState"] = parseIncState);
(exports["parseInc"] = parseInc);
(exports["runIncState"] = runIncState);
(exports["runInc"] = runInc);
(exports["runManyState"] = runManyState);
(exports["runManyStream"] = runManyStream);
(exports["runMany"] = runMany);
},{"./parse":3,"nu-stream":10}],2:[function(require,module,exports){
/*
 * THIS FILE IS AUTO GENERATED FROM 'lib/lang.kep'
 * DO NOT EDIT
*/
"use strict";
var __o = require("nu-stream")["stream"],
    __o0 = require("nu-stream")["gen"],
    __o1 = require("./parse"),
    times, atMostTimes, betweenTimes, then, between, sepBy1, sepBy, sepEndBy1, sepEndBy, endBy1, endBy, chainl1, chainl,
        chainr1, chainr, NIL = __o["NIL"],
    repeat = __o0["repeat"],
    append = __o1["append"],
    always = __o1["always"],
    bind = __o1["bind"],
    cons = __o1["cons"],
    either = __o1["either"],
    enumerations = __o1["enumerations"],
    late = __o1["late"],
    many = __o1["many"],
    many1 = __o1["many1"],
    next = __o1["next"],
    optional = __o1["optional"],
    rec = __o1["rec"],
    _end = always(NIL),
    _optionalValueParser = optional.bind(null, NIL);
(times = (function() {
    var args = arguments;
    return enumerations(repeat.apply(null, args));
}));
(atMostTimes = (function(n, p) {
    return ((n <= 0) ? _end : _optionalValueParser(cons(p, late((function() {
        return atMostTimes((n - 1), p);
    })))));
}));
(betweenTimes = (function(min, max, p) {
    var args, n;
    return append(((args = [min, p]), enumerations(repeat.apply(null, args))), ((n = (max - min)), ((n <= 0) ?
        _end : _optionalValueParser(cons(p, late((function() {
            return atMostTimes((n - 1), p);
        })))))));
}));
(then = (function(p, q) {
    return bind(p, (function(x) {
        return next(q, always(x));
    }));
}));
(between = (function(open, close, p) {
    return next(open, bind(p, (function(x) {
        return next(close, always(x));
    })));
}));
(sepBy1 = (function(sep, p) {
    return cons(p, many(next(sep, p)));
}));
(sepBy = (function() {
    var args = arguments;
    return _optionalValueParser(sepBy1.apply(null, args));
}));
(sepEndBy1 = (function(sep, p) {
    return rec((function(self) {
        return cons(p, _optionalValueParser(next(sep, _optionalValueParser(self))));
    }));
}));
(sepEndBy = (function(sep, p) {
    return either(rec((function(self) {
        return cons(p, _optionalValueParser(next(sep, _optionalValueParser(self))));
    })), next(optional(sep), _end));
}));
(endBy1 = (function(sep, p) {
    return many1(bind(p, (function(x) {
        return next(sep, always(x));
    })));
}));
(endBy = (function(sep, p) {
    return many(bind(p, (function(x) {
        return next(sep, always(x));
    })));
}));
(chainl1 = (function(op, p) {
    return bind(p, (function chain(x) {
        return optional(x, bind(op, (function(f) {
            return bind(p, (function(y) {
                return chain(f(x, y));
            }));
        })));
    }));
}));
(chainl = (function(op, x, p) {
    return optional(x, bind(p, (function chain(x0) {
        return optional(x0, bind(op, (function(f) {
            return bind(p, (function(y) {
                return chain(f(x0, y));
            }));
        })));
    })));
}));
(chainr1 = (function(op, p) {
    return rec((function(self) {
        return bind(p, (function(x) {
            return optional(x, bind(op, (function(f) {
                return self.map((function(y) {
                    return f(x, y);
                }));
            })));
        }));
    }));
}));
(chainr = (function(op, x, p) {
    return optional(x, rec((function(self) {
        return bind(p, (function(x0) {
            return optional(x0, bind(op, (function(f) {
                return self.map((function(y) {
                    return f(x0, y);
                }));
            })));
        }));
    })));
}));
(exports["times"] = times);
(exports["atMostTimes"] = atMostTimes);
(exports["betweenTimes"] = betweenTimes);
(exports["then"] = then);
(exports["between"] = between);
(exports["sepBy1"] = sepBy1);
(exports["sepBy"] = sepBy);
(exports["sepEndBy1"] = sepEndBy1);
(exports["sepEndBy"] = sepEndBy);
(exports["endBy1"] = endBy1);
(exports["endBy"] = endBy);
(exports["chainl1"] = chainl1);
(exports["chainl"] = chainl);
(exports["chainr1"] = chainr1);
(exports["chainr"] = chainr);
},{"./parse":3,"nu-stream":10}],3:[function(require,module,exports){
/*
 * THIS FILE IS AUTO GENERATED FROM 'lib/parse.kep'
 * DO NOT EDIT
*/
"use strict";
var stream = require("nu-stream")["stream"],
    seshat = require("seshet"),
    Tail, trampoline, ParserError, ParseError, MultipleError, UnknownError, UnexpectError, ExpectError, ParserState,
        Position, Parser, label, late, rec, unparser, always, of, never, bind, chain, map, ap, extract, getParserState,
        setParserState, modifyParserState, getState, setState, modifyState, getInput, setInput, getPosition,
        setPosition, fail, attempt, look, lookahead, next, sequences, sequencea, sequence, empty, either, concat,
        choices, choicea, choice, optional, expected, not, eager, binds, cons, append, enumerations, enumerationa,
        enumeration, many, many1, manyTill, memo, token, anyToken, eof, exec, parseState, parseStream, parse, runState,
        runStream, run, testState, testStream, test, NIL = stream["NIL"],
    first = stream["first"],
    isEmpty = stream["isEmpty"],
    rest = stream["rest"],
    reduceRight = stream["reduceRight"],
    foldr = stream["foldr"],
    identity = (function(x) {
        return x;
    }),
    args = (function() {
        var args0 = arguments;
        return args0;
    });
(Tail = (function(p, state, m, cok, cerr, eok, eerr) {
    var self = this;
    (self.p = p);
    (self.state = state);
    (self.m = m);
    (self.cok = cok);
    (self.cerr = cerr);
    (self.eok = eok);
    (self.eerr = eerr);
}));
(trampoline = (function(f) {
    var value = f;
    while ((value instanceof Tail)) {
        (value = value.p(value.state, value.m, value.cok, value.cerr, value.eok, value.eerr));
    }
    return value;
}));
var Memoer = (function(memoer, frames) {
    var self = this;
    (self.memoer = memoer);
    (self.frames = frames);
});
(Memoer.empty = new(Memoer)(seshat.create((function(x, y) {
    return x.compare(y);
}), (function(x, y) {
    return ((x.id === y.id) && ((x.state === y.state) || (x.state && x.state.eq(y.state))));
})), NIL));
(Memoer.pushWindow = (function(m, lower) {
    return new(Memoer)(m.memoer, stream.cons(lower, m.frames));
}));
(Memoer.popWindow = (function(m) {
    var frames = m["frames"],
        r = rest(frames);
    return new(Memoer)((isEmpty(r) ? seshat.prune(m.memoer, first(frames)) : m.memoer), r);
}));
(Memoer.prune = (function(m, position) {
    return (isEmpty(m.frames) ? new(Memoer)(seshat.prune(m.memoer, position), m.frames) : m);
}));
(Memoer.lookup = (function(m, pos, id) {
    return seshat.lookup(m.memoer, pos, id);
}));
(Memoer.update = (function(m, pos, id, val) {
    return new(Memoer)(seshat.update(m.memoer, pos, id, val), m.frames);
}));
(Position = (function(i) {
    var self = this;
    (self.index = i);
}));
(Position.initial = new(Position)(0));
(Position.prototype.toString = (function() {
    var self = this;
    return ("" + self.index);
}));
(Position.prototype.increment = (function(_, _0) {
    var self = this;
    return new(Position)((self.index + 1));
}));
(Position.prototype.compare = (function(pos) {
    var self = this;
    return (self.index - pos.index);
}));
(ParserState = (function(input, position, userState) {
    var self = this;
    (self.input = input);
    (self.position = position);
    (self.userState = userState);
}));
(ParserState.prototype.eq = (function(other) {
    var self = this;
    return ((other && (self.input === other.input)) && (self.userState === other.userState));
}));
(ParserState.prototype.isEmpty = (function() {
    var self = this;
    return isEmpty(self.input);
}));
(ParserState.prototype.first = (function() {
    var self = this;
    return first(self.input);
}));
(ParserState.prototype.next = (function(tok) {
    var self = this;
    if ((!self._next)) {
        var r = rest(self.input),
            s = new(ParserState)(r, self.position.increment(tok, r), self.userState);
        (self._next = new(Parser)((function(_, m, cok) {
            return cok(tok, s, m);
        })));
    }
    return self._next;
}));
(ParserState.prototype.setInput = (function(input) {
    var self = this;
    return new(ParserState)(input, self.position, self.userState);
}));
(ParserState.prototype.setPosition = (function(position) {
    var self = this;
    return new(ParserState)(self.input, position, self.userState);
}));
(ParserState.prototype.setUserState = (function(userState) {
    var self = this;
    return new(ParserState)(self.input, self.position, userState);
}));
(ParserError = (function(msg) {
    var self = this;
    (self.message = msg);
}));
(ParserError.prototype = new(Error)());
(ParserError.prototype.constructor = ParserError);
(ParserError.prototype.name = "ParserError");
(ParseError = (function(position, msg) {
    var self = this;
    (self.position = position);
    (self._msg = (msg || ""));
}));
(ParseError.prototype = new(Error)());
(ParseError.prototype.constructor = ParseError);
(ParseError.prototype.name = "ParseError");
(ParseError.prototype.toString = (function() {
    var self = this;
    return self.message;
}));
Object.defineProperties(ParseError.prototype, ({
    message: ({
        configurable: true,
        get: (function() {
            var self = this;
            return ((("At " + self.position) + " ") + self.errorMessage);
        })
    }),
    errorMessage: ({
        configurable: true,
        get: (function() {
            var self = this;
            return self._msg;
        })
    })
}));
(MultipleError = (function(position, errors) {
    var self = this;
    (self.position = position);
    (self.errors = (errors || []));
}));
(MultipleError.prototype = new(ParseError)());
(MultipleError.prototype.constructor = MultipleError);
(MultipleError.prototype.name = "MultipleError");
Object.defineProperty(MultipleError.prototype, "errorMessage", ({
    get: (function() {
        var self = this;
        return (("[" + self.errors.map((function(x) {
                return x.message;
            }))
            .join(", ")) + "]");
    })
}));
var ChoiceError = (function(position, pErr, qErr) {
    var self = this;
    (self.position = position);
    (self._pErr = pErr);
    (self._qErr = qErr);
});
(ChoiceError.prototype = new(MultipleError)());
(ChoiceError.prototype.constructor = MultipleError);
(ChoiceError.prototype.name = "ChoiceError");
Object.defineProperty(ChoiceError.prototype, "errors", ({
    get: (function() {
        var self = this;
        return [self._pErr].concat(self._qErr.errors);
    })
}));
(UnknownError = (function(position) {
    var self = this;
    (self.position = position);
}));
(UnknownError.prototype = new(ParseError)());
(UnknownError.prototype.constructor = UnknownError);
(UnknownError.prototype.name = "UnknownError");
Object.defineProperty(UnknownError.prototype, "errorMessage", ({
    value: "unknown error"
}));
(UnexpectError = (function(position, unexpected) {
    var self = this;
    (self.position = position);
    (self.unexpected = unexpected);
}));
(UnexpectError.prototype = new(ParseError)());
(UnexpectError.prototype.constructor = UnexpectError);
(UnexpectError.prototype.name = "UnexpectError");
Object.defineProperty(UnexpectError.prototype, "errorMessage", ({
    get: (function() {
        var self = this;
        return ("unexpected: " + self.unexpected);
    })
}));
(ExpectError = (function(position, expected, found) {
    var self = this;
    (self.position = position);
    (self.expected = expected);
    (self.found = found);
}));
(ExpectError.prototype = new(ParseError)());
(ExpectError.prototype.constructor = ExpectError);
(ExpectError.prototype.name = "ExpectError");
Object.defineProperty(ExpectError.prototype, "errorMessage", ({
    get: (function() {
        var self = this;
        return (("expected: " + self.expected) + (self.found ? (" found: " + self.found) : ""));
    })
}));
(Parser = (function(n) {
    var self = this;
    (self.run = n);
}));
(unparser = (function(p, state, m, cok, cerr, eok, eerr) {
    return new(Tail)(p.run, state, m, cok, cerr, eok, eerr);
}));
(label = (function(name, p) {
    return (p.run.hasOwnProperty("displayName") ? label(name, new(Parser)((function(state, m, cok, cerr, eok,
        eerr) {
        return new(Tail)(p.run, state, m, cok, cerr, eok, eerr);
    }))) : new(Parser)(Object.defineProperty(p.run, "displayName", ({
        value: name,
        writable: false
    }))));
}));
(late = (function(def) {
    var value;
    return new(Parser)((function(state, m, cok, cerr, eok, eerr) {
        (value = (value || def()));
        var p = value;
        return new(Tail)(p.run, state, m, cok, cerr, eok, eerr);
    }));
}));
(rec = (function(def) {
    var value = def(late((function() {
        return value;
    })));
    return value;
}));
(Parser.prototype.of = (function(x) {
    return new(Parser)((function(state, m, _, _0, eok, _1) {
        return eok(x, state, m);
    }));
}));
(Parser.of = Parser.prototype.of);
(of = Parser.of);
(always = of);
(never = (function(x) {
    return new(Parser)((function(state, m, _, _0, _1, eerr) {
        return eerr(x, state, m);
    }));
}));
(Parser.chain = (function(p, f) {
    return new(Parser)((function(state, m, cok, cerr, eok, eerr) {
        var cok0 = (function(x, state0, m0) {
            var p0 = f(x);
            return new(Tail)(p0.run, state0, m0, cok, cerr, cok, cerr);
        }),
            eok0 = (function(x, state0, m0) {
                var p0 = f(x);
                return new(Tail)(p0.run, state0, m0, cok, cerr, eok, eerr);
            });
        return new(Tail)(p.run, state, m, cok0, cerr, eok0, eerr);
    }));
}));
(chain = Parser.chain);
(bind = chain);
(Parser.prototype.chain = (function(f) {
    var self = this;
    return chain(self, f);
}));
(Parser.prototype.map = (function(f) {
    var self = this;
    return chain(self, (function(z) {
        return of(f(z));
    }));
}));
(Parser.map = (function(f, p) {
    return p.map(f);
}));
(map = Parser.map);
(Parser.ap = (function(f, m) {
    return chain(f, (function(f0) {
        return m.map(f0);
    }));
}));
(ap = Parser.ap);
(Parser.prototype.ap = (function(m2) {
    var self = this;
    return ap(self, m2);
}));
(modifyParserState = (function(f) {
    return new(Parser)((function(state, m, _, _0, eok, _1) {
        var newState = f(state);
        return eok(newState, newState, m);
    }));
}));
var p = new(Parser)((function(state, m, _, _0, eok, _1) {
    return eok(state, state, m);
}));
(getParserState = (p.run.hasOwnProperty("displayName") ? label("Get Parser State", new(Parser)((function(state, m, cok,
    cerr, eok, eerr) {
    return new(Tail)(p.run, state, m, cok, cerr, eok, eerr);
}))) : new(Parser)(Object.defineProperty(p.run, "displayName", ({
    value: "Get Parser State",
    writable: false
})))));
(setParserState = (function(z) {
    return new(Parser)((function(state, m, _, _0, eok, _1) {
        return eok(z, z, m);
    }));
}));
(extract = (function(f) {
    return new(Parser)((function(state, m, _, _0, eok, _1) {
        return eok(f(state), state, m);
    }));
}));
(modifyState = (function(f) {
    return new(Parser)((function(state, m, _, _0, eok, _1) {
        var newState = state.setUserState(f(state.userState));
        return eok(newState, newState, m);
    }));
}));
var p0 = new(Parser)((function(state, m, _, _0, eok, _1) {
    return eok(state.userState, state, m);
}));
(getState = (p0.run.hasOwnProperty("displayName") ? label("Get State", new(Parser)((function(state, m, cok, cerr, eok,
    eerr) {
    return new(Tail)(p0.run, state, m, cok, cerr, eok, eerr);
}))) : new(Parser)(Object.defineProperty(p0.run, "displayName", ({
    value: "Get State",
    writable: false
})))));
(setState = (function(z) {
    return new(Parser)((function(state, m, _, _0, eok, _1) {
        var newState = state.setUserState(z);
        return eok(newState, newState, m);
    }));
}));
var p1 = new(Parser)((function(state, m, _, _0, eok, _1) {
    return eok(state.position, state, m);
}));
(getPosition = (p1.run.hasOwnProperty("displayName") ? label("Get Position", new(Parser)((function(state, m, cok, cerr,
    eok, eerr) {
    return new(Tail)(p1.run, state, m, cok, cerr, eok, eerr);
}))) : new(Parser)(Object.defineProperty(p1.run, "displayName", ({
    value: "Get Position",
    writable: false
})))));
(setPosition = (function(position) {
    return new(Parser)((function(state, m, _, _0, eok, _1) {
        var newState = state.setPosition(position);
        return eok(newState, newState, m);
    }));
}));
var p2 = new(Parser)((function(state, m, _, _0, eok, _1) {
    return eok(state.input, state, m);
}));
(getInput = (p2.run.hasOwnProperty("displayName") ? label("Get Input", new(Parser)((function(state, m, cok, cerr, eok,
    eerr) {
    return new(Tail)(p2.run, state, m, cok, cerr, eok, eerr);
}))) : new(Parser)(Object.defineProperty(p2.run, "displayName", ({
    value: "Get Input",
    writable: false
})))));
(setInput = (function(input) {
    return new(Parser)((function(state, m, _, _0, eok, _1) {
        var newState = state.setInput(input);
        return eok(newState, newState, m);
    }));
}));
(fail = (function(msg) {
    var e = (msg ? ParseError : UnknownError);
    return chain(getPosition, (function(z) {
        var x = new(e)(z, msg);
        return new(Parser)((function(state, m, _, _0, _1, eerr) {
            return eerr(x, state, m);
        }));
    }));
}));
(attempt = (function(p3) {
    return new(Parser)((function(state, m, cok, cerr, eok, eerr) {
        var peerr = (function(x, s, m0) {
            return eerr(x, s, Memoer.popWindow(m0));
        }),
            m0 = Memoer.pushWindow(m, state.position),
            cok0 = (function(x, s, m1) {
                return cok(x, s, Memoer.popWindow(m1));
            }),
            eok0 = (function(x, s, m1) {
                return eok(x, s, Memoer.popWindow(m1));
            });
        return new(Tail)(p3.run, state, m0, cok0, peerr, eok0, peerr);
    }));
}));
(look = (function(p3) {
    return chain(getParserState, (function(v1) {
        return chain(p3, (function(v2) {
            return next(setParserState(v1), of(v2));
        }));
    }));
}));
(lookahead = (function(p3) {
    return chain(getInput, (function(v1) {
        return chain(getPosition, (function(v2) {
            return chain(p3, (function(x) {
                return sequence(new(Parser)((function(state, m, _, _0, eok, _1) {
                    var newState = state.setPosition(v2);
                    return eok(newState, newState, m);
                })), setInput(v1), of(x));
            }));
        }));
    }));
}));
(next = (function(p3, q) {
    return chain(p3, (function() {
        return q;
    }));
}));
(sequences = reduceRight.bind(null, (function(x, y) {
    return chain(y, (function() {
        return x;
    }));
})));
var x = stream.from;
(sequencea = (function(z) {
    return sequences(x(z));
}));
(sequence = (function() {
    var args0 = arguments;
    return sequencea(args.apply(null, args0));
}));
var e = (undefined ? ParseError : UnknownError);
(Parser.prototype.empty = chain(getPosition, (function(z) {
    var x0 = new(e)(z, undefined);
    return new(Parser)((function(state, m, _, _0, _1, eerr) {
        return eerr(x0, state, m);
    }));
})));
(Parser.empty = Parser.prototype.empty);
(empty = Parser.empty);
(Parser.concat = (function(p3, q) {
    return new(Parser)((function(state, m, cok, cerr, eok, eerr) {
        var position = state["position"],
            peerr = (function(errFromP, _, mFromP) {
                var qeerr = (function(errFromQ, _0, mFromQ) {
                    return eerr(new(MultipleError)(position, [errFromP, errFromQ]), state,
                        mFromQ);
                });
                return new(Tail)(q.run, state, mFromP, cok, cerr, eok, qeerr);
            });
        return new(Tail)(p3.run, state, m, cok, cerr, eok, peerr);
    }));
}));
(concat = Parser.concat);
(either = concat);
(Parser.prototype.concat = (function(p3) {
    var self = this;
    return concat(self, p3);
}));
var x0;
(choices = foldr.bind(null, (function(x0, y) {
    return new(Parser)((function(state, m, cok, cerr, eok, eerr) {
        var position = state["position"],
            peerr = (function(errFromP, _, mFromP) {
                var qeerr = (function(errFromQ, _0, mFromQ) {
                    return eerr(new(ChoiceError)(position, errFromP, errFromQ), state,
                        mFromQ);
                });
                return new(Tail)(x0.run, state, mFromP, cok, cerr, eok, qeerr);
            });
        return new(Tail)(y.run, state, m, cok, cerr, eok, peerr);
    }));
}), ((x0 = new(MultipleError)(null, [])), new(Parser)((function(state, m, _, _0, _1, eerr) {
    return eerr(x0, state, m);
})))));
var x1 = stream.from;
(choicea = (function(z) {
    return choices(x1(z));
}));
(choice = (function() {
    var args0 = arguments;
    return choicea(args.apply(null, args0));
}));
(optional = (function(x2, p3) {
    return (p3 ? concat(p3, of(x2)) : concat(x2, of(null)));
}));
(expected = (function(expect, p3) {
    return new(Parser)((function(state, m, cok, cerr, eok, eerr) {
        var eerr0 = (function(x2, state0, m0) {
            return eerr(new(ExpectError)(state0.position, expect), state0, m0);
        });
        return new(Tail)(p3.run, state, m, cok, cerr, eok, eerr0);
    }));
}));
(not = (function(p3) {
    var p4 = concat(chain(new(Parser)((function(state, m, cok, cerr, eok, eerr) {
        var peerr = (function(x2, s, m0) {
            return eerr(x2, s, Memoer.popWindow(m0));
        }),
            m0 = Memoer.pushWindow(m, state.position),
            cok0 = (function(x2, s, m1) {
                return cok(x2, s, Memoer.popWindow(m1));
            }),
            eok0 = (function(x2, s, m1) {
                return eok(x2, s, Memoer.popWindow(m1));
            });
        return new(Tail)(p3.run, state, m0, cok0, peerr, eok0, peerr);
    })), (function(x2) {
        return chain(getPosition, (function(z) {
            var x3 = new(UnexpectError)(z, x2);
            return new(Parser)((function(state, m, _, _0, _1, eerr) {
                return eerr(x3, state, m);
            }));
        }));
    })), of(null));
    return new(Parser)((function(state, m, cok, cerr, eok, eerr) {
        var peerr = (function(x2, s, m0) {
            return eerr(x2, s, Memoer.popWindow(m0));
        }),
            m0 = Memoer.pushWindow(m, state.position),
            cok0 = (function(x2, s, m1) {
                return cok(x2, s, Memoer.popWindow(m1));
            }),
            eok0 = (function(x2, s, m1) {
                return eok(x2, s, Memoer.popWindow(m1));
            });
        return new(Tail)(p4.run, state, m0, cok0, peerr, eok0, peerr);
    }));
}));
(eager = map.bind(null, stream.toArray));
(binds = (function(p3, f) {
    return chain(eager(p3), (function(x2) {
        return f.apply(undefined, x2);
    }));
}));
var f = stream.cons;
(cons = (function(p10, p20) {
    return chain(p10, (function(x2) {
        return map((function(y) {
            return f(x2, y);
        }), p20);
    }));
}));
var f0 = stream.append;
(append = (function(p10, p20) {
    return chain(p10, (function(x2) {
        return map((function(y) {
            return f0(x2, y);
        }), p20);
    }));
}));
(enumerations = foldr.bind(null, (function(x2, y) {
    return cons(y, x2);
}), of(NIL)));
var x2 = stream.from;
(enumerationa = (function(z) {
    return enumerations(x2(z));
}));
(enumeration = (function() {
    var args0 = arguments;
    return enumerationa(args.apply(null, args0));
}));
var err = new(ParserError)("Many parser applied to parser that accepts an empty string"),
    manyError = (function() {
        throw err;
    });
(many = (function(p3) {
    var safeP = new(Parser)((function(state, m, cok, cerr, eok, eerr) {
        return new(Tail)(p3.run, state, m, cok, cerr, manyError, eerr);
    }));
    return rec((function(self) {
        var p4 = cons(safeP, self);
        return (p4 ? concat(p4, of(NIL)) : concat(NIL, of(null)));
    }));
}));
(many1 = (function(p3) {
    return cons(p3, many(p3));
}));
(manyTill = (function(p3, end) {
    return rec((function(self) {
        var p4, p5;
        return concat(((p4 = chain(getInput, (function(v1) {
                return chain(getPosition, (function(v2) {
                    return chain(end, (function(x3) {
                        return sequence(new(Parser)((function(state, m,
                            _, _0, eok, _1) {
                            var newState = state.setPosition(
                                v2);
                            return eok(newState, newState,
                                m);
                        })), setInput(v1), of(x3));
                    }));
                }));
            }))), new(Parser)((function(state, m, cok, cerr, eok, eerr) {
                var peerr = (function(x3, s, m0) {
                    return eerr(x3, s, Memoer.popWindow(m0));
                }),
                    m0 = Memoer.pushWindow(m, state.position),
                    cok0 = (function(x3, s, m1) {
                        return cok(x3, s, Memoer.popWindow(m1));
                    }),
                    eok0 = (function(x3, s, m1) {
                        return eok(x3, s, Memoer.popWindow(m1));
                    });
                return new(Tail)(p4.run, state, m0, cok0, peerr, eok0, peerr);
            })))
            .map((function(_) {
                return NIL;
            })), ((p5 = cons(p3, self)), (p5 ? concat(p5, of(NIL)) : concat(NIL, of(null)))));
    }));
}));
(memo = (function(p3) {
    return new(Parser)((function(state, m, cok, cerr, eok, eerr) {
        var position = state["position"],
            key = ({
                id: p3,
                state: state
            }),
            entry = Memoer.lookup(m, position, key);
        if (entry) {
            var type = entry[0],
                x3 = entry[1],
                s = entry[2];
            switch (type) {
                case "cok":
                    return cok(x3, s, m);
                case "ceerr":
                    return cerr(x3, s, m);
                case "eok":
                    return eok(x3, s, m);
                case "eerr":
                    return eerr(x3, s, m);
            }
        }
        var cok0 = (function(x4, pstate, pm) {
            return cok(x4, pstate, Memoer.update(pm, position, key, ["cok", x4, pstate]));
        }),
            cerr0 = (function(x4, pstate, pm) {
                return cerr(x4, pstate, Memoer.update(pm, position, key, ["cerr", x4, pstate]));
            }),
            eok0 = (function(x4, pstate, pm) {
                return eok(x4, pstate, Memoer.update(pm, position, key, ["eok", x4, pstate]));
            }),
            eerr0 = (function(x4, pstate, pm) {
                return eerr(x4, pstate, Memoer.update(pm, position, key, ["eerr", x4, pstate]));
            });
        return new(Tail)(p3.run, state, m, cok0, cerr0, eok0, eerr0);
    }));
}));
var defaultErr = (function(pos, tok) {
    return new(UnexpectError)(pos, ((tok === null) ? "end of input" : tok));
});
(token = (function(consume, onErr) {
    var errorHandler = (onErr || defaultErr);
    return new(Parser)((function(s, m, cok, cerr, eok, eerr) {
        var tok, pcok, p3;
        return (s.isEmpty() ? eerr(errorHandler(s.position, null), s, m) : ((tok = s.first()), (consume(
            tok) ? ((pcok = (function(x3, s0, m0) {
            return cok(x3, s0, Memoer.prune(m0, s0.position));
        })), (p3 = s.next(tok)), new(Tail)(p3.run, s, m, pcok, cerr, pcok, cerr)) : eerr(
            errorHandler(s.position, tok), s, m))));
    }));
}));
var p3 = token((function() {
    return true;
}));
(anyToken = (p3.run.hasOwnProperty("displayName") ? label("Any Token", new(Parser)((function(state, m, cok, cerr, eok,
    eerr) {
    return new(Tail)(p3.run, state, m, cok, cerr, eok, eerr);
}))) : new(Parser)(Object.defineProperty(p3.run, "displayName", ({
    value: "Any Token",
    writable: false
})))));
var p4 = concat(chain(new(Parser)((function(state, m, cok, cerr, eok, eerr) {
    var peerr = (function(x3, s, m0) {
        return eerr(x3, s, Memoer.popWindow(m0));
    }),
        m0 = Memoer.pushWindow(m, state.position),
        cok0 = (function(x3, s, m1) {
            return cok(x3, s, Memoer.popWindow(m1));
        }),
        eok0 = (function(x3, s, m1) {
            return eok(x3, s, Memoer.popWindow(m1));
        });
    return new(Tail)(anyToken.run, state, m0, cok0, peerr, eok0, peerr);
})), (function(x3) {
    return chain(getPosition, (function(z) {
        var x4 = new(UnexpectError)(z, x3);
        return new(Parser)((function(state, m, _, _0, _1, eerr) {
            return eerr(x4, state, m);
        }));
    }));
})), of(null)),
    p5 = new(Parser)((function(state, m, cok, cerr, eok, eerr) {
        var peerr = (function(x3, s, m0) {
            return eerr(x3, s, Memoer.popWindow(m0));
        }),
            m0 = Memoer.pushWindow(m, state.position),
            cok0 = (function(x3, s, m1) {
                return cok(x3, s, Memoer.popWindow(m1));
            }),
            eok0 = (function(x3, s, m1) {
                return eok(x3, s, Memoer.popWindow(m1));
            });
        return new(Tail)(p4.run, state, m0, cok0, peerr, eok0, peerr);
    }));
(eof = (p5.run.hasOwnProperty("displayName") ? label("EOF", new(Parser)((function(state, m, cok, cerr, eok, eerr) {
    return new(Tail)(p5.run, state, m, cok, cerr, eok, eerr);
}))) : new(Parser)(Object.defineProperty(p5.run, "displayName", ({
    value: "EOF",
    writable: false
})))));
(exec = (function() {
    var args0 = arguments;
    return trampoline(unparser.apply(null, args0));
}));
(parseState = (function(p6, state, ok, err0) {
    return exec(p6, state, Memoer.empty, ok, err0, ok, err0);
}));
(parseStream = (function(p6, s, ud, ok, err0) {
    var state = new(ParserState)(s, Position.initial, ud);
    return exec(p6, state, Memoer.empty, ok, err0, ok, err0);
}));
(parse = (function(p6, input, ud, ok, err0) {
    var s = stream.from(input),
        state = new(ParserState)(s, Position.initial, ud);
    return exec(p6, state, Memoer.empty, ok, err0, ok, err0);
}));
var err0 = (function(x3) {
    throw x3;
});
(runState = (function(p6, state) {
    return exec(p6, state, Memoer.empty, identity, err0, identity, err0);
}));
(runStream = (function(p6, s, ud) {
    return runState(p6, new(ParserState)(s, Position.initial, ud));
}));
(run = (function(p6, input, ud) {
    var s = stream.from(input);
    return runState(p6, new(ParserState)(s, Position.initial, ud));
}));
var ok = (function() {
    return true;
}),
    err1 = (function() {
        return false;
    });
(testState = (function(p6, state) {
    return exec(p6, state, Memoer.empty, ok, err1, ok, err1);
}));
(testStream = (function(p6, s, ud) {
    return testState(p6, new(ParserState)(s, Position.initial, ud));
}));
(test = (function(p6, input, ud) {
    var s = stream.from(input);
    return testState(p6, new(ParserState)(s, Position.initial, ud));
}));
(exports["Tail"] = Tail);
(exports["trampoline"] = trampoline);
(exports["ParserError"] = ParserError);
(exports["ParseError"] = ParseError);
(exports["MultipleError"] = MultipleError);
(exports["UnknownError"] = UnknownError);
(exports["UnexpectError"] = UnexpectError);
(exports["ExpectError"] = ExpectError);
(exports["ParserState"] = ParserState);
(exports["Position"] = Position);
(exports["Parser"] = Parser);
(exports["label"] = label);
(exports["late"] = late);
(exports["rec"] = rec);
(exports["unparser"] = unparser);
(exports["always"] = always);
(exports["of"] = of);
(exports["never"] = never);
(exports["bind"] = bind);
(exports["chain"] = chain);
(exports["map"] = map);
(exports["ap"] = ap);
(exports["extract"] = extract);
(exports["getParserState"] = getParserState);
(exports["setParserState"] = setParserState);
(exports["modifyParserState"] = modifyParserState);
(exports["getState"] = getState);
(exports["setState"] = setState);
(exports["modifyState"] = modifyState);
(exports["getInput"] = getInput);
(exports["setInput"] = setInput);
(exports["getPosition"] = getPosition);
(exports["setPosition"] = setPosition);
(exports["fail"] = fail);
(exports["attempt"] = attempt);
(exports["look"] = look);
(exports["lookahead"] = lookahead);
(exports["next"] = next);
(exports["sequences"] = sequences);
(exports["sequencea"] = sequencea);
(exports["sequence"] = sequence);
(exports["empty"] = empty);
(exports["either"] = either);
(exports["concat"] = concat);
(exports["choices"] = choices);
(exports["choicea"] = choicea);
(exports["choice"] = choice);
(exports["optional"] = optional);
(exports["expected"] = expected);
(exports["not"] = not);
(exports["eager"] = eager);
(exports["binds"] = binds);
(exports["cons"] = cons);
(exports["append"] = append);
(exports["enumerations"] = enumerations);
(exports["enumerationa"] = enumerationa);
(exports["enumeration"] = enumeration);
(exports["many"] = many);
(exports["many1"] = many1);
(exports["manyTill"] = manyTill);
(exports["memo"] = memo);
(exports["token"] = token);
(exports["anyToken"] = anyToken);
(exports["eof"] = eof);
(exports["exec"] = exec);
(exports["parseState"] = parseState);
(exports["parseStream"] = parseStream);
(exports["parse"] = parse);
(exports["runState"] = runState);
(exports["runStream"] = runStream);
(exports["run"] = run);
(exports["testState"] = testState);
(exports["testStream"] = testStream);
(exports["test"] = test);
},{"nu-stream":10,"seshet":11}],4:[function(require,module,exports){
/*
 * THIS FILE IS AUTO GENERATED FROM 'lib/text.kep'
 * DO NOT EDIT
*/
"use strict";
var __o = require("./parse"),
    character, oneOf, noneOf, string, trie, match, anyChar, letter, space, digit, always = __o["always"],
    attempt = __o["attempt"],
    bind = __o["bind"],
    optional = __o["optional"],
    ExpectError = __o["ExpectError"],
    next = __o["next"],
    label = __o["label"],
    token = __o["token"],
    join = Function.prototype.call.bind(Array.prototype.join),
    map = Function.prototype.call.bind(Array.prototype.map),
    reduce = Function.prototype.call.bind(Array.prototype.reduce),
    reduceRight = Function.prototype.call.bind(Array.prototype.reduceRight),
    StringError = (function(position, string, index, expected, found) {
        var self = this;
        ExpectError.call(self, position, expected, found);
        (self.string = string);
        (self.index = index);
    });
(StringError.prototype = new(ExpectError)());
(StringError.prototype.constructor = StringError);
Object.defineProperty(StringError.prototype, "errorMessage", ({
    "get": (function() {
        var self = this;
        return ((((((("In string: '" + self.string) + "' at index: ") + self.index) + ", Expected: ") +
            self.expected) + " Found: ") + (self.found ? self.found : "end of input"));
    })
}));
var unbox = (function(y) {
    return ("" + y);
}),
    _character = (function(c, err) {
        var x;
        return token(((x = ("" + c)), (function(r) {
            return (x === ("" + r));
        })), err);
    });
(character = (function(c) {
    return _character(c, (function(pos, tok) {
        return new(ExpectError)(pos, c, ((tok === null) ? "end of input" : tok));
    }));
}));
(oneOf = (function(chars) {
    var chars0 = map(chars, unbox),
        msg;
    return token((function(x) {
        return (chars0.indexOf(("" + x)) >= 0);
    }), ((msg = join(chars0, " or ")), (function(pos, tok) {
        return new(ExpectError)(pos, msg, ((tok === null) ? "end of input" : tok));
    })));
}));
(noneOf = (function(chars) {
    var chars0 = map(chars, unbox),
        msg;
    return token((function(z) {
        var x = (chars0.indexOf(("" + z)) >= 0);
        return (!x);
    }), ((msg = ("none of:" + join(chars0, " or "))), (function(pos, tok) {
        return new(ExpectError)(pos, msg, ((tok === null) ? "end of input" : tok));
    })));
}));
var reducer = (function(p, c, i, s) {
    return next(_character(c, (function(pos, tok) {
        return new(StringError)(pos, s, i, c, tok);
    })), p);
});
(string = (function(s) {
    return attempt(reduceRight(s, reducer, always(("" + s))));
}));
var wordReduce = (function(parent, l) {
    (parent[l] = (parent[l] || ({})));
    return parent[l];
}),
    wordsReduce = (function(trie, word) {
        var node = reduce(word, wordReduce, trie);
        (node[""] = word);
        return trie;
    }),
    _trie = (function(trie) {
        var chars, msg, keys = Object.keys(trie),
            paths = reduce(keys, (function(p, c) {
                if (c) {
                    (p[c] = _trie(trie[c]));
                }
                return p;
            }), ({})),
            select = attempt(bind(((chars = map(keys, unbox)), token((function(x) {
                return (chars.indexOf(("" + x)) >= 0);
            }), ((msg = join(chars, " or ")), (function(pos, tok) {
                return new(ExpectError)(pos, msg, ((tok === null) ? "end of input" : tok));
            })))), (function(y) {
                return paths[y];
            })));
        return (trie.hasOwnProperty("") ? optional(trie[""], select) : select);
    });
(trie = (function(z) {
    var z0 = reduce(z, wordsReduce, ({})),
        chars, msg, keys, paths, select;
    return attempt(((keys = Object.keys(z0)), (paths = reduce(keys, (function(p, c) {
        if (c) {
            (p[c] = _trie(z0[c]));
        }
        return p;
    }), ({}))), (select = attempt(bind(((chars = map(keys, unbox)), token((function(x) {
        return (chars.indexOf(("" + x)) >= 0);
    }), ((msg = join(chars, " or ")), (function(pos, tok) {
        return new(ExpectError)(pos, msg, ((tok === null) ? "end of input" :
            tok));
    })))), (function(y) {
        return paths[y];
    })))), (z0.hasOwnProperty("") ? optional(z0[""], select) : select)));
}));
(match = (function(pattern, expected) {
    return token(RegExp.prototype.test.bind(pattern), (function(pos, tok) {
        return new(ExpectError)(pos, expected, ((tok === null) ? "end of input" : tok));
    }));
}));
var pattern;
(anyChar = label("Any Character", ((pattern = /^.$/), token(RegExp.prototype.test.bind(pattern), (function(pos, tok) {
    return new(ExpectError)(pos, "any character", ((tok === null) ? "end of input" : tok));
})))));
var pattern0;
(letter = label("Any Letter", ((pattern0 = /^[a-z]$/i), token(RegExp.prototype.test.bind(pattern0), (function(pos, tok) {
    return new(ExpectError)(pos, "any letter character", ((tok === null) ? "end of input" : tok));
})))));
var pattern1;
(space = label("Any Whitespace", ((pattern1 = /^\s$/i), token(RegExp.prototype.test.bind(pattern1), (function(pos, tok) {
    return new(ExpectError)(pos, "any space character", ((tok === null) ? "end of input" : tok));
})))));
var pattern2;
(digit = label("Any Digit", ((pattern2 = /^[0-9]$/i), token(RegExp.prototype.test.bind(pattern2), (function(pos, tok) {
    return new(ExpectError)(pos, "any digit character", ((tok === null) ? "end of input" : tok));
})))));
(exports["character"] = character);
(exports["oneOf"] = oneOf);
(exports["noneOf"] = noneOf);
(exports["string"] = string);
(exports["trie"] = trie);
(exports["match"] = match);
(exports["anyChar"] = anyChar);
(exports["letter"] = letter);
(exports["space"] = space);
(exports["digit"] = digit);
},{"./parse":3}],5:[function(require,module,exports){
module.exports = {
    'parse': require('./dist_node/parse'),
    'incremental': require('./dist_node/incremental'),
    'lang': require('./dist_node/lang'),
    'text': require('./dist_node/text')
};
},{"./dist_node/incremental":1,"./dist_node/lang":2,"./dist_node/parse":3,"./dist_node/text":4}],6:[function(require,module,exports){
/*
 * THIS FILE IS AUTO GENERATED FROM 'lib/gen.kep'
 * DO NOT EDIT
*/
"use strict";
var __o = require("./stream"),
    repeat, range, NIL = __o["NIL"],
    memoStream = __o["memoStream"];
(repeat = (function(times, x) {
    return ((times <= 0) ? NIL : memoStream(x, (function() {
        return repeat((times - 1), x);
    })));
}));
var rangeImpl = (function(lower, upper, step) {
    return (((step > 0) ? (upper <= lower) : (upper >= lower)) ? NIL : memoStream(lower, (function() {
        return rangeImpl((lower + step), upper, step);
    })));
});
(range = (function(lower, upper, step) {
    var rangeLower = (isNaN(lower) ? Infinity : (+lower)),
        rangeStep = (isNaN(step) ? 1 : (+step));
    return (isNaN(upper) ? (((rangeStep > 0) ? (rangeLower <= 0) : (rangeLower >= 0)) ? NIL : memoStream(0, (
        function() {
            return rangeImpl((0 + rangeStep), rangeLower, rangeStep);
        }))) : (((rangeStep > 0) ? (upper <= rangeLower) : (upper >= rangeLower)) ? NIL : memoStream(
        rangeLower, (function() {
            return rangeImpl((rangeLower + rangeStep), upper, rangeStep);
        }))));
}));
(exports["repeat"] = repeat);
(exports["range"] = range);
},{"./stream":9}],7:[function(require,module,exports){
/*
 * THIS FILE IS AUTO GENERATED FROM 'lib/quantifier.kep'
 * DO NOT EDIT
*/
"use strict";
var __o = require("./stream"),
    any, every, isEmpty = __o["isEmpty"],
    first = __o["first"],
    rest = __o["rest"],
    not = (function(y) {
        return (function(z) {
            var x = y(z);
            return (!x);
        });
    });
(any = (function(pred, s) {
    for (var current = s;
        (!isEmpty(current));
        (current = rest(current)))
        if (pred(first(current))) return true;
    return false;
}));
(every = (function(pred, s) {
    return (!any(not(pred), s));
}));
(exports["any"] = any);
(exports["every"] = every);
},{"./stream":9}],8:[function(require,module,exports){
/*
 * THIS FILE IS AUTO GENERATED FROM 'lib/select.kep'
 * DO NOT EDIT
*/
"use strict";
var __o = require("./stream"),
    takeWhile, take, skipWhile, skip, NIL = __o["NIL"],
    first = __o["first"],
    isEmpty = __o["isEmpty"],
    map = __o["map"],
    stream = __o["stream"],
    rest = __o["rest"],
    indexed = __o["indexed"],
    value = (function(__o0) {
        var x = __o0[1];
        return x;
    });
(takeWhile = (function(pred, s) {
    var x;
    return (isEmpty(s) ? s : ((x = first(s)), (pred(x) ? stream(x, (function() {
        return takeWhile(pred, rest(s));
    })) : NIL)));
}));
(take = (function(count, s) {
    return ((isNaN(count) || (count < 0)) ? s : map(value, takeWhile((function(z) {
        var i = z[0];
        return (count > i);
    }), indexed(s))));
}));
(skipWhile = (function(pred, s) {
    for (var head = s;
        (!isEmpty(head));
        (head = rest(head)))
        if ((!pred(first(head)))) return head;
    return NIL;
}));
(skip = (function(count, s) {
    return ((isNaN(count) || (count <= 0)) ? s : map(value, skipWhile((function(z) {
        var i = z[0];
        return (count > i);
    }), indexed(s))));
}));
(exports["takeWhile"] = takeWhile);
(exports["take"] = take);
(exports["skipWhile"] = skipWhile);
(exports["skip"] = skip);
},{"./stream":9}],9:[function(require,module,exports){
/*
 * THIS FILE IS AUTO GENERATED FROM 'lib/stream.kep'
 * DO NOT EDIT
*/
"use strict";
var end, NIL, stream, memoStream, rec, cons, append, appendz, concat, bind, from, first, rest, isEmpty, isStream,
        reverse, foldl, foldr, reduce, reduceRight, zip, zipWith, indexed, map, filter, forEach, toArray, arrayReduce =
        Function.prototype.call.bind(Array.prototype.reduce),
    memo = (function(f) {
        var value;
        return (function() {
            if ((value === undefined)) {
                (value = f());
            }
            return value;
        });
    });
(end = null);
(NIL = null);
(stream = (function(val, f) {
    return ({
        first: val,
        rest: f
    });
}));
(memoStream = (function(val, f) {
    var f0 = memo(f);
    return ({
        first: val,
        rest: f0
    });
}));
(rec = (function(def) {
    var value = def((function() {
        return value;
    }));
    return value;
}));
(first = (function(x) {
    return x.first;
}));
(rest = (function(s) {
    return s.rest();
}));
(isEmpty = (function(y) {
    return (null === y);
}));
(isStream = (function(s) {
    return (((s && s.hasOwnProperty("first")) && s.hasOwnProperty("rest")) || (null === s));
}));
(cons = (function(val, s) {
    var f = (function() {
        return s;
    });
    return ({
        first: val,
        rest: f
    });
}));
(appendz = (function(s1, f) {
    var val, f0, f1;
    return ((null === s1) ? f() : ((val = s1.first), (f0 = (function() {
        return appendz(s1.rest(), f);
    })), (f1 = memo(f0)), ({
        first: val,
        rest: f1
    })));
}));
var reducer = (function(s1, s2) {
    return appendz(s1, (function() {
        return s2;
    }));
});
(append = (function() {
    var streams = arguments;
    return arrayReduce(streams, reducer, null);
}));
(concat = (function(s) {
    return ((null === s) ? s : appendz(s.first, (function() {
        return concat(s.rest());
    })));
}));
var fromImpl = (function(arr, i, len) {
    var val, f, f0;
    return ((i >= len) ? null : ((val = arr[i]), (f = (function() {
        return fromImpl(arr, (i + 1), len);
    })), (f0 = memo(f)), ({
        first: val,
        rest: f0
    })));
});
(from = (function(arr) {
    var length = arr["length"],
        val, f, f0;
    return ((0 >= length) ? null : ((val = arr[0]), (f = (function() {
        return fromImpl(arr, 1, length);
    })), (f0 = memo(f)), ({
        first: val,
        rest: f0
    })));
}));
(zipWith = (function(f, l1, l2) {
    var val, f0, f1;
    return (((null === l1) || (null === l2)) ? null : ((val = f(l1.first, l2.first)), (f0 = zipWith.bind(null,
        f, l1.rest(), l2.rest())), (f1 = memo(f0)), ({
        first: val,
        rest: f1
    })));
}));
var f = (function(x, y) {
    return [x, y];
});
(zip = (function(l1, l2) {
    var x, y, val, f0, f1;
    return (((null === l1) || (null === l2)) ? null : ((x = l1.first), (y = l2.first), (val = [x, y]), (f0 =
        zipWith.bind(null, f, l1.rest(), l2.rest())), (f1 = memo(f0)), ({
        first: val,
        rest: f1
    })));
}));
var count = (function(n) {
    var f0 = (function() {
        return count((n + 1));
    });
    return ({
        first: n,
        rest: f0
    });
}),
    f0;
(indexed = zip.bind(null, ((f0 = (function() {
    return count(1);
})), ({
    first: 0,
    rest: f0
}))));
(foldl = (function(f1, z, s) {
    var y, s0, r = z;
    for (var head = s;
        (!((y = head), (null === y)));
        (head = ((s0 = head), s0.rest()))) {
        var x;
        (r = f1(r, ((x = head), x.first)));
    }
    return r;
}));
(reverse = foldl.bind(null, (function(x, y) {
    var f1 = (function() {
        return x;
    });
    return ({
        first: y,
        rest: f1
    });
}), null));
(foldr = (function(f1, z, s) {
    return foldl(f1, z, reverse(s));
}));
(reduce = (function(f1, s) {
    return foldl(f1, s.first, s.rest());
}));
(reduceRight = (function(f1, s) {
    return reduce(f1, reverse(s));
}));
(map = (function(f1, s) {
    var val, f2, f3;
    return ((null === s) ? s : ((val = f1(s.first)), (f2 = (function() {
        return map(f1, s.rest());
    })), (f3 = memo(f2)), ({
        first: val,
        rest: f3
    })));
}));
(filter = (function(pred, s) {
    var y, s0;
    for (var head = s;
        (!((y = head), (null === y)));
        (head = ((s0 = head), s0.rest()))) {
        var x = head,
            x0 = x.first;
        if (pred(x0)) {
            var f1 = (function() {
                var s1;
                return filter(pred, ((s1 = head), s1.rest()));
            }),
                f2 = memo(f1);
            return ({
                first: x0,
                rest: f2
            });
        }
    }
    return null;
}));
var y = concat;
(bind = (function() {
    var args = arguments;
    return y(map.apply(null, args));
}));
(forEach = (function(f1, s) {
    var y0, s0, x;
    for (var head = s;
        (!((y0 = head), (null === y0)));
        (head = ((s0 = head), s0.rest()))) f1(((x = head), x.first));
}));
var builder = (function(p, c) {
    p.push(c);
    return p;
});
(toArray = (function(s) {
    return foldl(builder, [], s);
}));
(exports["end"] = end);
(exports["NIL"] = NIL);
(exports["stream"] = stream);
(exports["memoStream"] = memoStream);
(exports["rec"] = rec);
(exports["cons"] = cons);
(exports["append"] = append);
(exports["appendz"] = appendz);
(exports["concat"] = concat);
(exports["bind"] = bind);
(exports["from"] = from);
(exports["first"] = first);
(exports["rest"] = rest);
(exports["isEmpty"] = isEmpty);
(exports["isStream"] = isStream);
(exports["reverse"] = reverse);
(exports["foldl"] = foldl);
(exports["foldr"] = foldr);
(exports["reduce"] = reduce);
(exports["reduceRight"] = reduceRight);
(exports["zip"] = zip);
(exports["zipWith"] = zipWith);
(exports["indexed"] = indexed);
(exports["map"] = map);
(exports["filter"] = filter);
(exports["forEach"] = forEach);
(exports["toArray"] = toArray);
},{}],10:[function(require,module,exports){
module.exports = {
    'stream': require('./dist_node/stream'),
    'gen': require('./dist_node/gen'),
    'quantifier': require('./dist_node/quantifier'),
    'select': require('./dist_node/select')
};
},{"./dist_node/gen":6,"./dist_node/quantifier":7,"./dist_node/select":8,"./dist_node/stream":9}],11:[function(require,module,exports){
/*
 * THIS FILE IS AUTO GENERATED from 'lib/seshet.kep'
 * DO NOT EDIT
*/
"use strict";
var create, lookup, update, prune;
var max = (function(x, y) {
    return ((x > y) ? x : y);
});
var heightFromChild = (function(child) {
    return (child ? (1 + child.height) : 0);
});
var height = (function(root) {
    return (!root ? 0 : max(heightFromChild(root.left), heightFromChild(root.right)));
});
var bf = (function(node) {
    return (!node ? 0 : (heightFromChild(node.left) - heightFromChild(node.right)));
});
var Cell = (function(id, val, delegate) {
    (this.id = id);
    (this.val = val);
    (this.delegate = delegate);
});
(Cell.lookup = (function(base, eq, id) {
    for (var cell = base; cell;
        (cell = cell.delegate))
        if (eq(cell.id, id)) return cell.val;
    return null;
}));
var Node = (function(key, cell, l, r, height) {
    (this.key = key);
    (this.cell = cell);
    (this.left = l);
    (this.right = r);
    (this.height = height);
});
(Node.setChildren = (function(node, l, r) {
    return new(Node)(node.key, node.cell, l, r, ((l || r) ? (1 + max(height(l), height(r))) : 0));
}));
(Node.setLeft = (function(node, l) {
    return Node.setChildren(node, l, node.right);
}));
(Node.setRight = (function(node, r) {
    return Node.setChildren(node, node.left, r);
}));
(Node.lookup = (function(root, compare, eq, key, id) {
    for (var node = root; node;) {
        var diff = compare(key, node.key);
        if ((diff === 0)) return Cell.lookup(node.cell, eq, id);
        (node = ((diff < 0) ? node.left : node.right));
    }
    return null;
}));
(Node.put = (function(node, id, val) {
    return new(Node)(node.key, new(Cell)(id, val, node.cell), node.left, node.right, node.height);
}));
var rr = (function(node) {
    return (!node ? node : Node.setLeft(node.right, Node.setRight(node, node.right.left)));
});
var ll = (function(node) {
    return (!node ? node : Node.setRight(node.left, Node.setLeft(node, node.left.right)));
});
var lr = (function(node) {
    return ll(Node.setLeft(node, rr(node.left)));
});
var rl = (function(node) {
    return rr(Node.setRight(node, ll(node.right)));
});
var rot = (function(node) {
    var d = bf(node);
    if ((d > 1)) return ((bf(node.left) <= -1) ? lr(node) : ll(node));
    else if ((d < -1)) return ((bf(node.right) >= 1) ? rl(node) : rr(node));
    return node;
});
(Node.update = (function(root, compare, key, id, val) {
    if (!root) return new(Node)(key, new(Cell)(id, val, null), null, null, 0);
    var diff = compare(key, root.key);
    if ((diff === 0)) return Node.put(root, id, val);
    return rot(((diff < 0) ? Node.setLeft(root, Node.update(root.left, compare, key, id, val)) : Node.setRight(
        root, Node.update(root.right, compare, key, id, val))));
}));
(Node.rebalance = (function(root) {
    return ((Math.abs(bf(root)) <= 1) ? root : rot(Node.setChildren(root, Node.rebalance(root.left), Node.rebalance(
        root.right))));
}));
(Node.prune = (function(root, compare, lower, upper) {
    if (!root) return root;
    if ((lower !== undefined)) {
        var dl = compare(root.key, lower);
        if ((dl < 0)) return Node.prune(root.right, compare, lower, upper);
        else if ((dl === 0)) return Node.setChildren(root, null, Node.prune(root.right, compare, undefined,
            upper));
    }
    if (((upper !== undefined) && (compare(root.key, upper) >= 0))) return Node.prune(root.left, compare, lower,
        upper);
    return Node.setChildren(root, Node.prune(root.left, compare, lower, upper), Node.prune(root.right, compare,
        lower, upper));
}));
var Memoer = (function(compare, eq, root) {
    (this.compare = compare);
    (this.eq = eq);
    (this.root = root);
});
(Memoer.setRoot = (function(m, root) {
    return new(Memoer)(m.compare, m.eq, root);
}));
(create = (function() {
        var equals = (function(x, y) {
            return (x === y);
        });
        return (function(compare, eq) {
            return new(Memoer)(compare, (eq || equals), null);
        });
    })
    .call(this));
(lookup = (function(m, key, id) {
    return Node.lookup(m.root, m.compare, m.eq, key, id);
}));
(update = (function(m, key, id, val) {
    return Memoer.setRoot(m, Node.update(m.root, m.compare, key, id, val));
}));
(prune = (function(m, lower, upper) {
    return Memoer.setRoot(m, Node.rebalance(Node.prune(m.root, m.compare, lower, upper)));
}));
(exports.create = create);
(exports.lookup = lookup);
(exports.update = update);
(exports.prune = prune);
},{}],12:[function(require,module,exports){
module.exports = {
  // Types
  TypName: function(typ) {
    this.typ = typ;
    this.asString = () => typ;

    this.apply = function(f){ return f(this); }
  },

  TypBase: function(typ) {
    this.typ = typ;
    this.asString = () => typ;

    this.apply = function(f){ return f(this); }
  },

  TypPtr: function(typ) {
    this.typ = typ;
    this.asString = () => typ.asString() + '*';

    this.apply = function(f){ return f(new module.exports.TypPtr(this.typ.apply(f))); }
  },

  TypArr: function(typ, size) {
    this.typ = typ;
    this.size = size;
    this.asString = () => typ.asString() + (size == undefined) ? '[]' : '[' + size + ']';

    this.apply = function(f){ return f(new module.exports.TypArr(this.typ.apply(f), size)); }
  },

  TypObj: function(name, fields) {
    this.name = name;
    this.fields = fields;
    this.asString = () => {
      if(name != undefined) {
        return name;
      }
      let ret = '{ ';
      for(field in fields) {
        ret += fields[field].asString + ' ' + field + '; ';
      }
      return ret + ' }';
    };

    this.apply = function(f){
      fields = {};
      for(field in this.fields) {
        fields[field] = this.fields[field].apply(f);
      }
      return f(new module.exports.TypObj(this.name, fields));
    };
  },

  // AST nodes

  Lit: function(typ, val) {
    this.typ = typ;
    this.val = val;

    this.apply = function(f){ return f(this); }
  },

  Var: function(name) {
    this.name = name;

    this.apply = function(f){ return f(this); }
  },

  Decl: function(typ, name, val) {
    this.typ = typ;
    this.name = name;
    this.val = val;

    this.apply = function(f){ return f(new module.exports.Decl(this.typ.apply(f), this.name, this.val ? this.val.apply(f) : this.val)); }
  },

  Uop: function(op, e1) {
    this.op = op;
    this.e1 = e1;

    this.apply = function(f){ return f(new module.exports.Uop(this.op, this.e1.apply(f))); }
  },

  Bop: function(op, e1, e2) {
    this.op = op;
    this.e1 = e1;
    this.e2 = e2;

    this.apply = function(f){ return f(new module.exports.Bop(this.op, this.e1.apply(f), this.e2.apply(f))); }
  },

  Ternary: function(cond, e1, e2) {
    this.cond = cond;
    this.e1 = e1;
    this.e2 = e2;

    this.apply = function(f){ return f(new module.exports.Ternary(this.cond.apply(f), this.e1.apply(f), this.e2.apply(f))); }
  },

  Nop: function() {
    this.apply = function(f){ return f(this); }
  },

  MemberAccess: function(e1, field) {
    this.e1 = e1;
    this.field = field;

    this.apply = function(f){ return f(new module.exports.MemberAccess(this.e1.apply(f), this.field)); }
  },

  IndexAccess: function(e1, index) {
    this.e1 = e1;
    this.index = index;

    this.apply = function(f){ return f(new module.exports.IndexAccess(this.e1.apply(f), this.index)); }
  },

  Deref: function(e1) {
    this.e1 = e1;

    this.apply = function(f){ return f(new module.exports.Deref(this.e1.apply(f))); }
  },

  Fn: function(ret, name, params, body, frame) {
    this.ret = ret;
    this.name = name;
    this.params = params;
    this.body = body;
    this.frame = frame;

    this.apply = function(f){ return f(new module.exports.Fn(this.ret, this.name, this.params.map((x) => x.apply(f)), this.body.apply(f), this.frame)); }
  },

  ObjTmpl: function(name, publ, priv) {
    this.name = name;
    this.publ = publ;
    this.priv = priv;

    this.apply = function(f){ return f(this); }
  },

  Call: function(fn, args) {
    this.fn = fn;
    this.args = args;

    this.apply = function(f){ return f(new module.exports.Call(f(fn), this.args.map((x) => x.apply(f)))); }
  },

  Return: function(e1) {
    this.e1 = e1;

    this.apply = function(f){ return f(new module.exports.Return(this.e1.apply(f))); }
  },

  Loop: function(cond, body) {
    this.cond = cond;
    this.body = body;

    this.apply = function(f){ return f(new module.exports.Loop(this.cond.apply(f), this.body.apply(f))); }
  },

  If: function(cond, body) {
    this.cond = cond;
    this.body = body;

    this.apply = function(f){ return f(new module.exports.If(this.cond.apply(f), this.body.apply(f))); }
  },

  Scope: function(stmts) {
    this.stmts = stmts;

    this.apply = function(f){ return f(new module.exports.Scope(this.stmts.map((x) => x.apply(f)))); }
  },

  CFile: function(decls) {
    this.decls = decls;


    this.apply = function(f){
      return f(new module.exports.CFile(this.decls.map((x) => x.apply(f))))
    };
  },

  // Compiler created

  Steppoint: function(position, body) {
    this.position = position;
    this.body = body;

    this.apply = function(f){ return f(new module.exports.Steppoint(this.position, this.body.apply(f))); }
  },

  Builtin: function(f) {
    this.f = f;

    this.apply = function(f){ return f(this); }
  },
}

},{}],13:[function(require,module,exports){
var ast = require('./ast');
var parser = require('./parser');
var pp = require('./preprocesser');

function cmpl(node) {
  if(node instanceof ast.Decl) {
    if(node.val) {
      return new ast.Bop('=', new ast.Var(node.name), node.val.apply(cmpl));
    }
    return new ast.Nop();
  }
  else if(node instanceof ast.Uop) {
    switch(node.op) {
      case 'new':
        return new ast.Call(new ast.Var('!malloc'), [node.e1]);
      case '*':
        return new ast.Deref(node.e1.apply(cmpl));
      // TODO(alex): Avoid side effect duplication.
      case '++':
        return new ast.Bop('=', node.e1.apply(cmpl),
          new ast.Bop('+', node.e1.apply(cmpl), new ast.Lit(new ast.TypBase('int'), 1)));
      case '--':
        return new ast.Bop('=', node.e1.apply(cmpl),
          new ast.Bop('-', node.e1.apply(cmpl), new ast.Lit(new ast.TypBase('int'), 1)));
      default:
        return new ast.Uop(node.op, node.e1.apply(cmpl));
    }
  }
  else if(node instanceof ast.Bop) {
    switch(node.op) {
      case '<<':
        if(node.e1.name == 'cout') {
          return new ast.Call(new ast.Var('!print'), [node.e2.apply(cmpl)]);
        }
      default:
        return new ast.Bop(node.op, node.e1.apply(cmpl), node.e2.apply(cmpl));
    }
  }
  else {
    return node;
  }
}

module.exports = {
  compileFile: (code) => {
    var parsed = parser.parseFile(code);
    // console.log('parsed: ');
    // console.log(parsed.decls[1].body.stmts[0]);
    var ppd = pp.preprocess(parsed);
    // console.log('ppd: ');
    // console.log(ppd.decls[1].body.stmts[0]);
    // console.log('ppd.apply(cmpl): ');
    // console.log(ppd.apply(cmpl).decls[1].body.stmts[0]);
    return ppd.apply(cmpl);
  },
  compileStmt: (code) => pp.preprocess(parser.parseStmt(code)).apply(cmpl),
  compileExpr: (code) => pp.preprocess(parser.parseExpr(code)).apply(cmpl),
};

},{"./ast":12,"./parser":14,"./preprocesser":15}],14:[function(require,module,exports){
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

var typ = bind_list(
  ident,
  parse.eager(parse.many(ws(text.character('*')))),
  (typ, ptrs) => ptrs.reduce((acc, _) => {
    return new ast.TypPtr(acc)
  }, new ast.TypName(typ)));

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
        parse.bind(lang.between(
          ws(text.character('(')),
          ws(text.character(')')),
          // Group17 used here because commas are a valid operator in group18.
          parse.eager(lang.sepBy(ws(text.character(',')), group17))),
          (args) => parse.always((e) =>
            new ast.Call(e, args)))
      ))),
      (e, opfns) => {
        return nu.foldl(
        (acc, opfn) => opfn(acc),
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

var var_decl = bind_list(
  typ,
  ws(var_name),
  parse.many(lang.between(
    ws(text.character('[')),
    ws(text.character(']')),
    expr)),
  (typ, name, arrs) => new ast.Decl(
    nu.foldl(
      (acc, h) => new ast.TypArr(acc, h),
      typ,
      arrs), name));

var var_def = bind_list(
  var_decl,
  parse.optional(undefined, parse.next(
    ws(text.character('=')),
    expr)),
  (decl, assign) => {
    if(assign) {
      decl.val = assign;
    }
    return decl;
  });

var while_loop = parse.late(() =>
  bind_list(
    text.string('while'),
    ws(lang.between(
      text.character('('),
      text.character(')'),
      ws(step_point(expr)))),
    ws(stmt),
    (_, cond, body) => {
      return new ast.Loop(cond, body)
    }));

var for_loop = parse.late(() =>
  bind_list(
    text.string('for'),
    parse.next(
      ws(text.character('(')),
      step_point(parse.either(parse.attempt(var_def), expr))),
    lang.between(
      ws(semi),
      ws(semi),
      step_point(expr)),
    lang.then(
      step_point(expr),
      ws(text.character(')'))),
    ws(stmt),
    (_, init, cond, inc, body) => {
      return new ast.Scope([
        init,
        new ast.Loop(cond, new ast.Scope([
          body,
          inc,
        ])),
      ]);
    }));

var scope = parse.late(() => lang.between(
    text.character('{'),
    text.character('}'),
    parse.bind(ws(stmts), s => parse.always(new ast.Scope(s)))))

var stmt = ws(parse.choice(
  while_loop,
  for_loop,
  scope,
  step_point(parse.bind(lang.between(
    text.string('return'),
    semi,
    ws(expr)),
    (e) => parse.always(new ast.Return(e)))),
  step_point(parse.attempt(lang.then(var_def, semi))),
  step_point(lang.then(expr, semi)),
  step_point(parse.next(semi, parse.always(new ast.Nop())))));

var stmts = parse.eager(parse.many(ws(stmt)));

var params = lang.between(
  text.character('('),
  text.character(')'),
  parse.eager(
    ws(lang.sepBy(ws(text.character(',')), var_decl))));

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
      lang.then(var_decl, ws(semi))
    )))))),
  (type, name, body) => {
    var publ = type == 'struct';
    var publ = [];
    var priv = [];
    for(var e of body) {
      if(e == 'public') publ = true;
      else if(e == 'private') publ = false;
      else if (publ) publ.push(e);
      else priv.push(e);
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

// parseFile(');
// console.log(parse.run(ident, 's'))
// console.log(parse.run(ident, 'asdf'))
// console.log(parse.run(ident, '_A1'))
// console.log(parse.run(ident, '_A64Hsfb'))
// parse.run(
//   bind_list(text.character('a'), (a) => (parse.always(a))
//   ),
//   'asdf')
// parse.run(
//   parse.choice(
//     parse.attempt(lang.then(text.character('a'), text.character('c'))),
//     parse.attempt(lang.then(text.character('a'), text.character('b')))
//   ),
//   'abc')
// console.log(parseFile('struct node { int key; }; int main () { node asdf; }'))

module.exports = {
  parseFile: parseFile,
  parseFn: parseFn,
  parseExpr: parseExpr,
  parseStmt: parseStmt,
}

},{"./ast":12,"bennu":5,"nu-stream":10}],15:[function(require,module,exports){
var ast = require('./ast');

function preprocess(node) {
  var types = {
    'char': new ast.TypBase('char'),
    'bool': new ast.TypBase('bool'),
    'int': new ast.TypBase('int'),
    'float': new ast.TypBase('float'),
  };

  function lookupTyp(t) {
    while(t instanceof ast.TypName) t = types[t.typ];
    return t;
  }

  function pp(node) {
    if(node instanceof ast.Fn) {
      var frame = {};
      node.body.apply((node) => {
        if(node instanceof ast.Decl) {
          frame[node.name] = lookupTyp(node.typ);
        }
        return node;
      });
      return new ast.Fn(node.ret, node.name, node.params, node.body, frame);
    }
    else if(node instanceof ast.ObjTmpl) {
      fields = {};
      for(decl of node.publ.concat(node.priv)) {
        fields[decl.name] = lookupTyp(decl.typ);
      }
      types[node.name] = new ast.TypObj(node.name, fields);
    }
    else if(node instanceof ast.TypName) {
      return types[node.typ];
    }
    else if(node instanceof ast.Uop) {
      // TODO(alex): Move conversion to TypName to parsing step
      if(node.op == 'new') {
        return new ast.Uop('new', lookupTyp(new ast.TypName(node.e1.name)));
      }
    }
    return node;
  }

  return node.apply(pp);
}

module.exports = {
  preprocess: preprocess,
};

},{"./ast":12}],"runtime":[function(require,module,exports){
"use strict";

var ast = require('./ast');
var compiler = require('./compiler');

function Program(options) {
  this.code = options.code;
  this.onPrint = options.onPrint || ((text) => {});
  this.onFnCall = options.onFnCall || ((name, vars) => {});
  this.onFnEnd = options.onFnEnd || ((name, ret) => {});
  this.onDynamicAllocation = options.onDynamicAllocation || ((type, loc) => {});
  this.onAssign = options.onAssign || ((name, val) => {});
  this.errorFormat = options.errorFormat || 'cjs';

  let i = 10000;
  this.generateHeapAddress = function(size) {
    for (;;) {
      // console.log("I: ", i)
      i += size;
      return i-size;
    }
  }

  this.memory = {
    '!print': new ast.Builtin((p) => {
      // console.log("Printing: ", p);
      this.onPrint(String(this.getVal(p)));
      return new ast.Var('!print');
    }),
    '!malloc': new ast.Builtin((typ) => {
      var loc = this.generateHeapAddress(4);
      this.memory[loc] = this.initMemory(typ);
      this.onDynamicAllocation(typ, loc);
      // console.log("Here:", loc)
      return new ast.Lit('ptr', loc);
    }),
  };

  this.initMemory = function(typ) {
    if(typ instanceof ast.TypBase) {
      switch(typ.typ) {
        case 'string':
          return '';
        default:
          return 0;
      }
    }
    if(typ instanceof ast.TypPtr) {
      return undefined;
    }
    else if(typ instanceof ast.TypArr) {
      var newArr = Array(typ.size.val);
      for(var i = 0; i < newArr.length; i++) {
        newArr[i] = this.initMemory(typ.typ);
      }
      return newArr;
    }
    else if(typ instanceof ast.TypObj) {
      return Object.keys(typ.fields).reduce(
        (acc, h) => {
          acc[h] = this.initMemory(typ.fields[h]);
          return acc;
        }, {});
    }
    else {
      throw Error('Unsupported type: ' + typ.constructor.name)
    }
  };

  this.getMemory = function(loc) {
    if(loc instanceof ast.Var) {
      return this.memory[loc.name];
    }
    else if (loc instanceof ast.Deref){
      return this.memory[loc.e1.val];
    }
    else if (loc instanceof ast.IndexAccess){
      return this.getMemory(loc.e1)[this.getVal(loc.index)];
    }
    else if (loc instanceof ast.MemberAccess){
      return this.getMemory(loc.e1)[loc.field];
    }
    else {
      throw Error('Internal error: Location was not a var, deref, index, or member access.');
    }
  }

  this.setMemory = function(loc, val) {
    if(loc instanceof ast.Var) {
      this.memory[loc.name] = val;
    }
    else if (loc instanceof ast.Deref){
      this.memory[loc.e1.val] = val;
    }
    else if (loc instanceof ast.IndexAccess){
      this.getMemory(loc.e1)[this.getVal(loc.index)] = val;
    }
    else if (loc instanceof ast.MemberAccess){
      this.getMemory(loc.e1)[loc.field] = val;
    }
    else {
      throw Error('Internal error: Location was not a var, deref, index, or member access.');
    }
  }

  this.getVal = function(leaf) {
    if(leaf instanceof ast.Var || leaf instanceof ast.Deref) {
      return this.getMemory(leaf);
    }
    else if(leaf instanceof ast.MemberAccess) {
      return this.getMemory(leaf.e1)[leaf.field];
    }
    else if(leaf instanceof ast.Lit) {
      return leaf.val;
    }
    else {
      throw Error('Internal error: Expression was not variable, index, deref, member access, or value!');
    }
  }

  var compiled_file = compiler.compileFile(options.code);
  // console.log("Compiled file: ")
  // console.log(JSON.stringify(compiled_file, null, 1));

  for(var decl of compiled_file.decls) {
    if(decl instanceof ast.Fn) {
      this.memory[decl.name] = decl;
    }
    else if(decl instanceof ast.ObjTmpl) {
      continue;
    }
    else {
      throw Error('Unimplemented type: ' + '"' + decl.constructor.name + '"');
    }
  }

  this.stepgen = function(current, next) {
    if(current instanceof ast.Builtin || current instanceof ast.TypBase ||
      current instanceof ast.Lit || current instanceof ast.Var
      || current instanceof ast.Nop) {
      // console.log("On: ", current)
      return next(current);
    }

    else if(current instanceof ast.TypPtr) {
      return this.stepgen(current.typ,
        (vt) => next(new ast.TypPtr(vt)));
    }

    else if(current instanceof ast.TypName) {
      return next(current);
    }

    else if(current instanceof ast.TypArr) {
      return this.stepgen(current.typ,
        (vt) => this.stepgen(current.size,
          (vs) => next(new ast.TypArr(vt, vs))));
    }

    else if(current instanceof ast.TypObj) {
      var fields = Object.keys(current.fields).reduce((acc, h) => {
        return this.stepgen(current.fields[h], (hv) => {
          acc[h] = hv;
          return acc;
        });
      }, {});
      return next(new ast.TypObj(current.name, fields));
    }

    else if(current instanceof ast.Scope) {
      return current.stmts.reduceRight((acc, h) => {
        // console.log("h: ", h);
        // console.log("acc: ", acc);
        return this.stepgen(h, (_) => acc);
      }, next);
    }

    else if(current instanceof ast.Uop) {
      return this.stepgen(current.e1, (v1) => {
        switch(current.op) {
          case '-':
            return next(new ast.Lit('int', -this.getVal(v1)));
          case '+':
            return next(v1);
          default:
            throw Error('Unimplemented uop: ' + current.op);
        }
      });
    }

    else if(current instanceof ast.Bop) {
      return this.stepgen(current.e1, (v1) =>
        this.stepgen(current.e2, (v2) => {
          switch(current.op) {
            case '=':
              this.setMemory(v1, this.getVal(v2));
              this.onAssign(v1, this.getVal(v2));
              return next(v2);
            case '+':
              return next(new ast.Lit('int', this.getVal(v1) + this.getVal(v2)));
            case '-':
              return next(new ast.Lit('int', this.getVal(v1) - this.getVal(v2)));
            case '*':
              return next(new ast.Lit('int', this.getVal(v1) * this.getVal(v2)));
            case '/':
              return next(new ast.Lit('int', this.getVal(v1) / this.getVal(v2)));
            case '!=':
              return next(new ast.Lit('bool', this.getVal(v1) != this.getVal(v2)));
            case '<':
              return next(new ast.Lit('bool', this.getVal(v1) < this.getVal(v2)));
            case '>':
              return next(new ast.Lit('bool', this.getVal(v1) > this.getVal(v2)));
            case '<=':
              return next(new ast.Lit('bool', this.getVal(v1) <= this.getVal(v2)));
            case '>=':
              return next(new ast.Lit('bool', this.getVal(v1) >= this.getVal(v2)));
            default:
              throw Error('Unimplemented bop: ' + current.op);
          }
        })
      );
    }

    else if(current instanceof ast.MemberAccess) {
      return this.stepgen(current.e1, (v1) => {
        return next(new ast.MemberAccess(v1, current.field));
      });
    }

    else if(current instanceof ast.IndexAccess) {
      return this.stepgen(current.e1, (v1) => {
        return this.stepgen(current.index, (v2) => {
          return next(new ast.IndexAccess(v1, v2));
        });
      });
    }

    else if(current instanceof ast.Deref) {
      return this.stepgen(current.e1, (v1) => {
        return next(new ast.Deref(new ast.Lit('ptr', this.getVal(v1))));
      });
    }

    else if(current instanceof ast.Call) {
      return this.stepgen(current.fn, (v1) => {
        v1 = this.getVal(v1);
        if(v1 instanceof ast.Builtin) {
          console.assert(current.args.length == 1);
          return this.stepgen(current.args[0], (r) => {
            return next(v1.f.apply(null, [r]))
          });
        }
        else {
          console.assert(current.args.length == 0);
          this.onFnCall(v1.name, v1.frame);
          for(var v in v1.frame) {
            this.setMemory(new ast.Var(v), this.initMemory(v1.frame[v]));
          }
          // console.log("MEMORY:")
          // console.log(this.memory);
          return (_) => this.stepgen(v1.body, (r) => {
            this.onFnEnd(v1.name, r);
            next(r);
          })
        }
      });
    }

    else if(current instanceof ast.Steppoint) {
      return (_) => {
        this.position = current.position;
        return this.stepgen(current.body, next);
      };
    }

    else if(current instanceof ast.Loop) {
      return this.stepgen(current.cond, (r) => {
        if(this.getVal(r)) {
          return this.stepgen(current.body, this.stepgen(current, next));
        }
        else {
          return next();
        }
      });
    }
    throw Error('Unimplemented type: ' + '"' + current.constructor.name) + '"';
  }

  var stepper = this.stepgen(new ast.Call(new ast.Var('main'), []), (_) => {
    this.position = undefined;
    return null;
  })();

  this.step = function() {
    if(stepper != null) {
      stepper = stepper();
    }
    return stepper;
  }

  this.run = () => {
    while(this.step());
  };
}

module.exports = {
  Program: Program,
  ast: ast,
}

},{"./ast":12,"./compiler":13}]},{},[]);
