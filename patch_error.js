const fs = require('fs');
let code = fs.readFileSync('hooks/useGoogleSheets.ts', 'utf8');

code = code.replace(
  "return { success: false, message: e.message || 'Erro ao importar dados da planilha.' };",
  `if (e.message === 'Failed to fetch') {
        return { success: false, message: 'Erro de conexão (Failed to fetch).\\n\\nSOLUÇÃO:\\n1. Volte no Apps Script.\\n2. Clique em "Implantar" > "Gerenciar implantações".\\n3. Edite (lápis) a implantação.\\n4. Mude a versão para "Nova versão".\\n5. Certifique-se de que "Quem pode acessar" está como "Qualquer pessoa".\\n6. Salve e tente novamente.' };
      }
      return { success: false, message: e.message || 'Erro ao importar dados da planilha.' };`
);

fs.writeFileSync('hooks/useGoogleSheets.ts', code);
console.log("Patched error message.");
