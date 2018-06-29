var memory = require('../src/runtime.js');
var test = require('tape');

// test('setting and loading values from memory', function(t) {
//   t.plan(5);
//
//   var mem = new memory.Memory(8);
//
//   mem = mem.write(255, 1, 1, memory.unsigned);
//   mem = mem.write(255, 2, 1, memory.unsigned);
//   mem = mem.write(-1, 3, 1, memory.signed);
//   mem = mem.write(1.25, 4, 4, memory.float);
//
//   t.equal(mem.read(1,1, memory.unsigned), 255, 'simple read');
//   t.equal(mem.read(2,1, memory.signed), -1, 'reading a different type');
//   t.equal(mem.read(3,1, memory.unsigned), 255, 'reading a different type');
//   t.equal(mem.read(4,4, memory.float), 1.25, 'reading a float');
//   t.equal(mem.read(3,1, memory.signed), -1, 'simple read');
// });
//
// test('using heap allocations', function(t) {
//   t.plan(4);
//
//   var heap = new memory.Heap();
//
//   var obj = heap.malloc(10);
//   loc1 = obj.address;
//   heap = obj.state;
//
//   obj = heap.malloc(12);
//   loc2 = obj.address;
//   heap = obj.state;
//
//   t.notEqual(loc1,loc2, 'malloc provides multiple addresses');
//
//   heap = heap.write(19, loc1, 1, memory.unsigned);
//   heap = heap.write(5, loc1 + 5, 1, memory.unsigned);
//
//   t.equal(heap.read(loc1, 1, memory.unsigned), 19, "reading from the heap");
//   t.equal(heap.read(loc1 + 5, 1, memory.unsigned), 5, "reading from the heap with an offset");
//
//   heap = heap.write(2100, loc2 + 4, 4, memory.signed);
//
//   t.equal(heap.read(loc2 + 4, 4, memory.signed), 2100, "reading a bigger number from the heap");
// });
