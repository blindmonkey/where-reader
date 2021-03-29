import { ReadResult } from "src/read/ReadResult";
import { expr } from "./readers/expression";
import { BExpr, EqualityOperator, isEqualityOperator, isMathOperator, MathOperator } from "./tokens";

class CompilationContext {
  private id_: number = 0;
  get id(): string {
    const id = this.id_;
    this.id_++;
    return '_' + id;
  }
}

function compileMathOrEqualityOperator(op: MathOperator | EqualityOperator, lhs: string, rhs: string): string {
  switch (op) {
    case '+':
    case '-':
    case '*':
    case '/':
    case '<=':
    case '>=':
    case '<':
    case '>':
      return `${lhs} ${op} ${rhs}`;
    case '=':
      return `${lhs} === ${rhs}`;
    case '^':
      return `Math.pow(${lhs}, ${rhs})`;
  }
}

/**
 * Escapes the given string for inclusion in double quotes.
 * @param s The string to escape.
 */
function escapeString(s: string): string {
  const out: string[] = [];
  for (let i = 0; i < s.length; i++) {
    const char = s[i];
    if (char === '"') out.push('\\"');
    else if (char === '\\') out.push('\\\\');
    else if (char === '\n') out.push('\\n');
    else if (char === '\r') out.push('\\r');
    else if (char === '\t') out.push('\\t');
    // TODO: Escape more things, especially unicode chars.
    else out.push(char);
  }
  return out.join('');
}

function compileExpression(expr: BExpr, context: CompilationContext): {id: string, code: string} {
  const id = context.id;
  function result(expr: string, deps: string = '') {
    return {
      id: id,
      code: `${deps}var ${id} = ${expr};\n`
    };
  }
  switch (expr.type) {
    case 'identifier':
      return result(`context['${expr.identifier}']`);
    case 'number':
      return result(expr.value);
    case 'string':
      return result(`"${escapeString(expr.content)}"`)
    case 'property':
      const e = compileExpression(expr.expr, context);
      return result(`${e.id}.${expr.identifier.identifier}`, e.code);
    case 'subscript':
      const value = compileExpression(expr.value, context);
      const property = compileExpression(expr.property, context);
      return result(`${value.id}[${property.id}]`, `${value.code}${property.code}`);
    case 'list':
      const tokens = expr.tokens.map(token => compileExpression(token, context));
      return result(`[${tokens.map(t => t.id).join(', ')}]`, tokens.map(t => t.code).join(''));
    case 'binary':
      const lhs = compileExpression(expr.lhs, context);
      const rhs = compileExpression(expr.rhs, context);
      if (isMathOperator(expr.operator) || isEqualityOperator(expr.operator)) {
        return result(`(${compileMathOrEqualityOperator(expr.operator, lhs.id, rhs.id)})`, `${lhs.code}${rhs.code}`);
      } else {
        switch (expr.operator) {
          case 'and':
            return {
              id: id,
              code: `${lhs.code}if (${lhs.id}) {\n${rhs.code}var ${id} = ${rhs.id};\n} else { var ${id} = ${lhs.id}; }`
            }
          case 'or':
            return {
              id: id,
              code: `${lhs.code}if (${lhs.id}) { var ${id} = ${lhs.id};\n} else {\n${rhs.code}var ${id} = ${rhs.id};\n}`
            }
          case 'in':
            throw `Unsupported operator ${expr.operator}`;
        }
      }
  }
}

export function compile(expression: string): string {
  const parsed = expr.read(expression, 0);
  if (ReadResult.isFailure(parsed)) throw 'Parse error';
  const compiled = compileExpression(parsed.value, new CompilationContext());
  return `
function(context) {
${compiled.code}
return ${compiled.id};
}`;
}