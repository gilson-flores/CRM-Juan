#!/bin/bash
sed -i '/{\/\* MODAL: CONFIRMAÇÃO DE EXCLUSÃO DE CLIENTE \*\//,/<\/Portal>/c\
      {/* MODAL: CONFIRMAÇÃO DE EXCLUSÃO DE CLIENTE */}\
      {clientToDelete && (\
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">\
          <div className="bg-[#141418] border-t-4 border-t-red-600 border-x border-b border-[#292930] rounded-2xl w-full max-w-md p-6 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col gap-5">\
            <div className="flex flex-col items-center text-center gap-1">\
              <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shrink-0 mb-2">\
                <AlertTriangle size={28} />\
              </div>\
              <h3 className="text-base font-black text-white uppercase tracking-wider">Excluir Cliente</h3>\
              <p className="text-[11px] font-bold text-zinc-400">Esta ação é irreversível e removerá o registro permanentemente.</p>\
            </div>\
\
            <div className="bg-[#080808] p-4 rounded-xl border border-[#242429] text-xs space-y-2 w-full">\
              <div className="flex items-center justify-between">\
                <span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Nome:</span>\
                <span className="font-bold text-white text-sm truncate max-w-[220px]">{clientToDelete.name}</span>\
              </div>\
              <div className="flex items-center justify-between">\
                <span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Documento:</span>\
                <span className="font-mono font-bold text-zinc-200 text-sm uppercase">{clientToDelete.type}: {clientToDelete.doc}</span>\
              </div>\
              <div className="flex items-center justify-between">\
                <span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Telefone:</span>\
                <span className="font-mono font-bold text-zinc-300 text-sm">{clientToDelete.phone}</span>\
              </div>\
            </div>\
\
            <div className="flex items-center gap-3 pt-2 w-full">\
              <button\
                type="button"\
                onClick={() => setClientToDelete(null)}\
                disabled={isDeleting}\
                className="flex-1 py-3 text-xs font-bold text-zinc-300 hover:text-white bg-[#1e1e26] hover:bg-[#282834] rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 border border-[#2c2c35]"\
              >\
                Cancelar\
              </button>\
              <button\
                type="button"\
                onClick={handleConfirmDeleteClient}\
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
      </Portal>\
' app/clientes/page.tsx
