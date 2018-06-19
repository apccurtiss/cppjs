struct Node {
  int key;
  Node *next;
};

int main ( ) {
  Node a;
  Node b;
  Node c;

  a.next = &b;
}
