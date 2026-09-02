#!/bin/bash
for file in app/clientes/page.tsx app/orcamentos/page.tsx app/pedidos/page.tsx; do
  sed -i 's/w-full max-w-md/w-[92vw] max-w-[400px] min-w-[300px]/g' "$file"
  sed -i 's/max-w-[200px]//g' "$file"
  sed -i 's/max-w-[220px]//g' "$file"
done
