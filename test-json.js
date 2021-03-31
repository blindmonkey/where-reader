const r = require('./out/index');
const path = require('path');
const fs = require('fs').promises;
const { expect } = require('chai');

const ReadResult = r.ReadResult;
const testdir = path.join('.', 'test_parsing');

const Expectation = {
  pass: 'y_',
  fail: 'n_',
  either: 'i_'
};

function repeat(s, n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push(s);
  }
  return out.join('');
}

function nullWhen(value, f) {
  if (f(value)) return null;
  return value;
}

function getOrDefault(value, def) {
  if (value == null) return def;
  return value;
}

function mapNullable(value, f) {
  if (value == null) return value;
  return f(value);
}

function count(inString, content, before) {
  let count = 0;
  let index = 0;
  while (true) {
    let found = inString.indexOf(content, index);
    if (found < 0 || found >= before) return count;
    count++;
    index = found + content.length;
  }
}

function reportFailure(filename, file, failure) {
  failure.errors.sort((a, b) => a.position - b.position);
  const lastError = failure.errors[failure.errors.length - 1];
  const lastPosition = lastError == null ? 0 : lastError.position;
  const errors = failure.errors.filter(e => e.position === lastPosition);
  const lastNewline = getOrDefault(mapNullable(nullWhen(file.lastIndexOf('\n', lastPosition - 1), n => n < 0), n => n + 1), 0);
  const nextNewline = getOrDefault(nullWhen(file.indexOf('\n', lastPosition), n => n < 0), file.length);
  const relativePosition = lastPosition - lastNewline;

  let line = file.slice(lastNewline, nextNewline);
  let correctedPosition = relativePosition
  if (relativePosition > 60) {
    line = '...' + line.slice(relativePosition - 40);
    correctedPosition = correctedPosition - (relativePosition - 40) + 3;
  }

  console.log(`${filename}:${count(file, '\n', lastNewline) + 1}:${relativePosition - lastNewline}`);
  console.log(line);
  console.log(' '.repeat(correctedPosition) + '^');

  console.error(errors.map(e => e.expected).join(' | ')
    .replace('\n', '\\n')
    .replace('\t', '\\t')
    .replace('\r', '\\r')
    .replace('\b', '\\b'));
  console.error('');
}

function hexstring(s) {
  function append0(s) {
    while (s.length % 2 !== 0) s = '0' + s;
    return s;
  }
  const out = [];
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i).toString(16);
    out.push(append0(code));
  }
  return out.join(' ');
}

async function readFile(filename) {
  const buffer = await fs.readFile(filename);
  if (buffer.length >= 2) {
    const xx = buffer.readUInt16BE(0);
    if (xx === 65534) { // 0xfffe, BOM
      return fs.readFile(filename, {encoding: 'utf16le'});
    }
  }
  return fs.readFile(filename, {encoding: 'utf8'});
}

async function main() {
  let dir = await fs.readdir(testdir);
  let failures = 0;
  const undef = [0, 0];
  for (let i = 0; i < dir.length; i++) {
    const filename = dir[i];
    if (!filename.endsWith('.json')) continue;
    const expectation = filename.slice(0, 2);
    const result = await readFile(path.join(testdir, filename));
    let parsed;
    try {
      parsed = r.jsonFile.read(result, 0);
    } catch (e) {
      parsed = ReadResult.failure(ReadResult.error(`${e.toString()}\n${e.stack}`, result.length));
    }
    if (expectation === Expectation.either) {
      const res = ReadResult.isSuccess(parsed) ? 'pass' : 'fail';
      undef[1]++;
      if (ReadResult.isFailure(parsed)) {
        console.log(`undefined case -- ${res} -- ${filename}`);
        console.log(await fs.readFile(path.join(testdir, filename)))
        console.log(hexstring(result));
        reportFailure(filename, result, parsed);
      } else {
        undef[0]++;
      }
    } else if (
      (ReadResult.isSuccess(parsed) && expectation == Expectation.pass) ||
      (ReadResult.isFailure(parsed) && expectation == Expectation.fail)) {
      if (ReadResult.isFailure(parsed)) {
        // reportFailure(filename, result, parsed);
      } else {
        const nativeParsed = JSON.parse(result);
        try {
          expect(nativeParsed).to.be.deep.equal(r.convertJsonValue(parsed.value));
        } catch (e) {
          console.error(`${filename} -- values not equal`);
          console.error(nativeParsed);
          console.error(parsed);
          console.error(r.convertJsonValue(parsed.value));
        }
      }
    } else {
      failures++;
      console.log(`fail -- ${filename}`);
      console.info(result);
    }
  }
  console.error(`Failed ${failures} tests, passed ${undef[0]}/${undef[1]} undefined cases`);
}

main();