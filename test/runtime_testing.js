var compiler = require('../src/compiler.js');
var test = require('tape');

test('Step through function.', function(t) {
  t.plan(11);

  var output = '';
  var program = compiler.compile(`
    int main ( ) {
      cout << 1;
      cout << 1 + 2;
      cout << 1 + 2 + 3;
    }`,
    {
      onPrint: (text) => { output += text; },
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

test('Perform complex prints.', function(t) {
  t.plan(5);

  var output = '';
  var program = compiler.compile(`
    int main ( ) {
      cout << 1 ;
      cout << "Hello" ;
      cout << 1 << endl ;
      cout << 1 << 2 << "Hello" << endl ;
    }`,
    {
      onPrint: (text) => { output += text; },
    });

  t.doesNotThrow(program.step);
  t.doesNotThrow(program.step);
  t.equals(output, `1`)
  t.doesNotThrow(program.step);
  t.equals(output, `1Hello`)
  // TODO(alex): Implement this
  // t.doesNotThrow(program.step);
  // t.equals(output, `1Hello1\n`)
  // t.doesNotThrow(program.step);
  // t.equals(output, `1Hello1\n12Hello\n`)

  t.end();
});

test('Test operator presidence.', function(t) {
  t.plan(2);

  var output = '';
  var program = compiler.compile(`int main ( ) {
      cout << ( 12 + 6 / 3 * 2 - 1 ) * 10 ;
    }`,
    {
      onPrint: (text) => { output += text; },
    });

  t.doesNotThrow(program.run);
  t.equal(output, '150');

  t.end();
});

test('Test control flow.', function(t) {
  t.plan(2);

  var output = '';
  var program = compiler.compile(`
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
    }`,
    {
      onPrint: (text) => { output += text; },
    });

  t.doesNotThrow(program.run);
  t.equal(output, '000123000');

  t.end();
});

test('Test stepping through statements.', function(t) {
  t.plan(30);

  var output = '';
  var assigns = 0;
  var program = compiler.compile(`
    int main ( ) {
      for(int i = 1; i <= 2; i++) {
        cout << i;
      }
      {
        cout << 3;
        cout << 4;
      }
      cout << 5;
      if(1 < 2) {
        cout << 6;
        cout << 7;
      }
    }`,
    {
      onPrint: (text) => { output += text; },
      onAssign: (text) => { assigns++; },
    });

  t.doesNotThrow(program.step); t.equal(output, '');
  t.doesNotThrow(program.step); t.equal(assigns, 1);
  t.doesNotThrow(program.step); t.equal(output, '');
  t.doesNotThrow(program.step); t.equal(output, '1');
  t.doesNotThrow(program.step); t.equal(assigns, 2);
  t.doesNotThrow(program.step); t.equal(output, '1');
  t.doesNotThrow(program.step); t.equal(output, '12');
  t.doesNotThrow(program.step); t.equal(assigns, 3);
  t.doesNotThrow(program.step); t.equal(output, '12');
  t.doesNotThrow(program.step); t.equal(output, '123');
  t.doesNotThrow(program.step); t.equal(output, '1234');
  t.doesNotThrow(program.step); t.equal(output, '12345');
  t.doesNotThrow(program.step); t.equal(output, '12345');
  t.doesNotThrow(program.step); t.equal(output, '123456');
  t.doesNotThrow(program.step); t.equal(output, '1234567');

  t.end();
});

test('Array of structs.', function(t) {
  t.plan(7);

  var output = '';
  var program = compiler.compile(`
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
    }`,
    {
      onPrint: (text) => { output += text; },
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
  var program = compiler.compile(`
    int main ( ) {
      int *y = new int;
      *y = 7;
      cout << *y;
    }`,
    {
      onPrint: (text) => { output += text; },
      onDynamicAllocation: (_) => { dynamicAllocations += 1; },
    });

  t.doesNotThrow(program.run);
  t.equal(dynamicAllocations, 1);
  t.equal(output, '7');
});

test('Linked list.', function(t) {
  t.plan(3);

  var output = '';
  var dynamicAllocations = 0;
  var program = compiler.compile(`
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
    }`,
    {
      onPrint: (text) => { output += text; },
      onDynamicAllocation: (_) => { dynamicAllocations += 1; },
    });

  t.doesNotThrow(program.run);
  t.equal(output, '12');
  t.equal(dynamicAllocations, 2);
});

test('Calling functions.', function(t) {
  t.plan(2);

  var output = '';
  var program = compiler.compile(`
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
    }`,
    {
      onPrint: (text) => { output += text; },
    });

  t.doesNotThrow(program.run);
  t.equal(output, '1006');
});

test('Calling object methods.', function(t) {
  t.plan(2);

  var output = '';
  var program = compiler.compile(`
    struct Node {
      int num ;
      void init ( int x , int y ) {
        num = x  + y ;
      }
    } ;

    int main ( ) {
      Node n ;
      n . init ( 12 , 47 ) ;
      cout << n . num ;
    }`,
    {
      onPrint: (text) => { output += text; },
    });

  t.doesNotThrow(program.run);
  t.equal(output, '59');
});

test('Linked list class', function(t) {
  t.plan(2);

  var output = '';
  var program = compiler.compile(`
    struct Node {
      int key;
      Node *next;
    };

    struct LinkedList {
      Node *add(int v) {
        Node *newNode = new Node;
        newNode->key = v;
        newNode->next = NULL;

        if(!head) {
          head = newNode;
        }
        else {
          Node *tmp = head;
          while(tmp->next != NULL) {
            tmp = tmp->next;
          }
          tmp->next = newNode;
        }

        return head;
      }

      void print() {
        Node *tmp = head;
        while(tmp != NULL) {
          cout << tmp->key;
          tmp = tmp->next;
        }
      }

      Node *head;
    };


    int main ( ) {
      LinkedList ll;
      ll.add(6);
      ll.add(7);
      ll.add(2);
      ll.print();
    }`,
    {
      onPrint: (text) => { output += text; },
    });

  t.doesNotThrow(program.run);
  t.equal(output, '672');
});
