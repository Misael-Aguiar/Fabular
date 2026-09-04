/* =============================================
   MUNDO DAS HISTÓRIAS — readingView.js (View)
   ============================================= */

'use strict';

async function iniciarHistoria(id, opcoes) {
  if (!id) return;
  sessionStorage.setItem('historiaIdDesejada', String(id));

  let historia = HISTORIAS.find((h) => h.id === id);

  if (!historia && typeof carregarCacheHistorias === 'function') {
    const cache = carregarCacheHistorias();
    historia = cache.find((c) => c && c.id === id && (typeof historiaVisivelParaCriancaAtual !== 'function' || historiaVisivelParaCriancaAtual(c)));
    if (historia && typeof garantirHistoriaNaBiblioteca === 'function') {
      garantirHistoriaNaBiblioteca(historia);
    }
  }

  if (historia && typeof historiaVisivelParaCriancaAtual === 'function' && !historiaVisivelParaCriancaAtual(historia)) {
    historia = null;
  }

  if (String(id).startsWith('api-') && (!historia || !historiaApiTemTextoCompleto(historia))) {
    try {
      const detalhe = await carregarDetalheHistoriaDaApi(id);
      if (detalhe) {
        historia = detalhe;
        preservarDetalheHistoriaNaBiblioteca(id, detalhe);
        salvarHistoriaNoCache(detalhe);
      }
    } catch (_) { }
  }

  if (!historia) return;

  estado.historiaAtual = historia;
  estado.acertos = 0;
  estado.ajudas = 0;
  estado.iniciouEm = Date.now();

  if (opcoes && opcoes.irLeitura) {
    prepararMinigamesPreset(historia);
    irParaTela('leitura');
    mostrarLeituraCompleta();
    return;
  }

  estado.minigamesPreset = null;
  iniciarMinigames();
}

let estadoLeitura = {
  paginaAtual: 0,
  paginas: [],
  totalPaginas: 1
};

function obterTextoCompletoHistoria(h) {
  if (!h) return '';
  if (typeof h.textoCompleto === 'string' && h.textoCompleto.trim()) {
    return h.textoCompleto.trim();
  }
  if (typeof h.texto === 'string' && h.texto.trim()) {
    return h.texto.trim();
  }
  if (Array.isArray(h.fases)) {
    return h.fases.map((f) => f.texto || '').filter(Boolean).join(' ');
  }
  return '';
}

function contarPalavras(textoHtmlOuPuro) {
  if (!textoHtmlOuPuro) return 0;
  const textOnly = textoHtmlOuPuro.replace(/<[^>]+>/g, ' ').trim();
  if (!textOnly) return 0;
  return textOnly.split(/\s+/).filter(Boolean).length;
}

function dividirTextoEmPaginasPorPalavras(textoCompleto, limitePalavras = 150) {
  if (!textoCompleto || !textoCompleto.trim()) return [''];

  let blocos = [];
  if (textoCompleto.includes('</p>')) {
    const temp = document.createElement('div');
    temp.innerHTML = textoCompleto;
    const ps = temp.querySelectorAll('p');
    if (ps.length > 0) {
      blocos = Array.from(ps).map(p => p.outerHTML.trim()).filter(Boolean);
    }
  }

  if (!blocos.length) {
    blocos = textoCompleto
      .split(/\n\s*\n/)
      .map(b => b.trim())
      .filter(Boolean)
      .map(b => `<p>${b}</p>`);
  }

  if (!blocos.length) {
    blocos = [`<p>${textoCompleto.trim()}</p>`];
  }

  const paginas = [];
  let paginaAtualHtml = '';
  let palavrasPaginaAtual = 0;

  blocos.forEach((bloco) => {
    const textOnly = bloco.replace(/<[^>]+>/g, ' ').trim();
    const palavrasBloco = textOnly.split(/\s+/).filter(Boolean);
    const qtdPalavrasBloco = palavrasBloco.length;

    if (qtdPalavrasBloco > limitePalavras) {
      if (paginaAtualHtml) {
        paginas.push(paginaAtualHtml);
        paginaAtualHtml = '';
        palavrasPaginaAtual = 0;
      }

      let acumPalavras = [];
      palavrasBloco.forEach((p) => {
        acumPalavras.push(p);
        if (acumPalavras.length >= limitePalavras) {
          paginas.push(`<p>${acumPalavras.join(' ')}</p>`);
          acumPalavras = [];
        }
      });
      if (acumPalavras.length > 0) {
        paginaAtualHtml = `<p>${acumPalavras.join(' ')}</p>`;
        palavrasPaginaAtual = acumPalavras.length;
      }
    } else {
      if (paginaAtualHtml && (palavrasPaginaAtual + qtdPalavrasBloco > limitePalavras)) {
        paginas.push(paginaAtualHtml);
        paginaAtualHtml = bloco;
        palavrasPaginaAtual = qtdPalavrasBloco;
      } else {
        paginaAtualHtml += (paginaAtualHtml ? ' ' : '') + bloco;
        palavrasPaginaAtual += qtdPalavrasBloco;
      }
    }
  });

  if (paginaAtualHtml) {
    paginas.push(paginaAtualHtml);
  }

  return paginas.length > 0 ? paginas : [textoCompleto];
}

