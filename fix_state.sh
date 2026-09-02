#!/bin/bash
sed -i '71i\
  const [newDirectItem, setNewDirectItem] = useState<QuoteItem>({ id: "", description: "", quantity: 1, unitPrice: 0 });\
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);\
  const [catalogSearch, setCatalogSearch] = useState("");\
\
  const filteredCatalog = useMemo(() => {\
    return catalogItems.filter(item => \
      !catalogSearch || \
      item.name.toLowerCase().includes(catalogSearch.toLowerCase()) || \
      (item.description || "").toLowerCase().includes(catalogSearch.toLowerCase()) ||\
      item.category.toLowerCase().includes(catalogSearch.toLowerCase())\
    );\
  }, [catalogItems, catalogSearch]);\
' app/pedidos/page.tsx
