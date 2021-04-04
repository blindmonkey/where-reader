const { ReadResult, jsonFileRead, jsonFileCompiled, convertJsonValue } = require('./out/index');
const path = require('path');
const fs = require('fs').promises;
const { expect } = require('chai');
const yargs = require('yargs');
const performance = require('perf_hooks').performance;

const argv = yargs
  .option('mode', {
    alias: 'm',
    description: 'The parsing mode to use',
    choices: ['native', 'reader', 'compiled'],
    default: 'reader'
  })
  .option('runs', {
    description: 'number of runs for benchmark',
    type: 'number',
    default: 10
  })
  .option('report-expected-failures', {
    alias: 'r',
    description: 'Whether expected failures should be reported',
    type: 'boolean'
  })
  .option('verify', {
    description: 'Whether the results should be verified using the native parser',
    type: 'boolean'
  })
  .option('benchmark', {
    alias: 'b',
    description: 'Whether we should benchmark parse times',
    type: 'boolean'
  })
  .help()
  .alias('help', 'h')
  .argv;

const testdir = path.join('.', 'test_parsing');

const Expectation = {
  pass: 'y_',
  fail: 'n_',
  either: 'i_'
};

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
  const benchmarkRuns = argv.runs;
  let benchmarkResults = {};
  let dir = await fs.readdir(testdir);
  let failures = 0;
  const undef = [0, 0];
  for (let i = 0; i < dir.length; i++) {
    const filename = dir[i];
    if (!filename.endsWith('.json')) continue;
    // console.info(filename);
    const expectation = filename.slice(0, 2);
    const result = await readFile(path.join(testdir, filename));
    const parser = (() => {
      switch (argv.mode) {
        case 'reader':
          return jsonFileRead;
        case 'compiled':
          return jsonFileCompiled;
        case 'native':
          return (str, position) => {
            const obj = JSON.parse(str.slice(position));
            return ReadResult.token(obj, {});
          };
        default:
          throw 'Unknown mode: ' + argv.mode;
      }
    })();
    const parse = () => {
      try {
        return parser(result, 0);
      } catch (e) {
        return ReadResult.failure(ReadResult.error(`${e.toString()}\n${e.stack}`, result.length));
      }
    }
    let parsed;
    if (!argv.benchmark) {
      parsed = parse();
    } else {
      const now = performance.now();
      for (let i = 0; i < benchmarkRuns; i++) {
        parsed = parse();
      }
      benchmarkResults[filename] = performance.now() - now;
    }
    if (expectation === Expectation.either) {
      const res = ReadResult.isSuccess(parsed) ? 'pass' : 'fail';
      undef[1]++;
      if (ReadResult.isFailure(parsed)) {
        console.log(`undefined case -- ${res} -- ${filename}`);
        // console.log(await fs.readFile(path.join(testdir, filename)))
        // console.log(hexstring(result));
        reportFailure(filename, result, parsed);
      } else {
        undef[0]++;
      }
    } else if (
      (ReadResult.isSuccess(parsed) && expectation == Expectation.pass) ||
      (ReadResult.isFailure(parsed) && expectation == Expectation.fail)) {
      if (ReadResult.isFailure(parsed)) {
        if (argv['report-expected-failures']) {
          reportFailure(filename, result, parsed);
        }
      } else if (argv.verify) {
        const nativeParsed = JSON.parse(result);
        try {
          expect(nativeParsed).to.be.deep.equal(convertJsonValue(parsed.value));
        } catch (e) {
          console.error(`${filename} -- values not equal`);
          console.error(nativeParsed);
          console.error(parsed);
          console.error(convertJsonValue(parsed.value));
        }
      }
    } else {
      failures++;
      console.log(`fail -- ${filename}`);
      console.info(result);
      if (ReadResult.isFailure(parsed)) {
        reportFailure(filename, result, parsed);
      }
    }
  }
  console.error(`Failed ${failures} tests, passed ${undef[0]}/${undef[1]} undefined cases`);
  if (argv.benchmark) {
    let min = null;
    let max = null;
    let sum = 0;
    let cnt = 0;
    for (const k in benchmarkResults) {
      const time = benchmarkResults[k];
      if (min == null || time < benchmarkResults[min])
        min = k;
      if (max == null || time > benchmarkResults[max])
        max = k;
      sum += time;
      cnt++;
    }
    console.info(`Benchmark results (${benchmarkRuns} runs):`);
    console.info(`Quickest time: ${min} / ${benchmarkResults[min] / benchmarkRuns}ms`);
    console.info(`Slowest time: ${max} / ${benchmarkResults[max] / benchmarkRuns}ms`);
    console.info(`Average time: ${sum / cnt / benchmarkRuns}ms`);
  }
}

main();