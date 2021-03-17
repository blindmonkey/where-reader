import { AbstractReader } from "../AbstractReader";
import { ReadResult } from "../ReadResult";

export class EOFReader extends AbstractReader<null> {
  label: string;
  constructor() {
    super();
    this.label = '<EOF>';
  }
  read(str: string, index: number): ReadResult<null> {
    if (index === str.length) {
      return {
        type: 'token',
        value: null,
        position: index,
        length: 0,
        next: index
      };
    }
    return {
      type: 'failure',
      errors: [{
        expected: this.label,
        position: index,
        context: []
      }]
    };
  }
}