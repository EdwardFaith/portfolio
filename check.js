const babel = require('@babel/core');
const fs = require('fs');

const content = fs.readFileSync('index.html', 'utf8');
const babelMatch = content.match(/<script type=.text\/babel.>(.*?)<\/script>/s);

if (babelMatch) {
  try {
    babel.transformSync(babelMatch[1], {
      presets: ['@babel/preset-react'],
      filename: 'index.jsx'
    });
    console.log('Syntax OK');
  } catch(e) {
    console.error('Syntax Error:', e.message);
  }
} else {
  console.log("No babel script found");
}
