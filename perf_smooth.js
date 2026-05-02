const fs = require('fs');
const file = 'c:/Users/swami/.gemini/antigravity/scratch/izidelivery_git/izidelivery/app-entregador-completo/src/App.tsx';
let code = fs.readFileSync(file, 'utf8');

// The replacement logic:
const extractPointsRegex = /const points = rawStats\.map\(\(val, i\) => \{([\s\S]*?)\}\);/m;

const bezierLogic = `
                                    const pointsData = rawStats.map((val, i) => {
                                        const x = (i / 6) * 100;
                                        const y = 100 - ((val / maxVal) * 90);
                                        return { x, y };
                                    });

                                    let linePath = \`M \${pointsData[0].x},\${pointsData[0].y}\`;
                                    for (let i = 1; i < pointsData.length; i++) {
                                        const prev = pointsData[i - 1];
                                        const curr = pointsData[i];
                                        const midX = (prev.x + curr.x) / 2;
                                        linePath += \` C \${midX},\${prev.y} \${midX},\${curr.y} \${curr.x},\${curr.y}\`;
                                    }
                                    
                                    const areaPath = \`\${linePath} L 100,100 L 0,100 Z\`;
`;

// Replace everything between `const maxVal = Math.max(...rawStats, 10);` and `return (`
const targetStart = 'const maxVal = Math.max(...rawStats, 10);';
const targetEnd = 'return (';
const s1 = code.indexOf(targetStart);
const s2 = code.indexOf(targetEnd, s1);

if (s1 !== -1 && s2 !== -1) {
    const chunkBefore = code.substring(0, s1 + targetStart.length);
    const chunkAfter = code.substring(s2);
    code = chunkBefore + '\n' + bezierLogic + '\n                                    ' + chunkAfter;
    fs.writeFileSync(file, code);
    console.log('Applied smooth bezier curves');
} else {
    console.log('Could not find target strings for bezier');
}
