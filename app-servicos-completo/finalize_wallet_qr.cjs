const fs = require('fs');
const path = 'C:\\Users\\swami\\.gemini\\antigravity\\scratch\\izidelivery\\app-servicos-completo\\src\\App.tsx';
let content = fs.readFileSync(path, 'utf8');

// Add Scanner initialization logic
const scannerEffect = `
  useEffect(() => {
    let html5QrCode: any = null;
    if (isScanningQR) {
      setTimeout(() => {
        const reader = document.getElementById('reader');
        if (reader && typeof (window as any).Html5Qrcode !== 'undefined') {
          html5QrCode = new (window as any).Html5Qrcode("reader");
          html5QrCode.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            (decodedText: string) => {
              if (decodedText.startsWith("izi:transfer:")) {
                const parts = decodedText.split(":");
                const targetId = parts[2];
                const targetEmail = parts[3];
                const targetPhone = parts[4];
                setTransferTarget({ id: targetId, email: targetEmail, phone: targetPhone });
                setIsScanningQR(false);
                html5QrCode.stop();
                toastSuccess("Usuário Identificado!");
              }
            },
            () => {}
          ).catch((e: any) => console.error(e));
        }
      }, 500);
    }
    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch((e: any) => console.error(e));
      }
    };
  }, [isScanningQR]);\n\n`;

if (!content.includes('new (window as any).Html5Qrcode("reader")')) {
    content = content.replace(
        /\/\/ Fetch payment methods when entering payments screen/,
        scannerEffect + '// Fetch payment methods when entering payments screen'
    );
}

// Add the Transfer Confirmation Modal if target selected
const transferModal = `
  const renderTransferModal = () => (
    <AnimatePresence>
      {transferTarget && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[250] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
            className="w-full max-w-sm bg-zinc-900 border border-white/5 rounded-[50px] p-8 text-center space-y-8 relative">
            
            <button onClick={() => setTransferTarget(null)} className="absolute top-6 right-6 size-10 rounded-full bg-white/5 flex items-center justify-center active:scale-90 transition-all">
              <span className="material-symbols-outlined text-zinc-500">close</span>
            </button>

            <div className="size-24 rounded-full bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center mx-auto mb-2">
              <img src={\`https://api.dicebear.com/7.x/avataaars/svg?seed=\${transferTarget.email}\`} className="size-full rounded-full" />
            </div>

            <div className="space-y-1">
              <p className="font-black text-2xl text-white tracking-tight">Transferir IZI Coins</p>
              <p className="text-emerald-400 font-bold text-xs uppercase tracking-widest leading-none mb-1">Para: {transferTarget.email}</p>
              <p className="text-zinc-600 font-bold text-[9px] uppercase tracking-widest">{transferTarget.phone || "Sem telefone"}</p>
            </div>

            <div className="bg-zinc-950 p-6 rounded-[35px] border border-white/5">
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-4">Valor da Transferência</p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl font-black text-yellow-400 opacity-40 italic">IZI</span>
                <input 
                  type="number" 
                  placeholder="0,00"
                  className="bg-transparent border-none text-4xl font-black text-white text-center w-full focus:ring-0 placeholder:text-zinc-800"
                />
              </div>
            </div>

            <button className="w-full bg-yellow-400 text-black font-black text-sm uppercase tracking-widest py-6 rounded-3xl shadow-xl shadow-yellow-400/20 active:scale-95 transition-all">
              Confirmar Envio Instantâneo
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
`;

if (!content.includes('renderTransferModal')) {
    content = content.replace(
        /const renderScanQRModal = \(\) => \(/,
        transferModal + '\n  const renderScanQRModal = () => ('
    );
}

// Update return inclusion
content = content.replace(
    /{renderScanQRModal\(\)}/,
    '{renderScanQRModal()}\n              {renderTransferModal()}'
);

fs.writeFileSync(path, content);
console.log('App.tsx finalized for Wallet QR Scanning');
