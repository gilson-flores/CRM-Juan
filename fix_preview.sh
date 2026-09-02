#!/bin/bash
sed -i '1059,1279d' app/orcamentos/page.tsx
sed -i '1058a\
      </div>\
' app/orcamentos/page.tsx
