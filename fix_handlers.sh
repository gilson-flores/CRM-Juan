#!/bin/bash
# Find lines for handleAddDirectItem and replace it.
sed -i '/const handleAddDirectItem = () => {/,/};/c\
  const handleAddDirectItem = () => {\
    if (newDirectItem.description.trim() && newDirectItem.quantity > 0) {\
      const generatedId = `item-${Date.now()}`;\
      setDirectItems(prev => [...prev, { ...newDirectItem, id: generatedId }]);\
      setNewDirectItem({ id: "", description: "", quantity: 1, unitPrice: 0 });\
    }\
  };\
\
  const handleSelectFromCatalogForDirect = (catalogItem: CatalogItem) => {\
    const generatedId = `item-${Date.now()}`;\
    setDirectItems(prev => [\
      ...prev,\
      {\
        id: generatedId,\
        description: catalogItem.name + (catalogItem.description ? ` (${catalogItem.description})` : ""),\
        quantity: 1,\
        unitPrice: catalogItem.unitPrice,\
        catalogId: catalogItem.id\
      }\
    ]);\
    setIsCatalogModalOpen(false);\
  };\
' app/pedidos/page.tsx
