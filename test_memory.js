var memory = require('./memory.js');
var test = require('tape');

test('setting and loading values from memory', function(t) {
  t.plan(5);
  
  stack = new memory.Memory(32);
  
  stack.write(255, 1, 1, memory.unsigned);
  stack.write(255, 2, 1, memory.unsigned);
  stack.write(-1, 3, 1, memory.signed);
  stack.write(1.25, 4, 4, memory.float);
  
  t.equal(stack.read(1,1, memory.unsigned), 255);
  t.equal(stack.read(2,1, memory.signed), -1);
  t.equal(stack.read(3,1, memory.unsigned), 255);
  t.equal(stack.read(4,4, memory.float), 1.25);
  t.equal(stack.read(3,1, memory.signed), -1)
})
