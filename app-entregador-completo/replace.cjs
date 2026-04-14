const fs = require('fs');

const filePath = 'c:/Users/swami/.gemini/antigravity/scratch/izidelivery/app-entregador-completo/src/App.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const newMethod = `    const handleApplyToSlot = async (slot: any) => {
        if (!driverId || !isAuthenticated || applyingSlotId) {
            console.log('[SLOT] Candidatura bloqueada:', { driverId, isAuthenticated, applyingSlotId });
            return;
        }
        console.log('[SLOT] Iniciando via REST API...');
        setApplyingSlotId(slot.id);
        
        try {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
            
            const reqBody = {
                slot_id: slot.id,
                driver_id: driverId,
                merchant_id: slot.merchant_id || null,
                status: 'pending'
            };

            const response = await fetch(\`\${supabaseUrl}/rest/v1/slot_applications\`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': supabaseKey,
                    'Authorization': \`Bearer \${supabaseKey}\`,
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify(reqBody)
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                console.error('[SLOT] Erro na API:', errData);
                if (errData.code === '23505') {
                    toastError('Você já se candidatou!');
                } else {
                    throw new Error(errData.message || \`HTTP \${response.status}\`);
                }
            } else {
                toastSuccess('Candidatura enviada!');
                setShowSlotAppliedSuccess(true);
                
                const getApps = await fetch(\`\${supabaseUrl}/rest/v1/slot_applications?driver_id=eq.\${driverId}\`, {
                    headers: { 'apikey': supabaseKey, 'Authorization': \`Bearer \${supabaseKey}\` }
                });
                if (getApps.ok) {
                    const data = await getApps.json();
                    setMyApplications(data || []);
                }
            }
        } catch (err: any) {
            console.error('[SLOT] Catch erro:', err);
            toastError('Erro: ' + (err.message || 'Verifique sua conexão.'));
        } finally {
            setApplyingSlotId(null);
        }
    };`;

content = content.replace(/    const handleApplyToSlot = async \(slot: any\) => \{[\s\S]*?    \};(?=\s*const \[confirmPaymentState)/, newMethod);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Substituido com sucesso usando Node!');
