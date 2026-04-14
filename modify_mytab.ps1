
$path = "c:\Users\swami\.gemini\antigravity\scratch\izidelivery\app-admin-completo\src\components\MyStudioTab.tsx"
$content = Get-Content $path -Raw

$oldBlock = @"
                        <div className="flex flex-wrap gap-2">
                          {['Pizza', 'Hambúrguer', 'Comida Japonesa', 'Brasileira', 'Saudável', 'Açaí', 'Bebidas', 'Doces & Bolos', 'Mercado', 'Farmácia'].map(tag => (
                            <button
                              key={tag}
                              onClick={() => {
                                const current = targetItem.metadata?.specialties || [];
                                const newTags = current.includes(tag) ? current.filter((t: string) => t !== tag) : [...current, tag];
                                updateItem({...targetItem, metadata: {...targetItem.metadata, specialties: newTags}});
                              }}
                              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                                (targetItem.metadata?.specialties || []).includes(tag)
                                  ? 'bg-primary border-primary text-slate-950 shadow-lg shadow-primary/20'
                                  : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10'
                              }`}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
"@

$newBlock = @"
                        <div className="flex flex-wrap gap-2">
                          {['Pizza', 'Hambúrguer', 'Comida Japonesa', 'Brasileira', 'Saudável', 'Açaí', 'Bebidas', 'Doces & Bolos', 'Mercado', 'Farmácia'].map(tag => (
                            <button
                              key={tag}
                              onClick={() => {
                                const current = targetItem.metadata?.specialties || [];
                                const newTags = current.includes(tag) ? current.filter((t: string) => t !== tag) : [...current, tag];
                                updateItem({...targetItem, metadata: {...targetItem.metadata, specialties: newTags}});
                              }}
                              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                                (targetItem.metadata?.specialties || []).includes(tag)
                                  ? 'bg-primary border-primary text-slate-950 shadow-lg shadow-primary/20'
                                  : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10'
                              }`}
                            >
                              {tag}
                            </button>
                          ))}
                          
                          {(targetItem.metadata?.specialties || []).filter((t: string) => !['Pizza', 'Hambúrguer', 'Comida Japonesa', 'Brasileira', 'Saudável', 'Açaí', 'Bebidas', 'Doces & Bolos', 'Mercado', 'Farmácia'].includes(t)).map(tag => (
                             <button
                               key={tag}
                               onClick={() => {
                                 const current = targetItem.metadata?.specialties || [];
                                 const newTags = current.filter((t2: string) => t2 !== tag);
                                 updateItem({...targetItem, metadata: {...targetItem.metadata, specialties: newTags}});
                               }}
                               className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border bg-primary border-primary text-slate-950 shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
                             >
                               {tag}
                               <span className="material-symbols-outlined text-[10px]">close</span>
                             </button>
                          ))}

                          <div className="flex items-center gap-2 ml-2">
                            <input 
                               type="text"
                               value={newSpecialtyTag}
                               onChange={e => setNewSpecialtyTag(e.target.value)}
                               onKeyDown={e => {
                                 if (e.key === 'Enter' && newSpecialtyTag.trim()) {
                                   const current = targetItem.metadata?.specialties || [];
                                   if (!current.includes(newSpecialtyTag.trim())) {
                                     updateItem({...targetItem, metadata: {...targetItem.metadata, specialties: [...current, newSpecialtyTag.trim()]}});
                                   }
                                   setNewSpecialtyTag('');
                                 }
                               }}
                               placeholder="+ Adicionar Tag"
                               className="bg-transparent border-b border-slate-700 text-[10px] font-black uppercase tracking-widest text-white outline-none w-24 px-1 focus:border-primary transition-all"
                            />
                          </div>
                        </div>
"@

$content = $content.Replace($oldBlock, $newBlock)
[System.IO.File]::WriteAllText($path, $content)
"Done"
