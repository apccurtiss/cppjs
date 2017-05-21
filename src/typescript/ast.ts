export enum ExprType {
  // grouping symbols
  Plus, Literal
}

class Expr {
  constructor(public type: ExprType, public e1, public e2?, public e3?) {}
}
