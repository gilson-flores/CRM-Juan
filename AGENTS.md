# Diretrizes do Projeto & Preferências de Interface

## 1. Experiência de Usuário & Animações
- **Transição de Páginas Suave**: Ao trocar de aba/janela, aplicar transição elegante com fade-in e leve elevação (Motion/Tailwind).
- **Auto-Scroll no Salvamento**: Sempre que uma ação de "Salvar", "Confirmar" ou "Concluir" for executada com sucesso, a interface realiza scroll suave (`scroll-smooth` / `window.scrollTo({ top: 0, behavior: 'smooth' })`) para o topo, trazendo o feedback visual imediato e mantendo o fluxo natural de leitura.
- **Micro-interações em Botões**:
  - Efeito tátil de pressão ativa (`active:scale-[0.98] transition-transform duration-100`).
  - Feedback de hover com brilho e contraste controlado.
- **Modais e Drawers**:
  - Animação de entrada e saída fluida com blur de fundo (`backdrop-blur-sm`).
  - Fechamento rápido por tecla `Esc` ou clique fora.

## 2. Padrões de Layout & Responsividade
- Foco em alta performance, usabilidade móvel com touch targets de no mínimo 44px.
- Modo escuro profissional de alto contraste e sem ruídos visuais.
- Identidade visual com laranja elétrico (`#FF7A00`) e tons neutros escuros sofisticados (`#080808`, `#0e0e11`, `#141418`).
