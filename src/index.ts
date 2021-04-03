import { Read } from './read/Read';
import { value } from './languages/json/complex';
import { compile } from './read/readers/CompilationSupport';
import { ReadResult } from './read/ReadResult';
import { JsonValue } from './languages/json/complex';
export { JsonValue, convertJsonValue } from './languages/json/complex';
export { ReadResult } from './read/ReadResult';

const jsonFileReader = value.lookahead(Read.eof());
export const jsonFileRead = jsonFileReader.read.bind(jsonFileReader);
export const jsonFileCompiled = compile(jsonFileReader);

function findRecursionLimit(read: (str: string, pos: number) => ReadResult<JsonValue>): number {
  const UPPER_LIMIT = 5000;
  for (let i = 50; i < UPPER_LIMIT; i += 10) {
    if (i % 100 === 0) console.info(`...${i}`);
    const data = '['.repeat(i) + ']'.repeat(i);
    try {
      read(data, 0)
    } catch (e) {
      if (e instanceof RangeError) {
        return i;
      } else {
        throw e;
      }
    }
  }
  return - 1;
}

console.info('Computing recursion limit of Reader...');
console.info(`Compiled recursion limit: ${findRecursionLimit(jsonFileCompiled)}`);
