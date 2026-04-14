const fs = require('fs');
const filePath = 'c:/Users/swami/.gemini/antigravity/scratch/izidelivery/app-entregador-completo/src/App.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const regex = /    const \[activeTab, setActiveTab\] = useState<View>\(\(\) => \{\s*const saved = localStorage\.getItem\('Izi_active_mission'\);\s*return saved \? 'active_mission' : 'dashboard';\s*\}\);/;
const replacement = "    const [activeTab, setActiveTab] = useState<View>('dashboard');";

if (regex.test(content)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Replaced activeTab successfully');
} else {
    console.log('Regex not found!');
}
