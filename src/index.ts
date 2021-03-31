import { Read } from './read/Read';
import { value } from './languages/json/complex';
export { JsonValue, convertJsonValue } from './languages/json/complex';
export { ReadResult } from './read/ReadResult';

export const jsonFile = value.lookahead(Read.eof());
