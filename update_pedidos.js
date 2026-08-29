const fs = require('fs');
let code = fs.readFileSync('app/pedidos/page.tsx', 'utf8');

// add import
code = code.replace(
  /import type \{ FullDraft \} from '\.\.\/orcamentos\/page';/,
  "import type { FullDraft } from '../orcamentos/page';\nimport { useGoogleSheets } from '@/hooks/useGoogleSheets';"
);

// inside PedidosPage
code = code.replace(
  /const \[notification, setNotification\] = useState<\{ text: string; type: 'success' \| 'info' \| 'error' \} \| null>\(null\);/,
  "const [notification, setNotification] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);\n  const { syncAllData } = useGoogleSheets();"
);

// handleTransformToOrder
code = code.replace(
  /showNotification\('Orçamento transformado em pedido com sucesso!'\);\n  \};/,
  "showNotification('Orçamento transformado em pedido com sucesso!');\n    syncAllData().catch(e => console.error('Sync failed', e));\n  };"
);

// handleDeleteOrder
code = code.replace(
  /showNotification\('Pedido excluído\.', 'info'\);\n    \}/,
  "showNotification('Pedido excluído.', 'info');\n      syncAllData().catch(e => console.error('Sync failed', e));\n    }"
);

// handleMarkAsCompleted
code = code.replace(
  /showNotification\('Serviço marcado como concluído!', 'success'\);\n  \};/,
  "showNotification('Serviço marcado como concluído!', 'success');\n    syncAllData().catch(e => console.error('Sync failed', e));\n  };"
);

// handleRevertToOrder
code = code.replace(
  /showNotification\('Status revertido para Em Andamento', 'info'\);\n  \};/,
  "showNotification('Status revertido para Em Andamento', 'info');\n    syncAllData().catch(e => console.error('Sync failed', e));\n  };"
);

fs.writeFileSync('app/pedidos/page.tsx', code);
console.log('updated page.tsx');
