import fs from 'fs';

const filePath = 'app-servicos-completo/src/App.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// ---- DIAGNÓSTICO ----
// O bloco entre fetchSavedAddresses e fetchWalletBalance ficou corrompido.
// Precisamos substituir o trecho problemático do useRef até o useEffect de abertura

const BROKEN_START = `  const addressAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(`;
const BROKEN_END_MARKER = `  const fetchWalletBalance = async (uid: string) => {`;

const startIdx = content.indexOf(BROKEN_START);
const endIdx   = content.indexOf(BROKEN_END_MARKER);

if (startIdx === -1) { console.error('BROKEN_START não encontrado!'); process.exit(1); }
if (endIdx   === -1) { console.error('BROKEN_END_MARKER não encontrado!'); process.exit(1); }

console.log(`Substituindo linhas de char ${startIdx} a ${endIdx}`);
console.log('Trecho removido:');
console.log(content.substring(startIdx, endIdx));

const REPLACEMENT = `  const addressAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(
    null,
  );
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddrLabel, setNewAddrLabel] = useState('');
  const [newAddrStreet, setNewAddrStreet] = useState('');
  const [newAddrDetails, setNewAddrDetails] = useState('');
  const [newAddrCity, setNewAddrCity] = useState('');
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  const resetAddressForm = () => {
    setNewAddrLabel(''); setNewAddrStreet(''); setNewAddrDetails(''); setNewAddrCity('');
    setEditingAddress(null); setIsAddingAddress(false);
  };

  const openEditAddress = (addr: SavedAddress) => {
    setEditingAddress(addr);
    setNewAddrLabel(addr.label || '');
    setNewAddrStreet(addr.street || '');
    setNewAddrDetails(addr.details || '');
    setNewAddrCity(addr.city || '');
    setIsAddingAddress(true);
  };

  const handleSaveAddress = async () => {
    if (!userId) return;
    if (!newAddrLabel.trim() || !newAddrStreet.trim()) {
      toastError('Preencha pelo menos o rótulo e a rua.');
      return;
    }
    setIsSavingAddress(true);
    try {
      if (editingAddress) {
        const { error } = await supabase.from('saved_addresses').update({
          label: newAddrLabel.trim(),
          street: newAddrStreet.trim(),
          details: newAddrDetails.trim() || null,
          city: newAddrCity.trim() || null,
        }).eq('id', editingAddress.id);
        if (error) throw error;
        toastSuccess('Endereço atualizado!');
      } else {
        const { error } = await supabase.from('saved_addresses').insert({
          user_id: userId,
          label: newAddrLabel.trim(),
          street: newAddrStreet.trim(),
          details: newAddrDetails.trim() || null,
          city: newAddrCity.trim() || null,
          is_active: savedAddresses.length === 0,
        });
        if (error) throw error;
        toastSuccess('Endereço salvo com sucesso!');
      }
      resetAddressForm();
      fetchSavedAddresses(userId);
    } catch (e) {
      toastError('Erro ao salvar: ' + e.message);
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (addrId) => {
    if (!userId) return;
    try {
      const { error } = await supabase.from('saved_addresses').delete().eq('id', addrId);
      if (error) throw error;
      toastSuccess('Endereço removido.');
      fetchSavedAddresses(userId);
    } catch (e) {
      toastError('Erro ao remover: ' + e.message);
    }
  };

  const handleSetActiveAddress = async (addrId) => {
    if (!userId) return;
    try {
      await supabase.from('saved_addresses').update({ is_active: false }).eq('user_id', userId);
      const { error } = await supabase.from('saved_addresses').update({ is_active: true }).eq('id', addrId);
      if (error) throw error;
      toastSuccess('Endereço padrão atualizado!');
      fetchSavedAddresses(userId);
    } catch (e) {
      toastError('Erro ao definir endereço: ' + e.message);
    }
  };

  useEffect(() => {
    fetchMarketData();
    fetchFlashOffers();
    fetchGlobalSettings();
    fetchBeveragePromo();
    const interval = setInterval(fetchMarketData, 20000);
    const flashChannel = supabase.channel('flash_offers_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'flash_offers' }, fetchFlashOffers)
      .subscribe();
    return () => {
      clearInterval(interval);
      supabase.removeChannel(flashChannel);
    };
  }, []);

  `;

const newContent = content.substring(0, startIdx) + REPLACEMENT + content.substring(endIdx);

// Verificar que fetchWalletBalance ainda está presente
if (!newContent.includes('const fetchWalletBalance')) {
  console.error('ERRO: fetchWalletBalance desapareceu!');
  process.exit(1);
}

fs.writeFileSync(filePath, newContent, 'utf8');
console.log('✅ Arquivo corrigido com sucesso!');
console.log('Total de chars:', newContent.length);
