var runtime = require('../src/runtime.js');
var test = require('tape');

test('Get basic function output.', function(t) {
  t.plan(11);

  var output = '';
  var program = new runtime.Program({
    onPrint: (text) => { output += text; },
    code: `int main ( ) { cout << 1; cout << 1 + 2; cout << 1 + 2 + 3; }`
  });

  t.doesNotThrow(program.step);
  t.doesNotThrow(program.step);
  t.equal(output, '1');
  t.doesNotThrow(program.step);
  t.equal(output, '13');
  t.doesNotThrow(program.step);
  t.equal(output, '136');
  t.doesNotThrow(program.step);
  t.equal(output, '136');
  t.doesNotThrow(program.step);
  t.equal(output, '136');

  t.end();
});

// test('Test operator presidence.', function(t) {
//   t.plan(2);
//
//   var output = '';
//   var program = new runtime.Program({
//     onPrint: (text) => { output += text; },
//     code: `int main ( ) {
//       cout << 12 ;
//     }`
//     // cout << ( 12 + 6 / 3 * 2 - 1 ) * 10 ;
//   });
//
//   t.doesNotThrow(program.run);
//   t.equal(output, '470');
//
//   t.end();
// });

test('Test control flow.', function(t) {
  t.plan(2);

  var output = '';
  var program = new runtime.Program({
    onPrint: (text) => { output += text; },
    code: `
    int main ( ) {
      int i = 1;
      while(i <= 3) {
        for(int j = 1; j <= 3; j++) {
          if(i % 2 == 0) {
            cout << j;
          }
          else {
            cout << 0;
          }
        }
        i++;
      }
    }`
  });

  t.doesNotThrow(program.run);
  t.equal(output, '000123000');

  t.end();
});

test('Array of structs.', function(t) {
  t.plan(7);

  var output = '';
  var program = new runtime.Program({
    onPrint: (text) => { output += text; },
    code: `
    struct Foo {
      int bar ;
    } ;

    int main ( ) {
      Foo foos [ 10 ] ;
      for ( int i = 0 ; i < 10 ; i ++ ) {
        foos [ i ] . bar = i ;
      }

      for ( int i = 9 ; i >= 0 ; i -- ) {
        cout << foos [ i ] . bar ;
      }
    }`
  });

  t.doesNotThrow(program.step); // Foo foos [ 10 ] ;
  t.doesNotThrow(program.step); // int i = 0
  t.doesNotThrow(program.step); // i < 10
  t.doesNotThrow(program.step); // foos [ i ] . bar = i ;
  t.doesNotThrow(program.step); // i ++
  t.doesNotThrow(program.run);
  t.equal(output, '9876543210');

  t.end();

});

test('Basic dynamic memory.', function(t) {
  t.plan(3);

  var output = '';
  var dynamicAllocations = 0;
  var program = new runtime.Program({
    onPrint: (text) => { output += text; },
    onDynamicAllocation: (_) => { dynamicAllocations += 1; },
    code: `int main ( ) { int *y = new int; *y = 7; cout << *y; }`
  });

  t.doesNotThrow(program.run);
  t.equal(dynamicAllocations, 1);
  t.equal(output, '7');
});

test('Basic linked list.', function(t) {
  t.plan(3);

  var output = '';
  var dynamicAllocations = 0;
  var program = new runtime.Program({
    onPrint: (text) => { output += text; },
    onDynamicAllocation: (_) => { dynamicAllocations += 1; },
    code: `
    struct Node {
      int key;
      Node *next;
    };

    int main ( ) {
      Node *head;
      head = new Node;
      head->key = 1;
      head->next = new Node;
      head->next->key = 2;
      head->next->next = 0;

      while(head != 0) {
        cout << head->key;
        head = head->next;
      }
    }`
  });

  t.doesNotThrow(program.run);
  t.equal(output, '12');
  t.equal(dynamicAllocations, 2);
});

test('Calling functions.', function(t) {
  t.plan(2);

  var output = '';
  var program = new runtime.Program({
    onPrint: (text) => { output += text; },
    code: `
    int add_two( int x , int y ) {
      cout << 0;
      return x + y ;
    }

    int add_three( int x , int y , int z ) {
      cout << 1;
      return add_two ( add_two ( x , y ) , z ) ;
    }

    int main ( ) {
      cout << add_three ( 1 , 2 , 3 ) ;
    }`
  });

  t.doesNotThrow(program.run);
  t.equal(output, '1006');
});
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
