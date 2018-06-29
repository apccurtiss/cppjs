struct Node {
  int key;
  Node *next;
};

int main ( ) {
  Node a;
  Node b;
  Node c;

  a.next = &b;
  b.next = &c;
  c.next = 0;

  Node *tmp = &a;

  while(tmp != 0) {
    tmp = tmp->next;
  }
}
