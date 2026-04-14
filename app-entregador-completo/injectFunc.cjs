const fs = require('fs');
const filePath = 'c:/Users/swami/.gemini/antigravity/scratch/izidelivery/app-entregador-completo/src/App.tsx';
let content = fs.readFileSync(filePath, 'utf8');

if (!content.includes('const handleApplyToSlot = async')) {
    const fnCode = `\n    const handleApplyToSlot = async (slot: any) => {
        if (!driverId) {
            toastError("Erro: ID do entregador não encontrado.");
            return;
        }

        setApplyingSlotId(slot.id);
        
        try {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
            
            const payload = {
                slot_id: slot.id,
                driver_id: driverId,
                status: 'pending',
                merchant_id: slot.merchant_id
            };

            const response = await fetch(\`\${supabaseUrl}/rest/v1/slot_applications\`, {
                method: 'POST',
                headers: {
                    'apikey': supabaseKey,
                    'Authorization': \`Bearer \${supabaseKey}\`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Supabase API Error:", errorData);
                throw new Error(errorData.message || 'Erro ao enviar candidatura');
            }

            console.log("Candidatura enviada via REST!");
            setShowSlotAppliedSuccess(true);
            
            // Recarrega as vagas para atualizar a lista
            await fetchFromDB('slot_applications');
            
        } catch (err: any) {
            console.error('Erro detalhado:', err);
            toastError('Falha ao registrar candidatura. ' + (err.message || ''));
        } finally {
            setApplyingSlotId(null);
        }
    };\n\n`;

    // Inject before renderBottomNavigation
    content = content.replace('const renderBottomNavigation = () => {', fnCode + '    const renderBottomNavigation = () => {');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log("Injected handleApplyToSlot!");
} else {
    console.log("Already exists.");
}
