#!/bin/bash
sed -i '/{\/\* Tabela de Itens \/ Serviços \*\//,/{\/\* Condições, Pagamento e Totais \*\//c\
              {/* Tabela de Itens / Serviços */}\
              <div className="space-y-3">\
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">\
                  <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">\
                    <FileText size={13} className="text-[#FF7A00]" /> Itens da O.S. ({directItems.length})\
                  </span>\
                  <button\
                    type="button"\
                    onClick={() => setIsCatalogModalOpen(true)}\
                    className="self-start sm:self-auto bg-[#18181c] hover:bg-[#242429] border border-[#FF7A00]/40 text-[#FF7A00] text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all"\
                  >\
                    <BookOpen size={14} />\
                    Tabela de Serviços Cadastrados\
                  </button>\
                </div>\
\
                <div className="bg-[#0a0a0d] rounded-xl border border-[#24242e] overflow-x-auto">\
                  <table className="w-full text-left border-collapse min-w-[620px]">\
                    <thead>\
                      <tr className="bg-[#141418] border-b border-[#24242e] text-zinc-400 text-[11px] font-semibold uppercase tracking-wider">\
                        <th className="p-3 w-16">ID</th>\
                        <th className="p-3">Descrição do Serviço / Material</th>\
                        <th className="p-3 w-20 text-center">Qtd</th>\
                        <th className="p-3 w-28 text-right">V. Unitário</th>\
                        <th className="p-3 w-28 text-right">Total</th>\
                        <th className="p-3 w-10 text-center">Ação</th>\
                      </tr>\
                    </thead>\
                    <tbody className="divide-y divide-[#24242e]">\
                      {directItems.map((item, index) => (\
                        <tr key={item.id} className="hover:bg-[#141418] transition-colors group">\
                          <td className="p-3 font-mono text-[10px] text-zinc-500 font-bold">{item.id || index + 1}</td>\
                          <td className="p-3 text-xs text-white font-medium">{item.description}</td>\
                          <td className="p-3 text-xs text-white text-center font-mono">{item.quantity}</td>\
                          <td className="p-3 text-xs text-white text-right font-mono">R$ {formatCurrency(item.unitPrice)}</td>\
                          <td className="p-3 text-xs text-[#FF7A00] font-bold text-right font-mono">R$ {formatCurrency((item.quantity || 1) * (item.unitPrice || 0))}</td>\
                          <td className="p-3 text-center">\
                            <button \
                              onClick={() => handleRemoveDirectItem(index)} \
                              className="text-zinc-500 hover:text-red-400 transition-colors p-1"\
                              title="Remover Item"\
                            >\
                              <Trash2 size={16} />\
                            </button>\
                          </td>\
                        </tr>\
                      ))}\
                      \
                      {/* New Item Input Row */}\
                      <tr className="bg-[#141418]/50">\
                        <td className="p-2 text-[10px] text-zinc-500 text-center font-bold font-mono">NOVO</td>\
                        <td className="p-2 relative flex items-center">\
                          <input \
                            type="text" \
                            placeholder="Digite o serviço..." \
                            className="w-full bg-[#0a0a0d] border border-[#27272a] focus:border-[#FF7A00] rounded-lg pl-3 pr-10 py-2 text-white text-xs outline-none"\
                            value={newDirectItem.description}\
                            onChange={(e) => setNewDirectItem({...newDirectItem, description: e.target.value})}\
                            onKeyDown={(e) => {\
                              if (e.key === "Enter") handleAddDirectItem();\
                            }}\
                          />\
                          <button \
                            onClick={() => setIsCatalogModalOpen(true)}\
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-[#FF7A00] transition-colors p-1"\
                            title="Buscar em itens salvos"\
                          >\
                            <Search size={16} />\
                          </button>\
                        </td>\
                        <td className="p-2">\
                          <input \
                            type="number" \
                            min="1"\
                            className="w-full bg-[#0a0a0d] border border-[#27272a] focus:border-[#FF7A00] rounded-lg px-2 py-2 text-white text-xs outline-none text-center font-mono"\
                            value={newDirectItem.quantity}\
                            onChange={(e) => setNewDirectItem({...newDirectItem, quantity: Number(e.target.value) || 1})}\
                          />\
                        </td>\
                        <td className="p-2">\
                          <input \
                            type="number" \
                            step="0.01"\
                            min="0"\
                            placeholder="0.00"\
                            className="w-full bg-[#0a0a0d] border border-[#27272a] focus:border-[#FF7A00] rounded-lg px-2 py-2 text-white text-xs outline-none text-right font-mono"\
                            value={newDirectItem.unitPrice || ""}\
                            onChange={(e) => setNewDirectItem({...newDirectItem, unitPrice: Number(e.target.value) || 0})}\
                          />\
                        </td>\
                        <td className="p-2 text-right text-xs font-bold text-zinc-400 font-mono px-3 py-2">\
                          R$ {formatCurrency((newDirectItem.quantity || 1) * (newDirectItem.unitPrice || 0))}\
                        </td>\
                        <td className="p-2 text-center">\
                          <button \
                            onClick={handleAddDirectItem} \
                            disabled={!newDirectItem.description.trim()} \
                            className="text-[#FF7A00] hover:text-[#FFA845] transition-colors disabled:opacity-30 p-1"\
                            title="Adicionar Item"\
                          >\
                            <PlusCircle size={22} />\
                          </button>\
                        </td>\
                      </tr>\
                    </tbody>\
                  </table>\
                </div>\
              </div>\
\
              {/* Condições, Pagamento e Totais */}\
' app/pedidos/page.tsx
