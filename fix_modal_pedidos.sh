#!/bin/bash
sed -i '/{\/\* MODAL: CONFIRMAÇÃO DE EXCLUSÃO DE ORDEM DE SERVIÇO \*\//,/<\/Portal>/c\
      {/* MODAL: CONFIRMAÇÃO DE EXCLUSÃO DE ORDEM DE SERVIÇO */}\
      {orderToDelete && (\
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">\
          <div className="bg-[#141418] border-t-4 border-t-red-600 border-x border-b border-[#292930] rounded-2xl w-full max-w-md p-6 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col gap-5">\
            <div className="flex flex-col items-center text-center gap-1">\
              <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shrink-0 mb-2">\
                <AlertTriangle size={28} />\
              </div>\
              <h3 className="text-base font-black text-white uppercase tracking-wider">Excluir Ordem de Serviço</h3>\
              <p className="text-[11px] font-bold text-zinc-400">Esta ação é irreversível e removerá o registro permanentemente.</p>\
            </div>\
\
            <div className="bg-[#080808] p-4 rounded-xl border border-[#242429] text-xs space-y-2 w-full">\
              <div className="flex items-center justify-between">\
                <span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Número da O.S.:</span>\
                <span className="font-mono font-bold text-white text-sm">#{orderToDelete.quoteNumber}</span>\
              </div>\
              <div className="flex items-center justify-between">\
                <span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Cliente:</span>\
                <span className="font-bold text-zinc-200 truncate max-w-[200px]">{orderToDelete.clientName}</span>\
              </div>\
              <div className="flex items-center justify-between">\
                <span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Valor Total:</span>\
                <span className="font-mono font-bold text-[#FF7A00] text-sm">R$ {formatCurrency(orderToDelete.total)}</span>\
              </div>\
            </div>\
\
            <div className="flex items-center gap-3 pt-2 w-full">\
              <button\
                type="button"\
                onClick={() => setOrderToDelete(null)}\
                disabled={isDeleting}\
                className="flex-1 py-3 text-xs font-bold text-zinc-300 hover:text-white bg-[#1e1e26] hover:bg-[#282834] rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 border border-[#2c2c35]"\
              >\
                Cancelar\
              </button>\
              <button\
                type="button"\
                onClick={handleConfirmDeleteOrder}\
                disabled={isDeleting}\
                className="flex-1 py-3 text-xs font-black text-white bg-red-600 hover:bg-red-500 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 active:scale-[0.98] disabled:opacity-50"\
              >\
                <Trash2 size={15} />\
                {isDeleting ? "Excluindo..." : "Excluir Definitivamente"}\
              </button>\
            </div>\
          </div>\
        </div>\
      )}\
      {/* MODAL: CATÁLOGO DE SERVIÇOS/MATERIAIS (O.S) */}\
      {isCatalogModalOpen && (\
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">\
          <div className="bg-[#141418] border border-[#292930] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">\
            <div className="flex justify-between items-center p-5 border-b border-[#242429]">\
              <div className="flex items-center gap-2 text-white font-bold text-sm">\
                <BookOpen size={18} className="text-[#FF7A00]" />\
                <span>Serviços e Materiais Salvos</span>\
              </div>\
              <button\
                onClick={() => setIsCatalogModalOpen(false)}\
                className="text-zinc-400 hover:text-white p-1 rounded-lg transition-colors"\
              >\
                <X size={20} />\
              </button>\
            </div>\
            <div className="p-4 border-b border-[#242429] bg-[#0e0e11]">\
              <div className="relative">\
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />\
                <input\
                  type="text"\
                  placeholder="Pesquisar serviço (ex: tomada, disjuntor, chuveiro)..."\
                  value={catalogSearch}\
                  onChange={(e) => setCatalogSearch(e.target.value)}\
                  className="w-full bg-[#141418] border border-[#28282e] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF7A00]"\
                  autoFocus\
                />\
              </div>\
            </div>\
            <div className="p-4 max-h-[50vh] overflow-y-auto space-y-2">\
              {filteredCatalog.length > 0 ? (\
                filteredCatalog.map(item => (\
                  <div\
                    key={item.id}\
                    onClick={() => handleSelectFromCatalogForDirect(item)}\
                    className="p-3 bg-[#0e0e11] hover:bg-[#181820] border border-[#242429] hover:border-[#FF7A00]/50 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 group"\
                  >\
                    <div>\
                      <div className="flex items-center gap-2">\
                        <span className="text-xs font-bold text-white group-hover:text-[#FF7A00] transition-colors">{item.name}</span>\
                        <span className="px-2 py-0.5 bg-[#1f1f28] text-zinc-400 text-[10px] rounded font-medium">\
                          {item.category}\
                        </span>\
                      </div>\
                      {item.description && (\
                        <p className="text-[11px] text-zinc-400 mt-0.5">{item.description}</p>\
                      )}\
                    </div>\
                    <div className="text-right shrink-0">\
                      <div className="text-xs font-bold text-[#FF7A00] font-mono">\
                        R$ {formatCurrency(item.unitPrice)}\
                      </div>\
                    </div>\
                  </div>\
                ))\
              ) : (\
                <div className="text-center py-10">\
                  <p className="text-zinc-500 text-xs mb-3">Nenhum serviço/material encontrado no catálogo.</p>\
                  <a href="/configuracoes" className="px-4 py-2 bg-[#181820] hover:bg-[#202028] text-white text-xs font-bold rounded-lg transition-colors border border-[#27272a] inline-block">\
                    Cadastrar Novo Item no Catálogo\
                  </a>\
                </div>\
              )}\
            </div>\
          </div>\
        </div>\
      )}\
      </Portal>\
' app/pedidos/page.tsx
