import { TextPosition } from "./tokenizer";

export function visualPosition(code: string, position: TextPosition): string {
  let lines = code.split('\n');
  return `${lines[position.row]}\n${Array(position.col+1).join(" ")}^`;
}
