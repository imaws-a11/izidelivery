const fs = require('fs');
const path = 'C:\\Users\\swami\\.gemini\\antigravity\\scratch\\izidelivery\\app-servicos-completo\\src\\App.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add states for QR
if (!content.includes('isShowingMyQR')) {
    content = content.replace(
        /const \[isAddingCard, setIsAddingCard\] = useState\(false\);/,
        'const [isAddingCard, setIsAddingCard] = useState(false);\n  const [isShowingMyQR, setIsShowingMyQR] = useState(false);\n  const [isScanningQR, setIsScanningQR] = useState(false);\n  const [transferTarget, setTransferTarget] = useState<any>(null);'
    );
}

// 2. Add QR Modal rendering functions before renderWallet
const qrModals = `
  const renderMyQRModal = () => (
    <AnimatePresence>
      {isShowingMyQR && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
            className="w-full max-w-sm bg-zinc-900 border border-white/5 rounded-[45px] p-10 flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
            <div className="absolute -top-24 -right-24 size-48 bg-yellow-400/10 rounded-full blur-[80px]" />
            <div className="absolute -bottom-24 -left-24 size-48 bg-yellow-400/5 rounded-full blur-[80px]" />
            
            <button onClick={() => setIsShowingMyQR(false)} className="absolute top-6 right-6 size-10 rounded-full bg-white/5 flex items-center justify-center active:scale-90 transition-all">
              <span className="material-symbols-outlined text-zinc-500">close</span>
            </button>

            <div className="size-20 rounded-[28px] bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center mb-8">
              <span className="material-symbols-outlined text-4xl text-yellow-400">qr_code_2</span>
            </div>
            
            <h3 className="text-2xl font-black text-white tracking-tight mb-2 uppercase">Meu IZI Code</h3>
            <p className="text-zinc-500 text-xs font-medium mb-10 leading-relaxed px-4">Compartilhe para receber transferências instantâneas de IZI Coins.</p>

            <div className="p-6 bg-white rounded-[40px] shadow-inner mb-10 relative group">
              <img 
                src={\`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=izi:transfer:\${userId}:\${loginEmail}:\${phone}\`} 
                alt="QR Code" 
                className="size-56 object-contain"
              />
              <div className="absolute inset-0 border-[12px] border-white rounded-[40px] pointer-events-none" />
            </div>

            <div className="space-y-1">
              <p className="font-black text-white text-base tracking-tight">{userName}</p>
              <p className="text-zinc-600 font-bold text-[10px] uppercase tracking-widest">{loginEmail}</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const renderScanQRModal = () => (
    <AnimatePresence>
      {isScanningQR && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center">
          
          <div className="absolute top-10 left-6 right-6 flex items-center justify-between z-10">
            <button onClick={() => setIsScanningQR(false)} className="size-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white">
              <span className="material-symbols-outlined">close</span>
            </button>
            <h3 className="text-white font-black uppercase tracking-widest text-[10px]">Escanear IZI Code</h3>
            <div className="size-12" />
          </div>

          <div id="reader" className="w-[85vw] h-[85vw] max-w-sm max-h-[400px] border-4 border-yellow-400/30 rounded-[40px] overflow-hidden relative shadow-[0_0_80px_rgba(255,184,0,0.1)]">
            <div className="absolute inset-0 border-2 border-yellow-400/10 rounded-[40px] pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-48 border-2 border-white/20 border-dashed rounded-3xl animate-pulse" />
          </div>

          <p className="mt-12 text-zinc-500 font-bold text-xs animate-pulse">Aponte para o QR Code de um amigo</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
`;

if (!content.includes('renderMyQRModal')) {
    content = content.replace(
        /const renderWallet = \(\) => {/,
        qrModals + '\n  const renderWallet = () => {'
    );
}

// 3. Update buttons in renderWallet to trigger modals
content = content.replace(
    /{ icon: "qr_code_2",\s+label: "Meu QR" }/,
    '{ icon: "qr_code_2", label: "Meu QR", action: () => setIsShowingMyQR(true) }'
);
content = content.replace(
    /{ icon: "arrow_outward", label: "Transferir" }/,
    '{ icon: "arrow_outward", label: "Transferir", action: () => setIsScanningQR(true) }'
);

// Fix button onClick application in renderWallet mapping
content = content.replace(
    /<button key={a\.icon} className="flex flex-col items-center gap-2 py-4 active:scale-95 transition-all group">/,
    '<button key={a.icon} onClick={(a as any).action} className="flex flex-col items-center gap-2 py-4 active:scale-95 transition-all group">'
);

// 4. Update the main return to include modals
content = content.replace(
    /{tab === "wallet" && renderWallet\(\)}/,
    '{tab === "wallet" && renderWallet()}\n              {renderMyQRModal()}\n              {renderScanQRModal()}'
);

fs.writeFileSync(path, content);
console.log('App.tsx updated for Wallet QR features');
