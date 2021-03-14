import { AbstractReader } from "../AbstractReader";
import { ReadToken } from "../ReadToken";

export class EOFReader extends AbstractReader<null> {
  label: string;
  constructor() {
    super();
    this.label = '<EOF>';
  }
  read(str: string, index: number): ReadToken<null> | null {
    if (index === str.length) {
      return {
        value: null,
        position: index,
        length: 0,
        next: index
      };
    }
    return null;
  }
}