const fs = require('fs');
const filePath = 'c:/Users/swami/.gemini/antigravity/scratch/izidelivery/app-entregador-completo/src/App.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const regex = /onClick=\{async \(\) => \{\s*try \{\s*const \{ error \} = await supabase\.from\('slot_applications'\)\.insert\([^;]*;\s*if \(error\) throw error;\s*toastSuccess\('Candidatura enviada!'\);\s*setSelectedSlot\(null\);\s*setActiveTab\('dashboard'\);\s*\} catch \{ toastError\('Erro ao candidatar\.'\); \}\s*\}\}\s*className="flex-1 flex items-center justify-center gap-3 h-14 font-black text-xs uppercase text-stone-950 active:scale-\[0\.98\] transition-all"\s*style=\{\{ \.\.\.sClayYellow, borderRadius: '1\.2rem', letterSpacing: '0\.15em' \}\}\s*>\s*<Icon name="verified" size=\{18\} \/>\s*Candidatar-se à Vaga\s*<\/button>/g;

const match = content.match(regex);
if (match) {
    console.log("Found match, replacing...");
    const newButton = `onClick={() => handleApplyToSlot(selectedSlot)}
                                            disabled={applyingSlotId === selectedSlot.id}
                                            className={\`flex-1 flex items-center justify-center gap-3 h-14 font-black text-xs uppercase text-stone-950 active:scale-[0.98] transition-all \${applyingSlotId === selectedSlot.id ? 'opacity-50 cursor-not-allowed' : ''}\`}
                                            style={{ ...sClayYellow, borderRadius: '1.2rem', letterSpacing: '0.15em' }}
                                        >
                                            <Icon name={applyingSlotId === selectedSlot.id ? 'sync' : 'stars'} size={18} className={applyingSlotId === selectedSlot.id ? 'animate-spin' : ''} />
                                            {applyingSlotId === selectedSlot.id ? 'Enviando...' : 'Candidatar-se à Vaga'}
                                        </button>`;
                                        
    content = content.replace(regex, newButton);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Button replaced successfully');
} else {
    // try a more forgiving regex
    console.log("Strict regex failed, trying flexible one");
    const flexRegex = /onClick=\{async \(\) => \{\s*try \{\s*.*?\s*\} catch.*?\}\}\s*className="flex-1 flex items-center justify-center gap-3 h-14 font-black text-xs uppercase text-stone-950 active:scale-\[0\.98\] transition-all"\s.*?<\/button>/s;
    if (flexRegex.test(content)) {
        const newButton = `onClick={() => handleApplyToSlot(selectedSlot)}
                                            disabled={applyingSlotId === selectedSlot.id}
                                            className={\`flex-1 flex items-center justify-center gap-3 h-14 font-black text-xs uppercase text-stone-950 active:scale-[0.98] transition-all \${applyingSlotId === selectedSlot.id ? 'opacity-50 cursor-not-allowed' : ''}\`}
                                            style={{ ...sClayYellow, borderRadius: '1.2rem', letterSpacing: '0.15em' }}
                                        >
                                            <Icon name={applyingSlotId === selectedSlot.id ? 'sync' : 'stars'} size={18} className={applyingSlotId === selectedSlot.id ? 'animate-spin' : ''} />
                                            {applyingSlotId === selectedSlot.id ? 'Enviando...' : 'Candidatar-se à Vaga'}
                                        </button>`;
        content = content.replace(flexRegex, newButton);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Button replaced flexibly successfully');
    } else {
        console.log("Oh no, could not find it");
    }
}
