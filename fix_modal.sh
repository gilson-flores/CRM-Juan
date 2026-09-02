#!/bin/bash
sed -i '/<\/Portal>/i\
      {/* MODAL: CATÁLOGO DE SERVIÇOS/MATERIAIS (O.S) */}\
      {isCatalogModalOpen && (\
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">\
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
' app/pedidos/page.tsx
