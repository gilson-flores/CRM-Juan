const fs = require('fs');
let code = fs.readFileSync('app/orcamentos/page.tsx', 'utf8');

// Replace top header button
code = code.replace(
  /{isSyncing \? <Cloud size={15} className="animate-pulse" \/> : <Save size={15} \/>}\s*{isSyncing \? 'Salvando\.\.\.' : 'Salvar Rascunho'}\s*<\/button>\s*\{\/\* Gerar PDF \/ Imprimir \(Android & iOS\) \*\/}\s*<button\s*type="button"\s*onClick={handleGeneratePdf}\s*className="flex items-center justify-center gap-1\.5 bg-\[#FF7A00\] hover:bg-\[#FF8A00\] text-black px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-colors shadow-lg shadow-\[#FF7A00\]\/20"\s*>\s*<FileDown size={16} \/>\s*Baixar \/ Imprimir PDF\s*<\/button>/g,
  `{isSyncing ? <Cloud size={15} className="animate-pulse" /> : <Save size={15} />}\n            {isSyncing ? 'Salvando...' : 'Salvar Rascunho'}\n          </button>\n          \n          {/* Novo Orçamento */}\n          <button \n            type="button"\n            onClick={() => {\n              setQuoteNumber(\`2026-\${Math.floor(1000 + Math.random() * 9000)}\`);\n              setSelectedClient('');\n              setAddress('');\n              setItems([]);\n              setDiscount(0);\n            }}\n            className="flex items-center justify-center gap-1.5 bg-[#FF7A00] hover:bg-[#FF8A00] text-black px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-colors shadow-lg shadow-[#FF7A00]/20"\n          >\n            <PlusCircle size={16} />\n            + Orçamento\n          </button>`
);

// Remove the Restaurar Rascunho button
code = code.replace(
  /\{\/\* Restaurar Rascunho \*\/\}\s*<button\s*type="button"\s*onClick=\{\(\) => setIsDraftsModalOpen\(true\)\}\s*className="flex items-center justify-center gap-1\.5 bg-\[#18181c\] hover:bg-\[#242429\] border border-zinc-700 text-zinc-300 hover:text-white px-3\.5 py-2 rounded-lg text-xs font-bold transition-colors"\s*>\s*<History size=\{15\} className="text-\[#FF7A00\]" \/>\s*Restaurar Rascunho \(\{savedDrafts\.length\}\)\s*<\/button>\s*\{\/\* Salvar Rascunho \*\/\}/g,
  `{/* Salvar Rascunho */}`
);

// We need to insert the Rascunhos section before the Client Details Card
const rascunhosSection = `
          {/* Rascunhos Salvos Area */}
          {savedDrafts.length > 0 && (
            <section className="bg-surface-container rounded border border-outline-variant p-4">
              <h2 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
                <History className="text-[#FF7A00]" size={18} />
                Meus Rascunhos Salvos
              </h2>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                {savedDrafts.map(draft => (
                  <div key={draft.id} className="min-w-[260px] p-3 bg-[#0e0e11] border border-[#242429] hover:border-[#FF7A00]/50 rounded-xl flex flex-col gap-2 shrink-0 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-bold text-white truncate max-w-[150px]">{draft.clientName}</h4>
                        <span className="text-[10px] text-zinc-500 font-mono">#{draft.quoteNumber}</span>
                      </div>
                      <span className="text-xs font-bold text-[#FF7A00] font-mono">R$ {formatCurrency(draft.total)}</span>
                    </div>
                    <div className="text-[10px] text-zinc-400 truncate">
                      {draft.items?.length || 0} itens • {draft.savedAt}
                    </div>
                    <div className="flex items-center gap-2 mt-1 border-t border-[#242429] pt-2">
                      <button onClick={() => handleRestoreDraft(draft)} className="flex-1 bg-[#18181c] hover:bg-[#242429] text-zinc-300 text-[10px] font-bold py-1.5 rounded transition-colors">
                        Resgatar
                      </button>
                      <button onClick={(e) => handleDeleteDraft(e, draft.id)} className="px-2 text-zinc-500 hover:text-red-400 hover:bg-[#242429] py-1.5 rounded transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Client Details Card */}
`;

code = code.replace(
  /\{\/\* Client Details Card \*\/\}/g,
  rascunhosSection
);

// We need to modify handleGeneratePdf to update the status to "enviado"
const generatePdfFn = `const handleGeneratePdf = async () => {
    if (!selectedClient && items.length === 0) {
      alert('Adicione pelo menos um item ao orçamento antes de gerar o PDF.');
      return;
    }

    const clientData = clients.find(c => c.name === selectedClient);

    await generateQuotePdf({
      quoteNumber,
      date: new Date().toLocaleDateString('pt-BR'),
      clientName: selectedClient || 'Cliente',
      clientDoc: clientData?.doc,
      clientPhone: clientData?.phone,
      clientEmail: clientData?.email,
      address: address || clientData?.address || '',
      items,
      subtotal,
      discount,
      total,
      observations
    });

    // Update status to enviado
    const now = new Date();
    const dateFormatted = now.toLocaleDateString('pt-BR');
    const timeFormatted = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const existingDraftIndex = savedDrafts.findIndex(d => d.quoteNumber === quoteNumber);
    let updatedDrafts = [...savedDrafts];
    
    if (existingDraftIndex >= 0) {
      updatedDrafts[existingDraftIndex] = { ...updatedDrafts[existingDraftIndex], status: 'enviado' };
    } else {
      updatedDrafts = [{
        id: generateItemId('DRAFT'),
        quoteNumber,
        clientName: selectedClient || 'Cliente',
        address,
        items,
        discount,
        observations,
        total,
        date: dateFormatted,
        savedAt: \`\${dateFormatted} às \${timeFormatted}\`,
        status: 'enviado'
      }, ...savedDrafts];
    }
    setSavedDrafts(updatedDrafts);
    localStorage.setItem('@jc-eletricista:saved_drafts_v2', JSON.stringify(updatedDrafts));

    showNotification('PDF gerado com sucesso! Arquivo pronto para impressão ou WhatsApp.');
  };`;

code = code.replace(
  /const handleGeneratePdf = async \(\) => \{[\s\S]*?showNotification\('PDF gerado com sucesso! Arquivo pronto para impressão ou WhatsApp\.'\);\s*\};/g,
  generatePdfFn
);


fs.writeFileSync('app/orcamentos/page.tsx', code);
console.log('updated page.tsx');
