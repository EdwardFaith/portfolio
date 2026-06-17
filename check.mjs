import * as acorn from 'acorn';
import jsx from 'acorn-jsx';
import fs from 'fs';

const content = fs.readFileSync('index.html', 'utf8');
const start = content.indexOf('<script type="text/babel"');
const end = content.lastIndexOf('</script>');

if (start !== -1 && end !== -1) {
  const scriptStart = content.indexOf('>', start) + 1;
  const script = content.substring(scriptStart, end);
  
  try {
    acorn.Parser.extend(jsx()).parse(script, { sourceType: 'module', ecmaVersion: 2020 });
    console.log('Syntax OK');
  } catch(e) {
    console.error('Syntax Error at line', e.loc ? e.loc.line : e.pos, e.message);
    const lines = script.split('\n');
    const errLine = e.loc ? e.loc.line - 1 : 0;
    console.log('Code near error:');
    for (let i = Math.max(0, errLine - 5); i <= Math.min(lines.length - 1, errLine + 5); i++) {
        console.log(`${i+1}: ${lines[i]}`);
    }
  }
} else {
  console.log('No script block found', start, end);
}
