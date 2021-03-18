import { compile } from './compilation';
import { expr } from './readers/expression';

console.log(compile('a.b.c[1 + x].d and z = (1, 2, 3 + 4)'));
console.log(compile('a or b'));
console.log(JSON.stringify(expr.read('a.b.c[1 + 2].d', 0)));
console.log(JSON.stringify(expr.read('yyz', 0)));
console.log(JSON.stringify(expr.read('    x = 5', 0)));
console.log(JSON.stringify(expr.read('z in (1, 2, 3)', 0)));
console.log(JSON.stringify(expr.read('x = 5 and y = 3 or z in (1, 2, 3)', 0)));
console.log(JSON.stringify(expr.read('x <= 5 and (y >= 3 and y < 5) or z in (1, 2, 3)', 0)));
