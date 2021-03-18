import { AbstractReader } from "../AbstractReader";
import { ReadResult } from "../ReadResult";

/**
 * Reads an EOF. Returns a success when the current index is past the end of the
 * string, and a failure otherwise.
 */
export class EOFReader extends AbstractReader<null> {
  label: string;
  constructor() {
    super();
    this.label = '<EOF>';
  }
  read(str: string, index: number): ReadResult<null> {
    if (index >= str.length) {
      return {
        type: 'token',
        value: null,
        position: index,
        length: 0,
        next: index,
        errors: []
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