function renderizarPaginaAtualLivro(direcaoAnimacao = null) {
  const h = estado.historiaAtual;
  if (!h) return;

  const total = estadoLeitura.totalPaginas || 1;
  const atual = Math.max(0, Math.min(total - 1, estadoLeitura.paginaAtual || 0));
  estadoLeitura.paginaAtual = atual;

  const tituloBadge = document.getElementById('leitura-titulo-badge');
  if (tituloBadge) tituloBadge.textContent = h.titulo || 'História';

  const labelEl = document.getElementById('fase-atual-label');
  if (labelEl) labelEl.textContent = 'História Completa';

  const cenaEl = document.getElementById('historia-emoji-cena');
  if (cenaEl) cenaEl.textContent = h.cena || (h.fases && h.fases[0] && h.fases[0].cena) || '📖';

  const indicadorEl = document.getElementById('livro-pagina-indicador');
  if (indicadorEl) {
    indicadorEl.textContent = `${atual + 1} / ${total}`;
  }

  const conteudoPagina = estadoLeitura.paginas[atual] || '';

  const textoEl = document.getElementById('historia-texto');
  const cartaoEl = document.getElementById('cartao-livro-leitura');

  if (textoEl) {
    textoEl.innerHTML = conteudoPagina;
    textoEl.classList.toggle('sem-destaque', !estado.destaqueAtivo);
  }

  if (direcaoAnimacao && cartaoEl) {
    cartaoEl.classList.remove('pagina-virando-avancar', 'pagina-virando-recuar');
    void cartaoEl.offsetWidth;
    cartaoEl.classList.add(direcaoAnimacao === 'recuar' ? 'pagina-virando-recuar' : 'pagina-virando-avancar');
  }

  const navPaginas = document.getElementById('livro-navegacao-paginas');
  const btnAnt = document.getElementById('btn-pagina-anterior');
  const btnProx = document.getElementById('btn-proxima-pagina');
  const btnContinuar = document.getElementById('btn-continuar');

  if (navPaginas) {
    navPaginas.style.display = total > 1 ? 'flex' : 'none';
  }

  if (btnAnt) {
    btnAnt.disabled = (atual === 0);
  }

  if (btnProx) {
    if (atual >= total - 1) {
      btnProx.style.display = 'none';
    } else {
      btnProx.style.display = 'inline-flex';
      btnProx.disabled = false;
    }
  }

  const dotsContainer = document.getElementById('livro-paginacao-dots');
  if (dotsContainer) {
    dotsContainer.innerHTML = '';
    if (total > 1) {
      for (let i = 0; i < total; i++) {
        const dot = document.createElement('div');
        dot.className = `pag-dot ${i === atual ? 'ativa' : ''}`;
        dot.title = `Ir para página ${i + 1}`;
        dot.onclick = () => irParaPaginaLivro(i);
        dotsContainer.appendChild(dot);
      }
    }
  }

  if (btnContinuar) {
    const isUltima = (atual >= total - 1);
    const n = (estado.minigamesLista && estado.minigamesLista.length) || 5;
    btnContinuar.textContent = `Vamos Jogar! 🚀 (${n} minigame${n > 1 ? 's' : ''})`;
    btnContinuar.style.display = isUltima ? 'block' : 'none';
    if (isUltima && total > 1) {
      btnContinuar.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
}

function virarPaginaAnterior() {
  if (estadoLeitura.paginaAtual > 0) {
    estadoLeitura.paginaAtual--;
    renderizarPaginaAtualLivro('recuar');
  }
}

function virarProximaPagina() {
  if (estadoLeitura.paginaAtual < estadoLeitura.totalPaginas - 1) {
    estadoLeitura.paginaAtual++;
    renderizarPaginaAtualLivro('avancar');
  }
}

function irParaPaginaLivro(num) {
  if (num >= 0 && num < estadoLeitura.totalPaginas && num !== estadoLeitura.paginaAtual) {
    const dir = num < estadoLeitura.paginaAtual ? 'recuar' : 'avancar';
    estadoLeitura.paginaAtual = num;
    renderizarPaginaAtualLivro(dir);
  }
}

function lerTextoCompletoHistoria(opcoes) {
  const h = estado.historiaAtual;
  if (!h) {
    mostrarToast('Escolha uma história primeiro! 📚');
    return;
  }

  const textoCompleto = obterTextoCompletoHistoria(h);
  if (!textoCompleto.trim()) {
    mostrarToast('Esta história ainda não tem texto para ler.');
    return;
  }

  irParaTela('leitura');
  setUiLeituraModoCompleto(true);

  let paginas = [];
  if (Array.isArray(h.fases) && h.fases.length > 1) {
    paginas = h.fases.map(f => `<p>${f.texto || ''}</p>`);
  } else {
    paginas = dividirTextoEmPaginasPorPalavras(textoCompleto, 150);
  }

  estadoLeitura.paginas = paginas;
  estadoLeitura.totalPaginas = paginas.length;
  estadoLeitura.paginaAtual = 0;

  renderizarPaginaAtualLivro(null);
}

function setUiLeituraModoCompleto(completo) {
  estado.modoLeituraCompleta = completo;
  const faseInd = document.querySelector('.fase-indicador');
  const barra = document.querySelector('.barra-progresso-fases');
  const inter = document.getElementById('interacao-area');
  const btnPular = document.getElementById('btn-pular-fase');
  if (faseInd) faseInd.style.display = completo ? '' : '';
  if (barra) barra.style.display = 'none';
  if (inter) inter.style.display = 'none';
  if (btnPular) btnPular.style.display = 'none';
}

function mostrarLeituraCompleta() {
  const h = estado.historiaAtual;
  if (!h) return;

  estado.modoLeituraCompleta = true;
  lerTextoCompletoHistoria({ autoOuvir: estado.perfil.faixa === 1 });
}

function renderizarFase() {
  const h = estado.historiaAtual;
  if (!h) return;
  mostrarLeituraCompleta();
}

function avancarFase() {
  iniciarSequenciaMinigames();
}

function pularFase() {
  estado.ajudas += 2;
  avancarFase();
}

function registrarEstrelasHistoria(estrelasNovas) {
  const historia = estado.historiaAtual;
  const id = historia && historia.id;
  if (!id) return;
  const novas = Math.max(0, Math.min(5, Number(estrelasNovas) || 0));

  const { data, dataIso } = obterDataConclusaoAtual();
  const idStr = String(id);
  if (!Array.isArray(estado.historiasLidas)) {
    estado.historiasLidas = [];
  }

  const idNorm = typeof normalizarIdHistoria === 'function' ? String(normalizarIdHistoria(idStr)) : idStr.replace(/^api-/i, '');
  const idx = estado.historiasLidas.findIndex((r) => {
    if (!r || r.id == null) return false;
    const rNorm = typeof normalizarIdHistoria === 'function' ? String(normalizarIdHistoria(r.id)) : String(r.id).replace(/^api-/i, '');
    return rNorm === idNorm;
  });

  if (idx >= 0) {
    const atual = estado.historiasLidas[idx];
    atual.estrelas = Math.max(Number(atual.estrelas) || 0, novas);
    atual.data = data;
    atual.dataIso = dataIso;
    atual.timestamp = Date.now();
    if (historia.titulo) atual.titulo = historia.titulo;
    if (historia.emoji) atual.emoji = historia.emoji;
    if (historia.genero) atual.genero = historia.genero;
  } else {
    estado.historiasLidas.push({
      id: idNorm ? `api-${idNorm}` : idStr,
      titulo: historia.titulo || '',
      emoji: historia.emoji || '📖',
      genero: historia.genero || 'narrativo',
      estrelas: novas,
      data,
      dataIso,
      timestamp: Date.now()
    });
  }

  // Atualiza registro de atividade diária para o calendário
  if (!Array.isArray(estado.atividadeDiaria)) {
    estado.atividadeDiaria = [];
  }
  const hojeIso = dataIso || new Date().toISOString().slice(0, 10);
  const itemDia = estado.atividadeDiaria.find(a => a && a.data === hojeIso);
  if (itemDia) {
    itemDia.quantidade = (Number(itemDia.quantidade) || 0) + 1;
  } else {
    estado.atividadeDiaria.push({ data: hojeIso, quantidade: 1 });
  }

  if (typeof recalcularTotalEstrelas === 'function') {
    recalcularTotalEstrelas();
  } else {
    estado.totalEstrelas += novas;
  }

  salvarEstado();
  if (typeof enviarSyncProgresso === 'function') enviarSyncProgresso().catch(() => {});
  atualizarHeader();
  renderizarBiblioteca();
}

function atualizarEstrelasAposMinigame() {
  if (!estado.historiaAtual) return;
  const total = estado.minigamesLista.length || 4;
  const acertos = (estado.acertos || 0) + (estado.mgAcertos || 0);
  registrarEstrelasHistoria(calcularEstrelasPorAcertos(acertos, total));
}

// 1 estrela por minigame acertado (máximo de 5)
function calcularEstrelasPorAcertos(acertos, total) {
  const a = Math.max(0, Number(acertos) || 0);
  const t = Math.max(1, Number(total) || 1);
  // Cada minigame vale 1 estrela — acertou todos os t, ganha t estrelas (max 5)
  return Math.min(5, a);
}
