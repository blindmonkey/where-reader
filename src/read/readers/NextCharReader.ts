import { AbstractReader } from "../AbstractReader";
import { ReadResult } from "../ReadResult";

export class NextCharReader extends AbstractReader<string> {
  get label(): string {
    return '<any char>';
  }
  read(str: string, index: number): ReadResult<string> {
    if (index >= str.length) {
      return {
        type: 'failure',
        errors: [{
          expected: this.label,
          position: index,
          context: []
        }]
      }
    }
    return {
      type: 'token',
      value: str[index],
      position: index,
      length: 1,
      next: index + 1,
      errors: []
    };
  }

}