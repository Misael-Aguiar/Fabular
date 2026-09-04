/* =============================================
   MUNDO DAS HISTÓRIAS — minigameView.js (View)
   ============================================= */

'use strict';

function obterTextoBaseHistoria(h) {
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

function iniciarMinigames() {
  if (typeof verificarPodeJogarMinigame === 'function' && !verificarPodeJogarMinigame()) {
    if (typeof mostrarModalVidasEsgotadas === 'function') mostrarModalVidasEsgotadas();
    return;
  }
  const h = estado.historiaAtual;
  if (!h) {
    mostrarToast('Escolha uma história primeiro! 📚');
    return;
  }
  prepararMinigamesPreset(h);
  estado.minigameAtual = 0;
  estado.mgAcertos = 0;
  estado.modoLeituraCompleta = true;
  mostrarLeituraCompleta();
}

function iniciarSequenciaMinigames() {
  if (typeof verificarPodeJogarMinigame === 'function' && !verificarPodeJogarMinigame()) {
    if (typeof mostrarModalVidasEsgotadas === 'function') mostrarModalVidasEsgotadas();
    return;
  }
  if (!estado.historiaAtual) {
    mostrarToast('Escolha uma história primeiro! 📚');
    return;
  }
  estado.modoLeituraCompleta = true;
  irParaTela('minigame');
  renderizarMinigame();
}

function nomeMinigame(tipo) {
  const nomes = {
    jogo_memoria: '🃏 Jogo da Memória',
    som_palavra: '🔊 Som e Palavra',
    monta_frase: '🧩 Monta-Frase',
    verdadeiro_falso: '✅ Verdadeiro ou Falso?',
    caca_palavras: '🔍 Caça-Palavras',
    ligar_pontos: '🔗 Ligar os Pontos',
    rima: '🎵 Encontre a Rima',
    quem_disse: '💬 Quem Disse Isso?',
    ordenar_passos: '📋 Ordene os Passos',
    escolha: '❓ Escolha Múltipla',
    completar: '✍️ Completar',
    palavras_perdidas: '🧠 Palavras Perdidas'
  };
  return nomes[tipo] || tipo;
}

function renderizarMinigame() {
  const spec =
    estado.minigamesPreset && estado.minigamesPreset[estado.minigameAtual]
      ? estado.minigamesPreset[estado.minigameAtual]
      : null;
  const tipo =
    normalizarTipoMinigame((spec && (spec.tipo || spec.Tipo)) || estado.minigamesLista[estado.minigameAtual]);
  const total = estado.minigamesLista.length;
  const h = estado.historiaAtual;
  const textoBase = obterTextoBaseHistoria(h);
  const fase = { texto: textoBase, cena: h?.cena || '' };

  document.getElementById('mg-titulo-label').textContent = nomeMinigame(tipo);
  document.getElementById('mg-contador').textContent = `${estado.minigameAtual + 1} / ${total}`;

  document.getElementById('mg-feedback').classList.add('oculto');
  document.getElementById('btn-proximo-mg').classList.add('oculto');
  document.getElementById('btn-finalizar-mg').classList.add('oculto');

  const corpo = document.getElementById('minigame-corpo');
  corpo.innerHTML = '';

  const tiposSemEnunciadoDuplicado = ['completar', 'palavras_perdidas', 'escolha', 'verdadeiro_falso', 'som_palavra', 'rima', 'quem_disse', 'memoria', 'jogo_memoria'];
  if (!tiposSemEnunciadoDuplicado.includes(tipo)) {
    const header = document.createElement('div');
    header.className = 'mg-enunciado';
    header.textContent = nomeMinigame(tipo);
    corpo.appendChild(header);
  }

  switch (tipo) {
    case 'memoria':
    case 'jogo_memoria': renderMemoria(fase, h, corpo, spec); break;
    case 'som_palavra': renderSomPalavra(fase, corpo, spec); break;
    case 'monta_frase': renderMontaFrase(fase, corpo, spec); break;
    case 'verdadeiro_falso': renderVerdadeiroFalso(fase, h, corpo, spec); break;
    case 'caca_palavras': renderCacaPalavras(fase, h, corpo); break;
    case 'ligar_pontos': renderLigarPontos(fase, h, corpo, spec); break;
    case 'rima': renderRima(h, corpo, spec); break;
    case 'quem_disse': renderQuemDisse(fase, h, corpo, spec); break;
    case 'ordenar_passos': renderOrdenarPassos(h, corpo, spec); break;
    case 'escolha': renderEscolhaMG(fase, corpo, spec); break;
    case 'completar': renderCompletarMG(fase, corpo, spec); break;
    case 'colorir': renderColorirMG(h, corpo, spec); break;
    case 'palavras_perdidas': renderCompletarMG(fase, corpo, spec || { tipo: 'completar' }); break;
    default: renderVerdadeiroFalso(fase, h, corpo, spec);
  }
}

function limparRespostaEsperada(container) {
  const alvo = container || document.getElementById('minigame-corpo');
  if (!alvo) return;
  alvo.querySelectorAll('.mg-resposta-esperada').forEach((el) => el.remove());
}

function mostrarRespostaEsperada(texto, container) {
  // As respostas agora são reveladas visualmente e interativamente em cada minigame
  limparRespostaEsperada(container);
}


function mostrarFeedbackMG(ok, mostrarProximo = true) {
  let zerouVidas = false;
  if (ok) {
    estado.mgAcertos = (estado.mgAcertos || 0) + 1;
  } else {
    estado.mgErros = (estado.mgErros || 0) + 1;
    estado.tentativasReprovadas++;
    if (typeof perderVida === 'function') {
      const statusVida = perderVida();
      if (statusVida.zerou) {
        zerouVidas = true;
        mostrarProximo = false; // Não permite avançar se as vidas zerarem
        if (typeof mostrarModalVidasEsgotadas === 'function') {
          setTimeout(() => mostrarModalVidasEsgotadas(), 600);
        }
      } else {
        if (typeof mostrarAvisoPerdaVida === 'function') {
          mostrarAvisoPerdaVida(statusVida.vidasRestantes);
        }
      }
    }
  }

  const area = document.getElementById('mg-feedback');
  const card = document.getElementById('mg-feedback-card');
  const emoji = document.getElementById('mg-feedback-emoji');
  const msg = document.getElementById('mg-feedback-msg');

  area.classList.remove('oculto');

  if (ok) {
    card.style.background = 'linear-gradient(135deg,#DCFCE7,#D1FAE5)';
    card.style.borderColor = 'var(--cor-verde)';
    emoji.textContent = ['🎉', '🌟', '🏆', '💫', '🚀'][Math.floor(Math.random() * 5)];
    msg.textContent = MSGS_ACERTO[Math.floor(Math.random() * MSGS_ACERTO.length)];
    msg.style.color = '#166534';
  } else {
    card.style.background = 'linear-gradient(135deg,#FEF3C7,#FDE68A)';
    card.style.borderColor = '#F59E0B';
    emoji.textContent = '💔';
    msg.textContent = zerouVidas ? 'Suas vidas acabaram! Recarregue suas energias ❤️' : MSGS_ERRO[Math.floor(Math.random() * MSGS_ERRO.length)];
    msg.style.color = '#92400E';
  }

  if (mostrarProximo) {
    const isUltimo = estado.minigameAtual >= estado.minigamesLista.length - 1;
    const btnProx = document.getElementById('btn-proximo-mg');
    const btnFin = document.getElementById('btn-finalizar-mg');
    btnProx.classList.toggle('oculto', isUltimo);
    btnFin.classList.toggle('oculto', !isUltimo);
    if (isUltimo) btnFin.textContent = 'Ver Resultado 🏆';
    else btnProx.textContent = 'Próximo Jogo →';
  } else if (zerouVidas) {
    const btnProx = document.getElementById('btn-proximo-mg');
    const btnFin = document.getElementById('btn-finalizar-mg');
    if (btnProx) btnProx.classList.add('oculto');
    if (btnFin) btnFin.classList.add('oculto');
  }

  area.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function proximoMinigame() {
  if (typeof verificarPodeJogarMinigame === 'function' && !verificarPodeJogarMinigame()) {
    if (typeof mostrarModalVidasEsgotadas === 'function') mostrarModalVidasEsgotadas();
    return;
  }
  estado.minigameAtual++;
  renderizarMinigame();
  document.getElementById('app-main').scrollTop = 0;
}

function mostrarResultado(estrelas, tempoMin, acertosTotal) {
  const estrelasExibidas = Math.max(0, Math.min(5, Number(estrelas) || 0));
  const mensagens = MSGS_RESULTADO[estrelasExibidas] || MSGS_RESULTADO[0] || ['Parabéns!'];
  const msg = mensagens[Math.floor(Math.random() * mensagens.length)];

  const resultadoEstrelas = document.getElementById('resultado-estrelas');
  if (resultadoEstrelas) resultadoEstrelas.innerHTML = renderEstrelas(estrelasExibidas, 5);

  const resultadoTitulo = document.getElementById('resultado-titulo');
  if (resultadoTitulo) resultadoTitulo.textContent = estrelasExibidas >= 5 ? 'Perfeito!' : estrelasExibidas === 4 ? 'Excelente!' : estrelasExibidas === 3 ? 'Muito Bem!' : estrelasExibidas >= 2 ? 'Bom Trabalho!' : estrelasExibidas === 1 ? 'Parabéns!' : 'Continue!';

  const resultadoMsg = document.getElementById('resultado-msg');
  if (resultadoMsg) resultadoMsg.textContent = msg;

  const statTempo = document.getElementById('stat-tempo');
  if (statTempo) statTempo.textContent = `${tempoMin} min`;

  const statAcertos = document.getElementById('stat-acertos');
  if (statAcertos) statAcertos.textContent = acertosTotal;

  const statNivel = document.getElementById('stat-nivel');
  if (statNivel) statNivel.textContent = estado.nivel || 'Iniciante';

  const resultadoAviso = document.getElementById('resultado-aviso');
  if (resultadoAviso) resultadoAviso.classList.add('oculto');

  irParaTela('resultado');
}

function finalizarMinigames() {
  const tempoMin = Math.max(1, Math.round((Date.now() - (estado.iniciouEm || Date.now())) / 60000));
  estado.tempoTotal += tempoMin;

  const totalJogos = estado.minigamesLista.length || 5;
  estado.minigamesJogados += totalJogos;

  const acertosSessao = Math.min(5, Math.min(totalJogos, Math.max(0, Number(estado.mgAcertos) || 0)));
  const errosSessao = Math.min(5, Math.max(0, estado.mgErros != null ? Number(estado.mgErros) : (totalJogos - acertosSessao)));

  estado.acertosMG = (Number(estado.acertosMG) || 0) + acertosSessao;
  estado.errosMG = (Number(estado.errosMG) || 0) + errosSessao;

  estado.mgAcertos = 0;
  estado.mgErros = 0;

  const acertosTotal = acertosSessao;
  const estrelas = calcularEstrelasPorAcertos(acertosTotal, totalJogos);

  registrarEstrelasHistoria(estrelas);
  if (typeof garantirContadoresRelatorio === 'function') {
    garantirContadoresRelatorio();
  }

  estado.nivel = calcularNivelPorXp(estado.totalEstrelas);

  salvarEstado();
  if (typeof enviarSyncProgresso === 'function') {
    enviarSyncProgresso().catch(() => { });
  }
  atualizarHeader();
  renderizarBiblioteca();
  mostrarResultado(estrelas, tempoMin, acertosTotal);
}

function embaralhar(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function prepararMinigamesPreset(h) {
  estado.mgAcertos = 0;
  estado.mgErros = 0;

  const faixa = h.faixa || (estado.perfil && estado.perfil.faixa) || 1;
  const genero = h.genero || (estado.perfil && estado.perfil.genero) || 'narrativo';

  // Sorteia aleatoriamente 5 minigames do banco para a faixa e gênero correspondentes
  const tiposSorteados = obterMinigamesAleatoriosDoBanco(faixa, genero, 5);

  const presetSrc = Array.isArray(h.minigamesPreset) ? h.minigamesPreset : [];
  if (presetSrc.length) {
    const presetNormalizado = presetSrc.map((p) => normalizarMinigamePreset(p) || p).filter(Boolean);
    const presetPorChave = {};
    presetNormalizado.forEach((p) => {
      if (p && p.tipo) {
        presetPorChave[chaveUnicaMinigame(p.tipo)] = p;
      }
    });

    estado.minigamesLista = tiposSorteados;
    estado.minigamesPreset = tiposSorteados.map((tipo) =>
      presetPorChave[chaveUnicaMinigame(tipo)] || { tipo, pergunta: '' }
    );
  } else {
    estado.minigamesLista = tiposSorteados;
    estado.minigamesPreset = tiposSorteados.map((tipo) => ({ tipo, pergunta: '' }));
  }
}


function registrarEventoMG(tipo, acao, dados) {
  estado.relatorioEventos.push({
    tipo: tipo,
    acao: acao,
    dados: dados || null,
    historiaId: estado.historiaAtual ? estado.historiaAtual.id : null,
    em: new Date().toISOString()
  });
  if (acao === 'nao_consigo_ouvir') estado.naoConsigoOuvir = (Number(estado.naoConsigoOuvir) || 0) + 1;
  if (estado.relatorioEventos.length > 400) {
    estado.relatorioEventos = estado.relatorioEventos.slice(-400);
  }
  salvarEstado();
}

function revelarMontaFraseCorreta(palavrasCorretas) {
  const espaco = document.getElementById('mfEspaco');
  const pool = document.getElementById('mfPool');
  if (espaco) {
    espaco.innerHTML = palavrasCorretas.map(p =>
      `<span class="mf-colocada mf-resposta-correta">${p}</span>`
    ).join(' ');
  }
  if (pool) pool.querySelectorAll('.mf-chip, .mf-colocada').forEach(b => { b.disabled = true; });
}

function textoValidoCompletar(texto) {
  const t = String(texto || '').trim();
  if (!t) return false;
  if (/^[-–—_\s.]+$/u.test(t)) return false;
  if (/^complete(\s+a\s+frase)?[:.]?\s*$/i.test(t)) return false;
  return true;
}

function limparTextoCompletar(texto) {
  return String(texto || '')
    .replace(/^✍️\s*/u, '')
    .replace(/^Complete:\s*/i, '')
    .replace(/^Complete a frase[^:]*:\s*/i, '')
    .replace(/\s*[-–—]{2,}\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function montarDadosCompletarMG(fase, h, spec) {
  const fonte = spec && typeof spec === 'object' ? spec : {};
  let resposta = String(
    fonte.resposta != null ? fonte.resposta
      : (fonte.palavra != null ? fonte.palavra
        : (fonte.lacuna != null ? fonte.lacuna : ''))
  ).trim();
  let frase = '';
  if (textoValidoCompletar(fonte.frase)) frase = limparTextoCompletar(fonte.frase);
  else if (textoValidoCompletar(fonte.texto)) frase = limparTextoCompletar(fonte.texto);

  const inter = fase && fase.interacao && fase.interacao.tipo === 'completar' ? fase.interacao : null;
  if (!resposta && inter) resposta = String(inter.resposta || '').trim();
  if (!frase && inter && textoValidoCompletar(inter.pergunta)) {
    frase = limparTextoCompletar(inter.pergunta);
  }

  if (!resposta && h) {
    const kw = (h.palavrasChave || []).find(Boolean) || 'história';
    resposta = kw;
    const textoLimpo = obterTextoBaseHistoria(h)
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const re = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');

    // 1. Divide em frases completas por . ! ? (preferencial)
    const frases = textoLimpo.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 5);

    // 2. Procura frase completa com a palavra-chave e tamanho adequado
    let fraseTxt = frases.find((s) => re.test(s) && s.length >= 10 && s.length <= 120);

    // 3. Fallback: divide por vírgula/ponto-e-vírgula para cláusulas menores
    if (!fraseTxt) {
      const clausulas = textoLimpo.split(/[,;]+/).map((s) => s.trim()).filter((s) => s.length > 5);
      fraseTxt = clausulas.find((s) => re.test(s) && s.length >= 8 && s.length <= 80);
    }

    // 4. Fallback: qualquer frase completa de tamanho razoável (sem precisar ter a palavra-chave)
    if (!fraseTxt) {
      fraseTxt = frases.find((s) => s.length >= 10 && s.length <= 100);
    }

    // 5. Último recurso: primeira frase disponível (jamais o texto inteiro cortado no meio)
    if (!fraseTxt) {
      fraseTxt = frases[0] || textoLimpo.slice(0, 80).replace(/\s+\S+$/, '');
    }

    if (re.test(fraseTxt)) frase = fraseTxt.replace(re, '___');
    else frase = fraseTxt + ' ___';
  }

  if (frase && resposta && !/_{2,}|___/.test(frase)) {
    const reResp = new RegExp(`\\b${resposta.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (reResp.test(frase)) frase = frase.replace(reResp, '___');
    else frase = frase + ' ___';
  }

  if (!frase) frase = 'Complete a frase ___';

  let instrucao = 'Leia a frase e escreva uma palavra para completar.';
  const perguntaSpec = limparTextoCompletar(fonte.pergunta || '');
  if (textoValidoCompletar(perguntaSpec) && !/_{2,}|___/.test(perguntaSpec) && perguntaSpec !== frase) {
    instrucao = perguntaSpec;
  }

  return {
    frase,
    instrucao,
    resposta: resposta || 'palavra',
    dica: fonte.dica || (inter && inter.dica) || ''
  };
}

function formatarFraseLacunaHtml(frase) {
  const limpa = limparTextoCompletar(String(frase || '').replace(/<[^>]+>/g, ''));
  return limpa.replace(/_{2,}|___/g, '<span class="lacuna-vazia" aria-hidden="true">_____</span>');
}

// ─── 1. JOGO DA MEMÓRIA ──────────────────────────────────────────────────────
const CORES_PARES_MEMORIA = [
  { border: '#8B5CF6', bg: 'linear-gradient(135deg, #F3E8FF, #E9D5FF)', shadow: 'rgba(139, 92, 246, 0.4)' }, // Roxo
  { border: '#EC4899', bg: 'linear-gradient(135deg, #FCE7F3, #FBCFE8)', shadow: 'rgba(236, 72, 153, 0.4)' }, // Rosa
  { border: '#06B6D4', bg: 'linear-gradient(135deg, #CFFAFE, #A5F3FC)', shadow: 'rgba(6, 182, 212, 0.4)' }, // Ciano
  { border: '#F59E0B', bg: 'linear-gradient(135deg, #FEF3C7, #FDE68A)', shadow: 'rgba(245, 158, 11, 0.4)' }, // Âmbar
  { border: '#3B82F6', bg: 'linear-gradient(135deg, #DBEAFE, #BFDBFE)', shadow: 'rgba(59, 130, 246, 0.4)' }, // Azul
  { border: '#10B981', bg: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)', shadow: 'rgba(16, 185, 129, 0.4)' }, // Verde Esmeralda
  { border: '#F97316', bg: 'linear-gradient(135deg, #FFEDD5, #FED7AA)', shadow: 'rgba(249, 115, 22, 0.4)' }, // Laranja
  { border: '#84CC16', bg: 'linear-gradient(135deg, #ECFCCB, #D9F99D)', shadow: 'rgba(132, 204, 22, 0.4)' }, // Verde Lima
  { border: '#D946EF', bg: 'linear-gradient(135deg, #FAE8FF, #F5D0FE)', shadow: 'rgba(217, 70, 239, 0.4)' }, // Magenta
  { border: '#14B8A6', bg: 'linear-gradient(135deg, #CCFBF1, #99F6E4)', shadow: 'rgba(20, 184, 166, 0.4)' }, // Turquesa
  { border: '#E11D48', bg: 'linear-gradient(135deg, #FFE4E6, #FECDD3)', shadow: 'rgba(225, 29, 72, 0.4)' }, // Rosa Choque
  { border: '#6366F1', bg: 'linear-gradient(135deg, #E0E7FF, #C7D2FE)', shadow: 'rgba(99, 102, 241, 0.4)' }  // Índigo
];

function aplicarCorDoPar(el, pairId) {
  const cor = CORES_PARES_MEMORIA[pairId % CORES_PARES_MEMORIA.length];
  el.style.setProperty('--pair-border-color', cor.border);
  el.style.setProperty('--pair-bg-color', cor.bg);
  el.style.setProperty('--pair-shadow-color', cor.shadow);
}

function renderMemoria(fase, h, corpo, spec) {
  const limparTextoPar = (s) => String(s || '').replace(/\s*\(?par\s*\d+\)?/gi, '').replace(/[\s\-_]+$/, '').trim();

  let pares;
  if (spec && Array.isArray(spec.pares) && spec.pares.length >= 2) {
    pares = enriquecerParesMemoria(spec.pares).map((p, i) => ({ id: i, palavra: limparTextoPar(p.palavra), emoji: p.emoji }));
  }
  if (!pares || pares.length < 2) {
    const palavras = (h.palavrasChave || []).slice(0, 5);
    if (palavras.length < 2) { renderVerdadeiroFalso(fase, h, corpo, null); return; }
    pares = palavras.map((p, i) => {
      const pL = limparTextoPar(p);
      return {
        id: i,
        palavra: pL,
        emoji: emojiParaPalavra(pL)
      };
    });
  }

  const cards = embaralhar([
    ...pares.map(p => ({ tipo: 'palavra', valor: p.palavra, pairId: p.id })),
    ...pares.map(p => ({ tipo: 'emoji', valor: p.emoji, pairId: p.id }))
  ]);

  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <p class="mg-desc">Encontre os pares! Clique nos cards para virá-los e encontrar a palavra com seu emoji! 🃏</p>
    <div class="mem-grid" id="memGrid"></div>
    <div class="mem-status" id="memStatus">Pares encontrados: <strong id="memPares">0</strong> / ${pares.length}</div>
    <div style="text-align:center;margin-top:12px;">
      <button class="btn-desistir-mg" id="btnDesistirMemoria">🏳️ Desistir / Ver Solução</button>
    </div>
  `;
  corpo.appendChild(wrap);

  const grid = document.getElementById('memGrid');
  const btnDesistir = document.getElementById('btnDesistirMemoria');
  let virados = [];
  let paresEncontrados = 0;
  let bloqueado = false;

  cards.forEach((card, idx) => {
    const el = document.createElement('div');
    el.className = 'mem-card';
    el.dataset.idx = idx;
    el.dataset.pairId = card.pairId;
    el.dataset.tipo = card.tipo;
    el.innerHTML = `
      <div class="mem-inner">
        <div class="mem-frente">?</div>
        <div class="mem-verso">${card.valor}</div>
      </div>
    `;
    el.addEventListener('click', () => {
      if (bloqueado) return;
      if (el.classList.contains('mem-virado') || el.classList.contains('mem-acertado')) return;

      el.classList.add('mem-virado');
      virados.push({ el, card });

      if (virados.length === 2) {
        bloqueado = true;
        const [a, b] = virados;
        if (a.card.pairId === b.card.pairId && a.card.tipo !== b.card.tipo) {
          setTimeout(() => {
            aplicarCorDoPar(a.el, a.card.pairId);
            aplicarCorDoPar(b.el, b.card.pairId);
            a.el.classList.add('mem-acertado');
            b.el.classList.add('mem-acertado');
            paresEncontrados++;
            document.getElementById('memPares').textContent = paresEncontrados;
            virados = [];
            bloqueado = false;
            if (paresEncontrados >= pares.length) {
              if (btnDesistir) btnDesistir.style.display = 'none';
              setTimeout(() => mostrarFeedbackMG(true, true), 300);
            }
          }, 500);
        } else {
          setTimeout(() => {
            a.el.classList.remove('mem-virado');
            b.el.classList.remove('mem-virado');
            a.el.classList.add('mem-erro-flash');
            b.el.classList.add('mem-erro-flash');
            setTimeout(() => {
              a.el.classList.remove('mem-erro-flash');
              b.el.classList.remove('mem-erro-flash');
            }, 400);
            virados = [];
            bloqueado = false;
          }, 900);
        }
      }
    });
    grid.appendChild(el);
  });

  const revelarTodosOsPares = () => {
    bloqueado = true;
    if (btnDesistir) btnDesistir.disabled = true;

    grid.querySelectorAll('.mem-card').forEach(el => {
      const pairId = parseInt(el.dataset.pairId, 10);
      aplicarCorDoPar(el, pairId);
      el.classList.add('mem-virado');
      el.classList.add('mem-acertado');
    });

    registrarEventoMG('jogo_memoria', 'erro');
    mostrarFeedbackMG(false, true);
  };

  if (btnDesistir) {
    btnDesistir.addEventListener('click', revelarTodosOsPares);
  }
}

// ─── 2. SOM E PALAVRA ────────────────────────────────────────────────────────
function renderSomPalavra(fase, corpo, spec) {
  const textoCurto = extrairTextoCurto(fase.texto);
  const palavras = (textoCurto.replace(/<[^>]+>/g, '').match(/\b\w{4,}\b/g) || ['leitura']).slice(0, 6);
  const alvoPreset = spec && spec.alvo ? String(spec.alvo) : '';
  const alvo = alvoPreset || palavras[Math.floor(Math.random() * palavras.length)];
  const opcoesPreset = spec && Array.isArray(spec.opcoes) && spec.opcoes.length >= 2
    ? spec.opcoes.map(String)
    : null;
  const distratores = embaralhar(
    ['estrela', 'nuvem', 'pedra', 'livro', 'vento', 'chuva', 'foguete', 'floresta'].filter(p => p !== alvo)
  ).slice(0, 3);
  const opcoes = opcoesPreset
    ? embaralhar(opcoesPreset.includes(alvo) ? opcoesPreset : [alvo, ...opcoesPreset])
    : embaralhar([alvo, ...distratores]);

  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <p class="mg-desc">Ouça a palavra e escolha a correta entre as opções!</p>
    <div style="text-align:center;margin:16px 0">
      <button class="btn-ouvir-palavra" id="btnOuvirPalavra" aria-label="Ouvir palavra">
        🔊 Ouvir a palavra
      </button>
    </div>
    <div style="text-align:center;margin:0 0 12px;display:flex;justify-content:center;gap:10px;">
      <button class="btn-secundario" id="btnNaoOuco" aria-label="Não consigo ouvir">
        Não consigo ouvir
      </button>
      <button class="btn-desistir-mg" id="btnDesistirSomPalavra">
        🏳️ Solução
      </button>
    </div>
    <div class="sp-grid">
      ${opcoes.map(op => `<button class="sp-btn" data-palavra="${op}" aria-label="${op}">${op}</button>`).join('')}
    </div>
  `;
  corpo.appendChild(wrap);

  setTimeout(() => falarTexto(alvo), 400);

  document.getElementById('btnOuvirPalavra').addEventListener('click', () => falarTexto(alvo));
  document.getElementById('btnNaoOuco').addEventListener('click', () => {
    registrarEventoMG('som_palavra', 'nao_consigo_ouvir', { alvo });
    const alternativas = ['verdadeiro_falso', 'monta_frase', 'escolha', 'completar']
      .filter(t => !estado.minigamesLista.includes(t));
    const novoTipo = alternativas[0] || 'verdadeiro_falso';
    estado.minigamesLista[estado.minigameAtual] = novoTipo;
    if (estado.minigamesPreset && estado.minigamesPreset[estado.minigameAtual]) {
      estado.minigamesPreset[estado.minigameAtual] = { tipo: novoTipo };
    }
    renderizarMinigame();
    mostrarToast('Tudo bem! Vamos para outro jogo sem perder pontos 💛');
  });

  const revelarResposta = (clicouResp, btnClicado) => {
    const btnDesistir = document.getElementById('btnDesistirSomPalavra');
    if (btnDesistir) btnDesistir.disabled = true;

    const ok = clicouResp ? (btnClicado && btnClicado.dataset.palavra === alvo) : false;
    registrarEventoMG('som_palavra', ok ? 'acerto' : 'erro');

    wrap.querySelectorAll('.sp-btn').forEach(b => {
      b.disabled = true;
      if (b.dataset.palavra === alvo) {
        b.classList.add('correta');
        b.innerHTML = `${alvo}`;
      }
    });

    if (clicouResp && !ok && btnClicado) {
      btnClicado.classList.add('errada');
      btnClicado.innerHTML = `${btnClicado.dataset.palavra}`;
    }

    mostrarFeedbackMG(ok);
  };

  wrap.querySelectorAll('.sp-btn').forEach(btn => {
    btn.addEventListener('click', () => revelarResposta(true, btn));
  });

  document.getElementById('btnDesistirSomPalavra')?.addEventListener('click', () => revelarResposta(false, null));
}

function ehOpcaoGenerica(opcoes) {
  if (!Array.isArray(opcoes) || opcoes.length < 2) return true;
  return opcoes.some(op => {
    const s = String(op || '').trim().toLowerCase();
    return s.includes('opção a') || s.includes('opcao a') || s.includes('opção b') || s.includes('opcao b') || s === 'opcao 1' || s === 'opção 1';
  });
}

function gerarEscolhaPorGenero(h, fase) {
  const historia = h || estado.historiaAtual || {};
  const id = historia.id;
  const genero = String(historia.genero || 'narrativo').toLowerCase();
  const titulo = historia.titulo || 'a história';
  const palavras = historia.palavrasChave || [];
  const p1 = palavras[0] || 'o elemento principal';
  const p2 = palavras[1] || 'os acontecimentos';

  const PERGUNTAS_PREDEFINIDAS = {
    n1: {
      pergunta: 'Qual era o grande segredo de Léo, o leão?',
      correta: 'Ele tinha medo do escuro quando a noite chegava',
      distratores: [
        'Ele não sabia rugir alto com os outros animais',
        'Ele não gostava de brincar com a zebra e o macaco'
      ]
    },
    n2: {
      pergunta: 'O que Marina colecionava em seu caderno azul?',
      correta: 'Desenhos dos formatos curiosos das nuvens que via no céu',
      distratores: [
        'Folhas secas e flores coloridas coladas das árvores',
        'Moedas antigas e carimbos de outros países'
      ]
    },
    n3: {
      pergunta: 'O que os livros brilhantes guardavam na biblioteca secreta?',
      correta: 'Histórias verdadeiras que precisavam ser lidas para não desaparecer',
      distratores: [
        'Fórmulas científicas para inventar máquinas do futuro',
        'Mapas antigos de ilhas escondidas com tesouros de piratas'
      ]
    },
    p1: {
      pergunta: 'No poema "A Chuva Cantando", como o personagem se diverte com a chuva?',
      correta: 'Saindo de guarda-chuva para pular nas poças de água da rua',
      distratores: [
        'Ficando dormindo sob as cobertas até a tempestade passar',
        'Desenhando a chuva no papel sentado dentro de casa'
      ]
    },
    p2: {
      pergunta: 'No poema "Palavras que Voam", com o que as palavras lidas são comparadas?',
      correta: 'Com pássaros que ganham asas ao serem lidas e voam até as casas',
      distratores: [
        'Com estrelas que piscam bem alto no céu à noite',
        'Com peixes coloridos que nadam velozes no oceano'
      ]
    },
    i1: {
      pergunta: 'Qual é o objetivo principal das instruções para a casinha de pássaros?',
      correta: 'Construir um lar acolhedor para os passarinhos do jardim',
      distratores: [
        'Fazer um brinquedo com rodas para rolar no chão',
        'Montar um barco de madeira para navegar na lagoa'
      ]
    },
    i2: {
      pergunta: 'O que é fundamental ao preparar uma cápsula do tempo?',
      correta: 'Reunir cartas e objetos simbólicos com honestidade para o futuro',
      distratores: [
        'Comprar objetos muito caros para mostrar riqueza',
        'Guardar alimentos perecíveis para provar depois de dez anos'
      ]
    },
    d1: {
      pergunta: 'Quais detalhes visuais se destacam na descrição do fundo do mar?',
      correta: 'A luz filtrada pela água e a variedade de corais e peixes vibrantes',
      distratores: [
        'Uma rua movimentada cheia de carros e barulho de buzinas',
        'Uma floresta fria com neve caindo sobre os pinheiros'
      ]
    },
    d2: {
      pergunta: 'Como o jardim da vovó é caracterizado no texto descritivo?',
      correta: 'Um ambiente alegre, florido, cheiroso, colorido e tranquilo',
      distratores: [
        'Um deserto quente, seco e sem nenhuma flor',
        'Um galpão escuro cheio de caixas de papelão'
      ]
    },
    inf1: {
      pergunta: 'Segundo o texto informativo, por que o céu aparece azul durante o dia?',
      correta: 'Porque a luz azul do Sol é espalhada pelas partículas da atmosfera',
      distratores: [
        'Porque a água dos oceanos é refletida diretamente no céu',
        'Porque as nuvens absorvem a luz amarela e soltam a tinta azul'
      ]
    },
    inf2: {
      pergunta: 'Por que a Floresta Amazônica é chamada de "pulmão do mundo"?',
      correta: 'Porque suas árvores absorvem dióxido de carbono e liberam oxigênio',
      distratores: [
        'Porque ela sopra ventos fortes para todos os outros continentes',
        'Porque é o único lugar do planeta onde chove todos os dias'
      ]
    }
  };

  if (id && PERGUNTAS_PREDEFINIDAS[id]) {
    const item = PERGUNTAS_PREDEFINIDAS[id];
    const opcoesObj = [
      { texto: item.correta, correta: true },
      { texto: item.distratores[0], correta: false },
      { texto: item.distratores[1], correta: false }
    ];
    const emb = embaralhar(opcoesObj);
    return {
      pergunta: item.pergunta,
      opcoes: emb.map(o => o.texto),
      correta: emb.findIndex(o => o.correta)
    };
  }

  let pergunta = '';
  let respostaCorreta = '';
  let distrator1 = '';
  let distrator2 = '';

  switch (genero) {
    case 'poetico':
      pergunta = `Sobre o poema "${titulo}", qual é o sentimento ou imagem poética principal?`;
      respostaCorreta = `A beleza e o ritmo da linguagem ao tratar de ${p1}`;
      distrator1 = `Instruções técnicas para montar uma estrutura de madeira`;
      distrator2 = `Tabelas de dados numéricos sobre finanças urbanas`;
      break;

    case 'instrucional':
      pergunta = `Qual é o objetivo principal das instruções do texto "${titulo}"?`;
      respostaCorreta = `Ensinar passo a passo como realizar ou construir algo com ${p1}`;
      distrator1 = `Narrar uma conto antigo sobre reinos e fadas mágicas`;
      distrator2 = `Descrever as ondas e peixes do fundo do oceano`;
      break;

    case 'descritivo':
      pergunta = `Quais características sensoriais principais são descritas em "${titulo}"?`;
      respostaCorreta = `Cores, aromas e detalhes marcantes do ambiente de ${p1}`;
      distrator1 = `Um diálogo rápido de suspense entre detetives`;
      distrator2 = `Uma lista de pontuações de jogos esportivos`;
      break;

    case 'informativo':
      pergunta = `Qual informação ou explicação factual central é tratada no texto "${titulo}"?`;
      respostaCorreta = `A explicação clara e factual sobre a importância de ${p1}`;
      distrator1 = `Uma lenda inventada sobre duendes e magia`;
      distrator2 = `Um poema rimado sobre cantigas de roda`;
      break;

    case 'narrativo':
    default:
      pergunta = `Na história "${titulo}", qual acontecimento marcou o percurso dos personagens?`;
      respostaCorreta = `A jornada e as descobertas envolvendo ${p1} e ${p2}`;
      distrator1 = `A chegada repentina de um disco voador vindo do espaço`;
      distrator2 = `Uma competição de corrida de fórmula 1 na cidade`;
      break;
  }

  const opcoesObj = [
    { texto: respostaCorreta, correta: true },
    { texto: distrator1, correta: false },
    { texto: distrator2, correta: false }
  ];
  const emb = embaralhar(opcoesObj);
  return {
    pergunta,
    opcoes: emb.map(o => o.texto),
    correta: emb.findIndex(o => o.correta)
  };
}

function renderEscolhaMG(fase, corpo, spec) {
  const h = estado.historiaAtual;
  let pergunta;
  let opcoes;
  let correta;

  const usarSpec = spec && spec.pergunta && Array.isArray(spec.opcoes) && !ehOpcaoGenerica(spec.opcoes);

  if (usarSpec) {
    pergunta = spec.pergunta;
    opcoes = spec.opcoes.map(String);
    correta = typeof spec.correta === 'number' ? spec.correta : 0;
  } else {
    const gerado = gerarEscolhaPorGenero(h, fase);
    pergunta = gerado.pergunta;
    opcoes = gerado.opcoes;
    correta = gerado.correta;
  }

  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <p class="mg-desc">${pergunta}</p>
    <div class="mc-opcoes">
      ${opcoes.map((op, i) => `<button class="mc-btn" data-idx="${i}">${op}</button>`).join('')}
    </div>
    <div style="text-align:center;margin-top:12px;">
      <button class="btn-desistir-mg" id="btnDesistirEscolha">🏳️ Desistir / Ver Solução</button>
    </div>
  `;
  corpo.appendChild(wrap);

  const revelarResposta = (clicou, btnClicado) => {
    const btnDesistir = document.getElementById('btnDesistirEscolha');
    if (btnDesistir) btnDesistir.disabled = true;

    const idx = btnClicado ? parseInt(btnClicado.dataset.idx, 10) : -1;
    const ok = clicou ? (idx === correta) : false;
    registrarEventoMG('escolha', ok ? 'acerto' : 'erro');

    wrap.querySelectorAll('.mc-btn').forEach(b => {
      b.disabled = true;
      const bIdx = parseInt(b.dataset.idx, 10);
      if (bIdx === correta) {
        b.classList.add('correta');
        b.innerHTML = `${opcoes[correta]} ✓`;
      }
    });

    if (clicou && !ok && btnClicado) {
      btnClicado.classList.add('errada');
      btnClicado.innerHTML = `${opcoes[idx]} ✗`;
    }

    mostrarFeedbackMG(ok);
  };

  wrap.querySelectorAll('.mc-btn').forEach(btn => {
    btn.addEventListener('click', () => revelarResposta(true, btn));
  });

  document.getElementById('btnDesistirEscolha')?.addEventListener('click', () => revelarResposta(false, null));
}

function renderCompletarMG(fase, corpo, spec) {
  const h = estado.historiaAtual;
  const dados = montarDadosCompletarMG(fase, h, spec);
  const wrap = document.createElement('div');
  wrap.className = 'mg-completar-wrap';
  wrap.innerHTML = `
    <p class="mg-desc">${dados.instrucao}</p>
    <div class="mg-frase-lacuna" id="mgFraseLacuna">${formatarFraseLacunaHtml(dados.frase)}</div>
    ${dados.dica ? `<p class="mg-completar-dica">💡 Dica: ${dados.dica}</p>` : ''}
    <div class="mg-completar-input-row interacao-input-area">
      <input type="text" class="interacao-input mg-input-palavra" id="mgInputCompletar"
        placeholder="Digite uma palavra..." autocomplete="off" aria-label="Palavra para completar a frase" maxlength="40" />
      <button class="btn-confirmar" id="mgBtnCompletar">✓ OK</button>
    </div>
    <div style="text-align:center;margin-top:10px;">
      <button class="btn-desistir-mg" id="mgBtnDesistirCompletar">🏳️ Desistir / Ver Solução</button>
    </div>
  `;
  corpo.appendChild(wrap);
  const norm = (s) => String(s || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const input = document.getElementById('mgInputCompletar');
  const btn = document.getElementById('mgBtnCompletar');
  const btnDesistir = document.getElementById('mgBtnDesistirCompletar');
  const resposta = dados.resposta;

  const validar = (isDesistir = false) => {
    if (btnDesistir) btnDesistir.disabled = true;
    input.disabled = true;
    btn.disabled = true;

    if (isDesistir) {
      document.getElementById('mgFraseLacuna').innerHTML =
        limparTextoCompletar(String(dados.frase || '').replace(/<[^>]+>/g, ''))
          .replace(/_{2,}|___/g, `<span class="lacuna-correta">${resposta} ✓</span>`);
      input.value = resposta;
      input.classList.add('correta');
      registrarEventoMG('completar', 'erro');
      mostrarFeedbackMG(false);
      return;
    }

    const v = norm(input.value);
    const c = norm(resposta);
    const completo = v === c;
    const parcial = Boolean(v && (c.includes(v) || v.includes(c)));
    const temAcerto = completo || parcial;
    registrarEventoMG('completar', temAcerto ? 'acerto' : 'erro');

    if (temAcerto) {
      document.getElementById('mgFraseLacuna').innerHTML =
        limparTextoCompletar(String(dados.frase || '').replace(/<[^>]+>/g, ''))
          .replace(/_{2,}|___/g, `<span class="lacuna-correta">${resposta} ✓</span>`);
      input.value = resposta;
      input.classList.add('correta');
    } else {
      document.getElementById('mgFraseLacuna').innerHTML =
        limparTextoCompletar(String(dados.frase || '').replace(/<[^>]+>/g, ''))
          .replace(/_{2,}|___/g, `<span class="lacuna-correta" style="border-color:#EF4444;color:#B91C1C;background:#FEE2E2;">${resposta} ✗</span>`);
      input.value = resposta;
      input.classList.add('errada');
    }

    mostrarFeedbackMG(temAcerto);
  };

  btn.addEventListener('click', () => validar(false));
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') validar(false); });
  btnDesistir?.addEventListener('click', () => validar(true));
}

function renderColorirMG(h, corpo, spec) {
  const alvo = (spec && Array.isArray(spec.palavrasAlvo) && spec.palavrasAlvo.length
    ? spec.palavrasAlvo
    : (h.palavrasChave || []).slice(0, 5));
  const distratoras = (spec && Array.isArray(spec.distratoras) && spec.distratoras.length
    ? spec.distratoras
    : ['castelo', 'peixe', 'janela', 'foguete', 'estrada'])
    .filter((p) => !alvo.includes(p))
    .slice(0, 3);
  const itens = embaralhar([...alvo.map((p) => ({ p, correta: true })), ...distratoras.map((p) => ({ p, correta: false }))]);
  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <p class="mg-desc">Clique nas palavras que aparecem na história!</p>
    <div class="rima-opcoes-grid">
      ${itens.map((it, i) => `<button class="rima-opc" data-idx="${i}">${it.p}</button>`).join('')}
    </div>
    <div class="mg-acoes-row">
      <button class="btn-confirmar" id="btnConfColorir" style="flex:1;">✔ Confirmar</button>
      <button class="btn-desistir-mg" id="btnDesistirColorir">🏳️ Solução</button>
    </div>
  `;
  corpo.appendChild(wrap);
  const selecionadas = new Set();
  wrap.querySelectorAll('.rima-opc').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.idx, 10);
      if (selecionadas.has(idx)) {
        selecionadas.delete(idx);
        btn.classList.remove('correta');
      } else {
        selecionadas.add(idx);
        btn.classList.add('correta');
      }
    });
  });

  const finalizar = (isDesistir = false) => {
    let ok = false;
    if (isDesistir) {
      ok = false;
    } else {
      let acertosCount = 0;
      itens.forEach((it, idx) => {
        const marcado = selecionadas.has(idx);
        if (marcado === it.correta) acertosCount++;
      });
      ok = (acertosCount / itens.length) > 0.5;
    }

    registrarEventoMG('colorir', ok ? 'acerto' : 'erro');
    wrap.querySelectorAll('.rima-opc').forEach((btn, idx) => {
      btn.disabled = true;
      btn.classList.remove('correta');
      if (itens[idx].correta) {
        btn.classList.add('correta');
        btn.innerHTML = `${itens[idx].p} ✓`;
      } else if (selecionadas.has(idx)) {
        btn.classList.add('errada');
        btn.innerHTML = `${itens[idx].p} ✗`;
      }
    });

    document.getElementById('btnConfColorir').disabled = true;
    document.getElementById('btnDesistirColorir').disabled = true;
    mostrarFeedbackMG(ok);
  };

  document.getElementById('btnConfColorir').addEventListener('click', () => finalizar(false));
  document.getElementById('btnDesistirColorir')?.addEventListener('click', () => finalizar(true));
}

// ─── 3. MONTA-FRASE ──────────────────────────────────────────────────────────
function extrairTextoCurto(texto) {
  if (!texto) return '';
  const limpo = String(texto).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  if (!limpo) return '';
  const frases = limpo.split(/[.!?]/).map((f) => f.trim()).filter(Boolean);
  const fraseCurta = frases.find((f) => f.length >= 8 && f.length <= 140) || frases[0] || limpo;
  return fraseCurta.length > 140 ? `${fraseCurta.slice(0, 137)}...` : fraseCurta;
}

function renderMontaFrase(fase, corpo, spec) {
  const h = estado.historiaAtual;
  const dadosSpec = spec ? extrairDadosMontaFrase(spec) : null;
  if (dadosSpec && dadosSpec.palavrasPool.length >= 2 && dadosSpec.palavrasCorretas.length >= 2) {
    const embaralhadas = embaralhar(dadosSpec.palavrasPool.map(String));
    const palavrasCorretas = dadosSpec.palavrasCorretas.map(String);
    let colocadosIdx = [];
    const wrap = document.createElement('div');
    wrap.className = 'mf-wrap';
    wrap.innerHTML = `
      <p class="mg-desc">${dadosSpec.pergunta}</p>
      <p class="mg-desc">Monte a frase clicando nas palavras. Clique em uma palavra já colocada para removê-la.</p>
      <div class="mf-espaco" id="mfEspaco"><span class="mf-placeholder">Clique nas palavras abaixo…</span></div>
      <div class="mf-pool" id="mfPool"></div>
      <div class="mg-acoes-row">
        <button class="btn-confirmar" id="btnConfMF" style="flex:1;">✔ Verificar</button>
        <button class="btn-desistir-mg" id="btnDesistirMF">🏳️ Solução</button>
      </div>
    `;
    corpo.appendChild(wrap);
    function atualizarPreset() {
      const pool = document.getElementById('mfPool');
      const espaco = document.getElementById('mfEspaco');
      pool.innerHTML = embaralhadas.map((p, i) =>
        `<button class="mf-chip ${colocadosIdx.includes(i) ? 'mf-usada' : ''}" data-idx="${i}">${p}</button>`
      ).join('');
      if (colocadosIdx.length === 0) {
        espaco.innerHTML = '<span class="mf-placeholder">Clique nas palavras abaixo…</span>';
      } else {
        espaco.innerHTML = colocadosIdx.map((i, pos) =>
          `<button class="mf-colocada" data-pos="${pos}">${embaralhadas[i]}</button>`
        ).join(' ');
      }
      pool.querySelectorAll('.mf-chip:not(.mf-usada)').forEach(btn => {
        btn.addEventListener('click', () => {
          colocadosIdx.push(parseInt(btn.dataset.idx, 10));
          atualizarPreset();
        });
      });
      espaco.querySelectorAll('.mf-colocada').forEach(btn => {
        btn.addEventListener('click', () => {
          colocadosIdx.splice(parseInt(btn.dataset.pos, 10), 1);
          atualizarPreset();
        });
      });
    }
    atualizarPreset();
    const norm = (s) => String(s || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const verificarMF = (isDesistir = false) => {
      document.getElementById('btnConfMF').disabled = true;
      document.getElementById('btnDesistirMF').disabled = true;

      if (isDesistir) {
        revelarMontaFraseCorreta(palavrasCorretas);
        registrarEventoMG('monta_frase', 'erro');
        mostrarFeedbackMG(false);
        return;
      }

      if (colocadosIdx.length < 2) {
        document.getElementById('btnConfMF').disabled = false;
        document.getElementById('btnDesistirMF').disabled = false;
        mostrarToast('Monte a frase primeiro! 😊');
        return;
      }

      const tentativa = norm(colocadosIdx.map(i => embaralhadas[i]).join(' '));
      const correta = norm(palavrasCorretas.join(' '));
      const ok = tentativa === correta;
      revelarMontaFraseCorreta(palavrasCorretas);
      registrarEventoMG('monta_frase', ok ? 'acerto' : 'erro');
      mostrarFeedbackMG(ok);
    };

    document.getElementById('btnConfMF').addEventListener('click', () => verificarMF(false));
    document.getElementById('btnDesistirMF')?.addEventListener('click', () => verificarMF(true));
    return;
  }

  // ── Extrai frase COMPLETA (terminada em . ! ? ou verso de poema via <br>) ──
  // Substitui <br> por ponto para capturar versos de poemas
  const normalizarTextoParaFrases = (t) =>
    String(t || '')
      .replace(/<br\s*\/?>/gi, '. ')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  const contarPalavras = (s) => s.split(/\s+/).filter(Boolean).length;

  // Extrai segmentos por pontuação final; filtra pela faixa de palavras desejada
  const extrairPorPontuacao = (texto, min, max) =>
    (texto.match(/[^.!?]+[.!?]+/g) || [])
      .map(f => f.trim())
      .filter(f => { const n = contarPalavras(f); return n >= min && n <= max; });

  // Tenta combinar dois segmentos curtos adjacentes separados por vírgula/travessão
  // para formar frases com sentido e tamanho adequado (5–10 palavras)
  const combinarSegmentos = (texto, min, max) => {
    const segmentos = (texto.match(/[^.!?]+[.!?]+/g) || []).map(f => f.trim());
    const resultado = [];
    for (let i = 0; i < segmentos.length - 1; i++) {
      const a = segmentos[i].replace(/[.!?]+$/, '').trim();
      const b = segmentos[i + 1].replace(/[.!?]+$/, '').trim();
      const juntos = `${a} ${b}`;
      const n = contarPalavras(juntos);
      if (n >= min && n <= max) resultado.push(juntos + '.');
    }
    return resultado;
  };

  const textoFonte = normalizarTextoParaFrases(fase?.texto || '');
  const textoHistoria = normalizarTextoParaFrases(obterTextoBaseHistoria(h));

  // Cascata: 5–10 palavras → combina segmentos → 4–10 palavras → VF
  let frasesValidas =
    extrairPorPontuacao(textoFonte, 5, 10).concat(extrairPorPontuacao(textoHistoria, 5, 10));

  if (frasesValidas.length === 0) {
    frasesValidas = combinarSegmentos(textoHistoria, 5, 10);
  }

  if (frasesValidas.length === 0) {
    // Aceita frases com 4+ palavras antes de desistir
    frasesValidas = extrairPorPontuacao(textoFonte, 4, 10).concat(extrairPorPontuacao(textoHistoria, 4, 10));
  }

  // Escolhe uma frase aleatória entre as válidas
  const fraseSelecionada = frasesValidas.length > 0
    ? frasesValidas[Math.floor(Math.random() * frasesValidas.length)]
    : null;

  // Remove pontuação final para não aparecer como palavra separada
  const frase = fraseSelecionada
    ? fraseSelecionada.replace(/[.!?]+$/, '').trim()
    : null;

  if (!frase) {
    // Sem nenhuma frase válida — usa VF como fallback seguro
    renderVerdadeiroFalso(fase, h, corpo, null);
    return;
  }

  const palavrasCorretas = frase.split(/\s+/).filter(Boolean);
  const embaralhadas = embaralhar([...palavrasCorretas]);


  let colocadosIdx = [];

  const wrap = document.createElement('div');
  wrap.className = 'mf-wrap';
  wrap.innerHTML = `
   
    <p class="mg-desc">Monte a frase clicando nas palavras. Clique em uma palavra já colocada para removê-la.</p>
    <div class="mf-espaco" id="mfEspaco"><span class="mf-placeholder">Clique nas palavras abaixo…</span></div>
    <div class="mf-pool" id="mfPool"></div>
    <div class="mg-acoes-row">
      <button class="btn-confirmar" id="btnConfMF" style="flex:1;">✔ Verificar</button>
      <button class="btn-desistir-mg" id="btnDesistirMF">🏳️ Solução</button>
    </div>
  `;
  corpo.appendChild(wrap);

  function atualizar() {
    const pool = document.getElementById('mfPool');
    const espaco = document.getElementById('mfEspaco');

    pool.innerHTML = embaralhadas.map((p, i) =>
      `<button class="mf-chip ${colocadosIdx.includes(i) ? 'mf-usada' : ''}" data-idx="${i}">${p}</button>`
    ).join('');

    if (colocadosIdx.length === 0) {
      espaco.innerHTML = '<span class="mf-placeholder">Clique nas palavras abaixo…</span>';
    } else {
      espaco.innerHTML = colocadosIdx.map((i, pos) =>
        `<button class="mf-colocada" data-pos="${pos}">${embaralhadas[i]}</button>`
      ).join(' ');
    }

    pool.querySelectorAll('.mf-chip:not(.mf-usada)').forEach(btn => {
      btn.addEventListener('click', () => {
        colocadosIdx.push(parseInt(btn.dataset.idx));
        atualizar();
      });
    });

    espaco.querySelectorAll('.mf-colocada').forEach(btn => {
      btn.addEventListener('click', () => {
        colocadosIdx.splice(parseInt(btn.dataset.pos), 1);
        atualizar();
      });
    });
  }
  atualizar();

  const verificarMF = (isDesistir = false) => {
    document.getElementById('btnConfMF').disabled = true;
    document.getElementById('btnDesistirMF').disabled = true;

    if (isDesistir) {
      revelarMontaFraseCorreta(palavrasCorretas);
      registrarEventoMG('monta_frase', 'erro');
      mostrarFeedbackMG(false);
      return;
    }

    if (colocadosIdx.length < 2) {
      document.getElementById('btnConfMF').disabled = false;
      document.getElementById('btnDesistirMF').disabled = false;
      mostrarToast('Monte a frase primeiro! 😊');
      return;
    }

    const tentativa = colocadosIdx.map(i => embaralhadas[i]).join(' ').toLowerCase().trim();
    const correta = palavrasCorretas.join(' ').toLowerCase().trim();
    const ok = tentativa === correta;
    revelarMontaFraseCorreta(palavrasCorretas);
    registrarEventoMG('monta_frase', ok ? 'acerto' : 'erro');
    mostrarFeedbackMG(ok);
  };

  document.getElementById('btnConfMF').addEventListener('click', () => verificarMF(false));
  document.getElementById('btnDesistirMF')?.addEventListener('click', () => verificarMF(true));
}

// ─── 4. VERDADEIRO OU FALSO ──────────────────────────────────────────────────
function renderVerdadeiroFalso(fase, h, corpo, spec) {
  let item;
  if (spec && (spec.afirmacao || spec.pergunta) && typeof spec.correta === 'number') {
    const afirmacao = String(spec.afirmacao || spec.pergunta || '').trim();
    item = { afirmacao, correta: spec.correta === 0 };
  } else if (spec && (spec.afirmacao || spec.pergunta)) {
    const afirmacao = String(spec.afirmacao || spec.pergunta || '').trim();
    item = { afirmacao, correta: true };
  } else {
    // ── Extrai conteúdo real da história ─────────────────────────────────────
    const textoHistoria = obterTextoBaseHistoria(h)
      .replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

    const textoFase = fase ? extrairTextoCurto(String(fase.texto || '')) : '';

    // ── Palavras-chave: validadas + ordenadas por frequência no texto ─────────
    const STOPWORDS = new Set([
      'para', 'como', 'mais', 'pela', 'pelo', 'esse', 'essa', 'isso', 'uma',
      'uns', 'umas', 'são', 'está', 'este', 'esta', 'aqui', 'onde', 'quando',
      'então', 'muito', 'também', 'assim', 'fazer', 'pode', 'com', 'que',
      'não', 'mas', 'por', 'foi', 'ser', 'tem', 'seu', 'sua', 'nos', 'nas',
      'dos', 'das', 'ele', 'ela', 'tinha', 'dele', 'dela', 'numa', 'num',
      'após', 'logo', 'cada', 'todo', 'toda', 'entre', 'sobre', 'seus', 'suas'
    ]);

    // Conta frequência das palavras no texto para selecionar as mais relevantes
    const freq = {};
    textoHistoria.split(/\s+/)
      .map(p => p.replace(/[^a-zA-ZÀ-ú]/g, '').trim().toLowerCase())
      .filter(p => p.length >= 4 && !STOPWORDS.has(p))
      .forEach(p => { freq[p] = (freq[p] || 0) + 1; });

    const palavrasPorFreq = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .map(([p]) => p);

    // Combina palavrasChave do modelo + palavras mais frequentes do texto
    const palavrasValidas = (h.palavrasChave || [])
      .map(p => String(p || '').trim().toLowerCase())
      .filter(p => p.length >= 2 && p !== 'undefined' && p !== 'null');

    const todasPalavras = [...new Set([...palavrasValidas, ...palavrasPorFreq])].slice(0, 8);

    const kw = todasPalavras[0] || 'história';
    const kw2 = todasPalavras[1] || kw;
    const kw3 = todasPalavras[2] || kw2;

    // ── Frases reais do texto para afirmações ──────────────────────────────────
    const frasesTexto = textoHistoria
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length >= 20 && s.length <= 115);

    const fraseReal = textoFase.length >= 15
      ? textoFase
      : (frasesTexto[Math.floor(Math.random() * frasesTexto.length)] || textoHistoria.slice(0, 100).trim());

    const outraFrase = frasesTexto.find(f => f !== fraseReal) || fraseReal;

    // Título e gênero
    const titulo = String(h.titulo || '').trim();

    // ── Distratores contextuais — claramente errados ───────────────────────────
    const lugaresErrados = ['em outro planeta', 'no fundo do mar', 'no espaço sideral', 'no polo norte', 'numa nave espacial'];
    const personErrados = ['um robô gigante', 'um extraterrestre', 'um super-herói voador', 'um vampiro'];
    const lugarDistrator = lugaresErrados[Math.floor(Math.random() * lugaresErrados.length)];
    const personDistrator = personErrados[Math.floor(Math.random() * personErrados.length)];

    // ── Pool variado de perguntas ──────────────────────────────────────────────
    const pool = [
      // ─ Verdadeiras: baseadas em conteúdo real ─────────────────────────────
      fraseReal.length >= 15
        ? { afirmacao: `"${fraseReal.length > 105 ? fraseReal.slice(0, 102) + '…' : fraseReal}" é um trecho da história.`, correta: true }
        : null,
      outraFrase.length >= 15 && outraFrase !== fraseReal
        ? { afirmacao: `"${outraFrase.length > 105 ? outraFrase.slice(0, 102) + '…' : outraFrase}" aparece no texto.`, correta: true }
        : null,
      { afirmacao: `A palavra "${kw}" aparece no texto da história.`, correta: true },
      kw2 !== kw
        ? { afirmacao: `Tanto "${kw}" quanto "${kw2}" fazem parte da história.`, correta: true }
        : null,
      kw3 !== kw2
        ? { afirmacao: `O texto menciona "${kw}", "${kw2}" e "${kw3}".`, correta: true }
        : null,
      titulo
        ? { afirmacao: `Esta história se chama "${titulo}".`, correta: true }
        : null,

      // ─ Falsas: distratores contextuais e negações ─────────────────────────
      { afirmacao: `A história se passa ${lugarDistrator}.`, correta: false },
      { afirmacao: `O personagem principal da história é ${personDistrator}.`, correta: false },
      { afirmacao: `"${kw}" não aparece em nenhum momento da história.`, correta: false },
      kw2 !== kw
        ? { afirmacao: `A palavra "${kw2}" nunca é mencionada no texto.`, correta: false }
        : null,
      { afirmacao: `A história não apresenta nenhum personagem ou elemento principal.`, correta: false },
      { afirmacao: `A história foi escrita em outro idioma e traduzida.`, correta: false },
    ].filter(p =>
      p &&
      p.afirmacao &&
      !p.afirmacao.includes('undefined') &&
      !p.afirmacao.includes('null') &&
      p.afirmacao.trim().length > 10
    );

    item = pool[Math.floor(Math.random() * pool.length)]
      || { afirmacao: `A palavra "${kw}" aparece na história.`, correta: true };
  }


  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <p class="mg-desc">Leia a afirmação e diga se é verdadeira ou falsa!</p>
    <div class="tf-afirmacao">"${item.afirmacao}"</div>
    <div class="tf-opcoes">
      <button class="tf-btn tf-v" id="tfV" aria-label="Verdadeiro">✅ Verdadeiro</button>
      <button class="tf-btn tf-f" id="tfF" aria-label="Falso">❌ Falso</button>
    </div>
    <div style="text-align:center;margin-top:12px;">
      <button class="btn-desistir-mg" id="btnDesistirTF">🏳️ Desistir / Ver Solução</button>
    </div>
  `;
  corpo.appendChild(wrap);

  const verificar = (clicou, resp) => {
    document.getElementById('tfV').disabled = true;
    document.getElementById('tfF').disabled = true;
    const btnDesistir = document.getElementById('btnDesistirTF');
    if (btnDesistir) btnDesistir.disabled = true;

    const ok = clicou ? (resp === item.correta) : false;
    const btnCorreto = item.correta ? document.getElementById('tfV') : document.getElementById('tfF');
    btnCorreto.classList.add('correta');
    btnCorreto.innerHTML = (item.correta ? '✅ Verdadeiro' : '❌ Falso') + ' ✓';

    if (clicou && !ok) {
      const btnErrado = resp ? document.getElementById('tfV') : document.getElementById('tfF');
      btnErrado.classList.add('errada');
      btnErrado.innerHTML = (resp ? '✅ Verdadeiro' : '❌ Falso') + ' ✗';
    }

    registrarEventoMG('verdadeiro_falso', ok ? 'acerto' : 'erro');
    mostrarFeedbackMG(ok);
  };

  document.getElementById('tfV').addEventListener('click', () => verificar(true, true));
  document.getElementById('tfF').addEventListener('click', () => verificar(true, false));
  document.getElementById('btnDesistirTF')?.addEventListener('click', () => verificar(false, false));
}

// ─── 5. CAÇA-PALAVRAS ────────────────────────────────────────────────────────
function renderCacaPalavras(fase, h, corpo) {
  const normalize = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z]/g, '').substring(0, 15);

  // Só aceita palavras únicas (sem espaço) com 3–11 letras normalizadas
  const filtrarPalavras = (lista) => [...new Set(
    (lista || [])
      .filter(p => typeof p === 'string' && !p.trim().includes(' '))
      .map(normalize)
      .filter(p => p.length >= 3 && p.length <= 11)
  )];

  let palavrasAlvo = filtrarPalavras(h.palavrasChave).slice(0, 4);

  // Fallback: extrai palavras relevantes do texto da história
  if (palavrasAlvo.length < 4) {
    const STOPWORDS = new Set(['COM', 'UMA', 'UM', 'QUE', 'NAO', 'PAR', 'SER', 'SEUS', 'SUAS', 'ELE', 'ELA', 'ERA', 'FOI', 'TEM', 'VER', 'MAS', 'ATE', 'POR', 'SOB', 'TER', 'MIM', 'TU', 'NO', 'NA', 'DE', 'DO', 'DA', 'OS', 'AS', 'EM', 'SE', 'AO', 'OU', 'JA']);
    const textoLimpo = obterTextoBaseHistoria(h)
      .replace(/<[^>]+>/g, ' ')
      .replace(/[^a-záàâãéêíóôõúüçA-Z\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const extraidasTexto = filtrarPalavras(
      textoLimpo.split(' ').filter(w => w.length >= 4)
    ).filter(p => !STOPWORDS.has(p));
    const jaPresentes = new Set(palavrasAlvo);
    for (const p of extraidasTexto) {
      if (!jaPresentes.has(p) && palavrasAlvo.length < 4) {
        jaPresentes.add(p);
        palavrasAlvo.push(p);
      }
    }
  }

  if (palavrasAlvo.length === 0) { renderVerdadeiroFalso(fase, h, corpo, null); return; }

  const TAM = 12;
  const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const grade = Array.from({ length: TAM }, () => Array(TAM).fill(''));
  const posicoes = {};

  palavrasAlvo.forEach(palavra => {
    const dirs = [{ dr: 0, dc: 1 }, { dr: 1, dc: 0 }];
    let inserida = false;
    for (let t = 0; t < 500 && !inserida; t++) {
      const { dr, dc } = dirs[Math.floor(Math.random() * dirs.length)];
      const maxR = dr === 0 ? TAM : TAM - palavra.length;
      const maxC = dc === 0 ? TAM : TAM - palavra.length;
      if (maxR <= 0 || maxC <= 0) continue;
      const sR = Math.floor(Math.random() * maxR);
      const sC = Math.floor(Math.random() * maxC);
      let ok = true;
      for (let i = 0; i < palavra.length; i++) {
        const r = sR + dr * i, c = sC + dc * i;
        if (grade[r][c] !== '' && grade[r][c] !== palavra[i]) { ok = false; break; }
      }
      if (ok) {
        const cells = [];
        for (let i = 0; i < palavra.length; i++) {
          grade[sR + dr * i][sC + dc * i] = palavra[i];
          cells.push({ r: sR + dr * i, c: sC + dc * i });
        }
        posicoes[palavra] = cells;
        inserida = true;
      }
    }
  });

  for (let r = 0; r < TAM; r++)
    for (let c = 0; c < TAM; c++)
      if (grade[r][c] === '')
        grade[r][c] = LETRAS[Math.floor(Math.random() * LETRAS.length)];

  const dispW = Math.min(window.innerWidth, 700) - 48;
  const CEL = Math.max(22, Math.min(30, Math.floor(dispW / TAM)));
  const FSIZE = Math.max(9, CEL - 14);

  const CORES_PALAVRAS = ['#A855F7', '#FF6B35', '#22C55E', '#3B82F6'];

  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <p class="mg-desc">Arraste da <strong>primeira</strong> até a <strong>última letra</strong> para marcar a palavra!</p>
    <div class="cp-alvos" id="cpAlvos">
      ${palavrasAlvo.map((p, i) => `<span class="cp-alvo" id="cpa-${p}" style="--cor-palavra:${CORES_PALAVRAS[i % CORES_PALAVRAS.length]}">${p}</span>`).join('')}
    </div>
    <div class="cp-scroll-wrap">
      <div class="cp-grade" id="cpGrade" style="grid-template-columns:repeat(${TAM},${CEL}px);width:${TAM * CEL + TAM * 2}px"></div>
    </div>
    <div class="mg-acoes-row">
      <button class="btn-confirmar" id="btnConfCP" style="flex:1;">✔ Terminei</button>
      <button class="btn-desistir-mg" id="btnDesistirCP">🏳️ Solução</button>
    </div>
  `;
  corpo.appendChild(wrap);

  const gridEl = document.getElementById('cpGrade');
  for (let r = 0; r < TAM; r++) {
    for (let c = 0; c < TAM; c++) {
      const cell = document.createElement('div');
      cell.className = 'cp-cel';
      cell.style.cssText = `width:${CEL}px;height:${CEL}px;font-size:${FSIZE}px`;
      cell.textContent = grade[r][c];
      cell.dataset.r = r;
      cell.dataset.c = c;
      gridEl.appendChild(cell);
    }
  }

  let arrastando = false;
  let primeira = null;
  let encontradas = new Set();

  function getCell(r, c) { return gridEl.children[r * TAM + c]; }

  function limparPreview() {
    gridEl.querySelectorAll('.cp-preview').forEach(el => {
      el.classList.remove('cp-preview');
      el.style.removeProperty('--preview-color');
    });
  }

  function coletarSegmento(r1, c1, r2, c2) {
    const dr = r1 === r2 ? 0 : (r2 > r1 ? 1 : -1);
    const dc = c1 === c2 ? 0 : (c2 > c1 ? 1 : -1);
    const res = [];
    let r = r1, c = c1;
    for (; ;) {
      res.push({ r, c, letra: grade[r][c] });
      if (r === r2 && c === c2) break;
      r += dr; c += dc;
    }
    return res;
  }

  function destacarPreview(r1, c1, r2, c2, cor) {
    limparPreview();
    const dr = r1 === r2 ? 0 : (r2 > r1 ? 1 : -1);
    const dc = c1 === c2 ? 0 : (c2 > c1 ? 1 : -1);
    if (dr !== 0 && dc !== 0) return;
    let r = r1, c = c1;
    for (; ;) {
      const el = getCell(r, c);
      if (el && !el.classList.contains('cp-found')) {
        el.classList.add('cp-preview');
        el.style.setProperty('--preview-color', cor);
      }
      if (r === r2 && c === c2) break;
      r += dr; c += dc;
    }
  }

  function tentarConfirmar(r1, c1, r2, c2) {
    const isH = r1 === r2, isV = c1 === c2;
    if (!isH && !isV) return false;
    const seg = coletarSegmento(r1, c1, r2, c2);
    const palavra = seg.map(s => s.letra).join('');
    const palavraR = [...palavra].reverse().join('');
    limparPreview();

    const match = palavrasAlvo.find(p => p === palavra || p === palavraR);
    if (match && !encontradas.has(match)) {
      const cor = CORES_PALAVRAS[palavrasAlvo.indexOf(match) % CORES_PALAVRAS.length];
      encontradas.add(match);
      seg.forEach(({ r: sr, c: sc }) => {
        const el = getCell(sr, sc);
        if (el) {
          el.classList.remove('cp-preview');
          el.classList.add('cp-found');
          el.style.setProperty('--found-color', cor);
        }
      });
      document.getElementById('cpa-' + match)?.classList.add('cp-alvo-found');

      if (encontradas.size >= palavrasAlvo.length) {
        mostrarFeedbackMG(true, true);
        document.getElementById('btnConfCP').disabled = true;
        document.getElementById('btnDesistirCP').disabled = true;
      } else {
        const area = document.getElementById('mg-feedback');
        const card = document.getElementById('mg-feedback-card');
        const emoji = document.getElementById('mg-feedback-emoji');
        const msg = document.getElementById('mg-feedback-msg');
        area.classList.remove('oculto');
        card.style.background = 'linear-gradient(135deg,#DCFCE7,#D1FAE5)';
        card.style.borderColor = 'var(--cor-verde)';
        emoji.textContent = '🎉';
        msg.textContent = `Encontrou "${match}"! (${encontradas.size}/${palavrasAlvo.length})`;
        msg.style.color = '#166534';
      }
      return true;
    } else if (!match || encontradas.has(match)) {
      seg.forEach(({ r: sr, c: sc }) => {
        const el = getCell(sr, sc);
        if (el) { el.classList.add('cp-wrong'); setTimeout(() => el.classList.remove('cp-wrong'), 500); }
      });
      return false;
    }
    return false;
  }

  function getCellFromPoint(x, y) {
    const els = document.elementsFromPoint(x, y);
    return els.find(e => e.classList.contains('cp-cel'));
  }

  const PREVIEW_COLOR = '#FBBF24';

  gridEl.querySelectorAll('.cp-cel').forEach(cell => {
    cell.addEventListener('mousedown', (e) => {
      e.preventDefault();
      if (cell.classList.contains('cp-found')) return;
      arrastando = true;
      primeira = { r: parseInt(cell.dataset.r), c: parseInt(cell.dataset.c) };
      limparPreview();
      cell.classList.add('cp-sel');
    });

    cell.addEventListener('mouseenter', (e) => {
      if (!arrastando || !primeira) return;
      if (cell.classList.contains('cp-found')) return;
      const r = parseInt(cell.dataset.r), c = parseInt(cell.dataset.c);
      gridEl.querySelectorAll('.cp-sel').forEach(el => el.classList.remove('cp-sel'));
      destacarPreview(primeira.r, primeira.c, r, c, PREVIEW_COLOR);
    });

    cell.addEventListener('mouseup', (e) => {
      if (!arrastando || !primeira) return;
      const r = parseInt(cell.dataset.r), c = parseInt(cell.dataset.c);
      if (r === primeira.r && c === primeira.c) {
        limparPreview();
        cell.classList.remove('cp-sel');
        arrastando = false; primeira = null; return;
      }
      tentarConfirmar(primeira.r, primeira.c, r, c);
      gridEl.querySelectorAll('.cp-sel').forEach(el => el.classList.remove('cp-sel'));
      arrastando = false; primeira = null;
    });
  });

  gridEl.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const t = e.touches[0];
    const cell = getCellFromPoint(t.clientX, t.clientY);
    if (!cell || cell.classList.contains('cp-found')) return;
    arrastando = true;
    primeira = { r: parseInt(cell.dataset.r), c: parseInt(cell.dataset.c) };
    limparPreview();
    cell.classList.add('cp-sel');
  }, { passive: false });

  gridEl.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (!arrastando || !primeira) return;
    const t = e.touches[0];
    const cell = getCellFromPoint(t.clientX, t.clientY);
    if (!cell || cell.classList.contains('cp-found')) return;
    const r = parseInt(cell.dataset.r), c = parseInt(cell.dataset.c);
    gridEl.querySelectorAll('.cp-sel').forEach(el => el.classList.remove('cp-sel'));
    destacarPreview(primeira.r, primeira.c, r, c, PREVIEW_COLOR);
  }, { passive: false });

  gridEl.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (!arrastando || !primeira) return;
    const t = e.changedTouches[0];
    const cell = getCellFromPoint(t.clientX, t.clientY);
    if (cell) {
      const r = parseInt(cell.dataset.r), c = parseInt(cell.dataset.c);
      if (!(r === primeira.r && c === primeira.c)) {
        tentarConfirmar(primeira.r, primeira.c, r, c);
      }
    }
    limparPreview();
    gridEl.querySelectorAll('.cp-sel').forEach(el => el.classList.remove('cp-sel'));
    arrastando = false; primeira = null;
  }, { passive: false });

  document.addEventListener('mouseup', () => {
    if (arrastando) {
      limparPreview();
      gridEl.querySelectorAll('.cp-sel').forEach(el => el.classList.remove('cp-sel'));
      arrastando = false; primeira = null;
    }
  });

  const finalizarCP = (isDesistir = false) => {
    document.getElementById('btnConfCP').disabled = true;
    document.getElementById('btnDesistirCP').disabled = true;

    palavrasAlvo.forEach(palavra => {
      if (!encontradas.has(palavra) && posicoes[palavra]) {
        const cor = CORES_PALAVRAS[palavrasAlvo.indexOf(palavra) % CORES_PALAVRAS.length];
        posicoes[palavra].forEach(({ r, c }) => {
          const el = getCell(r, c);
          if (el) {
            el.classList.add('cp-missed');
            el.style.setProperty('--found-color', cor);
          }
        });
        document.getElementById('cpa-' + palavra)?.classList.add('cp-alvo-found');
      }
    });

    const ok = isDesistir ? false : ((encontradas.size / palavrasAlvo.length) > 0.5);
    registrarEventoMG('caca_palavras', ok ? 'acerto' : 'erro');
    mostrarFeedbackMG(ok);
  };

  document.getElementById('btnConfCP').addEventListener('click', () => finalizarCP(false));
  document.getElementById('btnDesistirCP')?.addEventListener('click', () => finalizarCP(true));
}

// ─── 6. LIGAR OS PONTOS ──────────────────────────────────────────────────────
function renderLigarPontos(fase, h, corpo, spec) {
  const BANCO_DEFS = {
    // ── Palavras Principais de Histórias Específicas ─────────────
    leo: 'Leão forte que venceu o medo do escuro',
    leao: 'Rei da selva com juba',
    marina: 'Menina que desenhava nuvens no seu caderno',
    pedro: 'Menino curioso que descobriu a biblioteca secreta',
    biblioteca: 'Lugar repleto de livros, histórias e conhecimento',
    vovo: 'Mãe de um dos nossos pais, muito carinhosa',
    vovoa: 'Vovó carinhosa do jardim',
    amazonica: 'Maior floresta tropical do planeta',
    amazonia: 'Maior floresta tropical do planeta',

    // ── Natureza, Clima e Universo ──────────────────────────────
    sol: 'Estrela brilhante que ilumina o dia', lua: 'Astro luminoso que brilha no céu à noite',
    agua: 'Líquido essencial à vida de todos', fogo: 'Chama quente que aquece e ilumina',
    vento: 'Ar em movimento que sopra no rosto', chuva: 'Água preciosa que cai do céu',
    pingo: 'Gotinha refrescante de chuva', pingos: 'Gotinhas de chuva caindo do céu',
    flor: 'Parte bonita e colorida das plantas', flores: 'Plantas coloridas e perfumadas do jardim',
    arvore: 'Planta alta de tronco forte e folhas verdes', arvores: 'Conjunto de plantas altas da floresta',
    nuvem: 'Massa macia de vapor no céu', nuvens: 'Formações de vapor de água no céu',
    pedra: 'Material sólido e duro da natureza', terra: 'Solo onde as plantas crescem fortes',
    floresta: 'Conjunto imenso de muitas árvores', mar: 'Grande extensão de água salgada',
    rio: 'Corrente de água doce que flui para o mar', lago: 'Belo espelho d\'água entre as árvores',
    montanha: 'Grande e alta elevação de terra', estrela: 'Ponto luminoso no céu noturno',
    estrelas: 'Pontos brilhantes no céu à noite', praia: 'Areia fina à beira do oceano',
    campo: 'Área aberta cheia de verde e natureza', arcoiris: 'Arco colorido formado pela luz na chuva',
    neve: 'Flocos de gelo macio caindo do céu', jardim: 'Lugar florido, colorido e bem cuidado',
    semente: 'Pequena origem de uma nova planta', folha: 'Parte verde que cresce nos galhos',
    vulcao: 'Montanha especial que solta lava quente', caverna: 'Abrigo natural de pedra na montanha',
    ilha: 'Porção de terra cercada de água', deserto: 'Lugar quente e seco cheio de areia',
    atmosfera: 'Camada protetora de ar ao redor da Terra', luz: 'Energia radiante que permite enxergar tudo',
    azul: 'Cor linda do céu em dia ensolarado', particulas: 'Pequeníssimas porções de matéria no ar',
    noite: 'Período de escuridão quando o sol se põe',
    // ── Animais e Criaturas ─────────────────────────────────────
    gato: 'Animal doméstico fofinho que mia', cachorro: 'Animal amigo e leal que late',
    cavalo: 'Animal elegante e forte que galopa', coelho: 'Animal de orelhas compridas que pula',
    urso: 'Animal grande, forte e peludo', passaro: 'Ave graciosa que voa com asas',
    passaros: 'Aves com asas que voam pelo céu', passarinho: 'Pequena ave graciosa que canta',
    peixe: 'Animal que nada alegremente na água', peixes: 'Animais aquáticos que nadam em cardumes',
    borboleta: 'Inseto delicado com asas coloridas', borboletas: 'Insetos voadores de asas coloridas',
    tartaruga: 'Animal calmo com casco resistente', sapo: 'Anfíbio que pula alto e coaxa na lagoa',
    coruja: 'Ave sábia de olhos grandes', raposa: 'Animal esperto de cauda peluda',
    lobo: 'Animal forte que uiva para a lua', elefante: 'Animal gigante de tromba enorme',
    girafa: 'Animal de pescoço muito alto', macaco: 'Animal divertido que adora pular em árvores',
    baleia: 'Gigante amigável dos oceanos', tubarao: 'Peixe grande e rápido dos mares',
    golfinho: 'Animal marinho muito inteligente', abelha: 'Inseto trabalhador que produz mel',
    formiga: 'Inseto pequenino e organizado', aranha: 'Inseto de oito patas que tece teias',
    dragao: 'Criatura mítica lendária que cospe fogo', unicornio: 'Cavalo mágico com chifre brilhante',
    dinossauro: 'Réptil gigante que viveu no passado', pato: 'Ave que nada alegremente na lagoa',
    galinha: 'Ave do sítio que bota ovos', ovelha: 'Animal dócil que nos dá lã macia',
    porco: 'Animal simpático de focinho redondo', vaca: 'Animal que nos dá leite bem fresquinho',
    jacare: 'Réptil forte que vive nos rios', pinguim: 'Ave divertida que vive no gelo',
    zebra: 'Animal africano listrado de preto e branco', algas: 'Plantas marinhas que balançam nas correntes',
    corais: 'Estruturas coloridas e vivas do mar', polvo: 'Animal marinho de oito tentáculos',
    tentaculos: 'Braços flexíveis e fortes dos polvos', especies: 'Diferentes tipos de plantas e animais',

    // ── Fantasia, Reinos e Histórias ───────────────────────────
    rei: 'Governante sábio de um reino', rainha: 'Governante soberana e nobre',
    princesa: 'Filha dos reis que vive no castelo', principe: 'Filho dos reis, corajoso e nobre',
    fada: 'Ser mágico e bondoso das fábulas', gigante: 'Personagem de tamanho enorme',
    bruxa: 'Personagem mágica das fábulas', castelo: 'Grande construção fortificada de pedra',
    magia: 'Poder encantado e fantástico', coroa: 'Símbolo brilhante usado pelos reis',
    tesouro: 'Coleção de riquezas, joias e moedas', mapa: 'Desenho especial que guia navegadores',
    espada: 'Arma antiga dos nobres cavaleiros', escudo: 'Proteção forte dos cavaleiros',
    heroi: 'Personagem valente que faz o bem', heroina: 'Personagem corajosa que salva o dia',
    robo: 'Máquina inteligente que ajuda pessoas', foguete: 'Nave espacial que viaja até as estrelas',
    planeta: 'Grande corpo celeste que gira no espaço', astronauta: 'Explorador corajoso do espaço',

    // ── Objetos, Artefatos e Cotidiano ──────────────────────────
    casa: 'Lugar acolhedor onde a família mora', escola: 'Lugar especial onde aprendemos coisas novas',
    livro: 'Objeto mágico cheio de páginas e histórias', livros: 'Páginas cheias de sabedoria e imaginação',
    brinquedo: 'Objeto feito para brincar e se divertir', bola: 'Objeto redondo usado em muitos jogos',
    lapis: 'Utensílio para desenhar e escrever', espelho: 'Superfície limpa que reflete a imagem',
    chave: 'Objeto metálico que abre portas e baús', bau: 'Caixa de madeira para guardar segredos', caixa: 'Objeto que se usa para guardar itens',
    barco: 'Embarcação para navegar nas águas', navio: 'Grande embarcação que cruza oceanos',
    aviao: 'Veículo potente que voa nos céus', ponte: 'Estrutura que conecta dois lados',
    cidade: 'Local grande com casas, ruas e prédios', aldeia: 'Pequeno povoado tranquilo de casas',
    pao: 'Alimento quentinho e saboroso', maca: 'Fruta doce, crocante e vermelha',
    banana: 'Fruta amarela e cheia de energia', cenoura: 'Alimento alaranjado e crocante',
    sapato: 'Calçado confortável usado nos pés', palitos: 'Pequenas varetas de madeira',
    tinta: 'Líquido colorido usado para pintar', poleiro: 'Apoio de madeira para os pássaros',
    buraco: 'Abertura de entrada na casinha', casinha: 'Pequeno lar construído com carinho',
    caderno: 'Livro de folhas em branco para desenhar', desenho: 'Arte criada com lápis e tintas',
    desenhos: 'Ilustrações feitas com amor no papel', papel: 'Folha para escrever, desenhar e criar',
    bota: 'Calçado alto para caminhar na aventura', guardachuva: 'Proteção colorida contra a chuva',
    poca: 'Pequeno acúmulo de água no chão', banco: 'Assento confortável de madeira no jardim', recipiente: 'Caixa ou pote para guardar objetos',
    fotografias: 'Imagens que registram momentos felizes',
    // ── Emoções, Valores e Conceitos ────────────────────────────
    coragem: 'Força no coração para enfrentar medos', corajoso: 'Que tem força e coragem para vencer o medo',
    amizade: 'Laço carinhoso de amor entre amigos', amor: 'Sentimento profundo de afeto e cuidado',
    alegria: 'Felicidade radiante e sorrisos', sonho: 'Imaginação bonita enquanto dormimos',
    segredo: 'Informação guardada com carinho', segredos: 'Pensamentos guardados com carinho',
    musica: 'Sons harmoniosos que embalam a alma', festa: 'Comemoração alegre com amigos',
    escuro: 'Noite tranquila sem luz', luzes: 'Focos brilhantes que iluminam tudo',
    guardiao: 'Pessoa responsável por proteger algo valioso', reconhecimento: 'Sensação de identificar algo especial',
    civilizacao: 'Sociedade de pessoas vivendo em conjunto', historias: 'Narrativas incríveis cheias de imaginação',
    historia: 'Narrativa cheia de imaginação e aventura', palavra: 'Termo usado para comunicar ideias',
    palavras: 'Termos usados para expressar pensamentos', asas: 'Estruturas fortes que permitem voar',
    vela: 'Pequena chama que ilumina suavemente', oxigenio: 'Ar puro essencial para a nossa respiração',
    desmatamento: 'Corte indevido de árvores que afeta o clima', clima: 'Condições de temperatura e tempo da Terra',
    pertencimento: 'Sensação acolhedora de fazer parte', simbolico: 'Objeto com significado especial',
    identidade: 'Conjunto de marcas que nos tornam únicos', ambiguidade: 'Mistura de sentimentos diferentes',
    vibrantes: 'Cores intensas, radiantes e alegres', vermelhas: 'Cores quentes como as rosas do jardim',
    gostoso: 'Sabor ou aroma muito agradável', tranquilo: 'Lugar calmo, sereno e em paz',
    margaridas: 'Flores delicadas de pétalas brancas', girassois: 'Flores amarelas que acompanham o sol'
  };

  const norm = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z]/g, '');

  let pares = [];

  // 1. Usar spec.pares se fornecido pela história / IA
  if (spec && Array.isArray(spec.pares) && spec.pares.length >= 2) {
    spec.pares.forEach(p => {
      const palavra = String(p.palavra || p.termo || '').trim();
      const def = String(p.def || p.definicao || p.dica || '').trim();
      if (palavra && def && !pares.find(x => norm(x.palavra) === norm(palavra))) {
        pares.push({ palavra, def });
      }
    });
  }

  // 2. Extrair palavras diretamente das palavrasChave e do texto da história
  if (pares.length < 4) {
    const palavrasCandidatas = [];

    (h.palavrasChave || []).forEach(w => {
      const clean = String(w || '').trim();
      if (clean && clean.length >= 3 && !palavrasCandidatas.map(norm).includes(norm(clean))) {
        palavrasCandidatas.push(clean);
      }
    });

    const textoCompleto = String(h.texto || fase.texto || '');
    const matches = textoCompleto.match(/class=["']palavra-chave["']>([^<]+)</gi) || [];
    matches.forEach(m => {
      const w = m.replace(/class=["']palavra-chave["']>/i, '').replace('<', '').trim();
      if (w && w.length >= 3 && !palavrasCandidatas.map(norm).includes(norm(w))) {
        palavrasCandidatas.push(w);
      }
    });

    palavrasCandidatas.forEach(kw => {
      if (pares.length >= 4) return;
      const k = norm(kw);
      if (!pares.find(p => norm(p.palavra) === k)) {
        if (BANCO_DEFS[k]) {
          pares.push({ palavra: kw, def: BANCO_DEFS[k] });
        } else {
          pares.push({ palavra: kw, def: `Elemento especial da história (${kw})` });
        }
      }
    });
  }

  // 3. Complementar com itens do banco genérico apenas se faltar para fechar 3 ou 4
  if (pares.length < 3) {
    const chavesBanco = Object.keys(BANCO_DEFS);
    let i = 0;
    while (pares.length < 4 && i < chavesBanco.length) {
      const k = chavesBanco[i];
      if (!pares.find(p => norm(p.palavra) === k)) {
        const palavraFormatada = k.charAt(0).toUpperCase() + k.slice(1);
        pares.push({ palavra: palavraFormatada, def: BANCO_DEFS[k] });
      }
      i++;
    }
  }

  pares = pares.slice(0, 4);

  const esquerda = embaralhar([...pares]);
  const direita = embaralhar([...pares]);
  const CORES = ['#A855F7', '#FF6B35', '#22C55E', '#3B82F6'];

  let selecionado = null;
  let ligacoes = [];
  let acertos = 0;

  const wrap = document.createElement('div');
  wrap.className = 'lp-wrap';
  wrap.innerHTML = `
    <p class="mg-desc">Clique em uma <strong>palavra</strong> e depois em sua <strong>definição</strong> para ligar!</p>
    <div class="lp-arena" id="lpArena">
      <div class="lp-col" id="lpEsq">
        ${esquerda.map((p, i) => `<button class="lp-btn lp-palavra" data-lado="esq" data-i="${i}" data-k="${norm(p.palavra)}">${p.palavra}</button>`).join('')}
      </div>
      <div class="lp-col" id="lpDir">
        ${direita.map((p, i) => `<button class="lp-btn lp-def" data-lado="dir" data-i="${i}" data-k="${norm(p.palavra)}">${p.def}</button>`).join('')}
      </div>
    </div>
    <svg class="lp-svg" id="lpSvg"></svg>
    <div class="mg-acoes-row">
      <button class="btn-confirmar" id="btnConfLP" style="flex:1;">✔ Verificar</button>
      <button class="btn-desistir-mg" id="btnDesistirLP">🏳️ Solução</button>
    </div>
  `;
  corpo.appendChild(wrap);

  function midRight(el) {
    const wr = wrap.getBoundingClientRect();
    const er = el.getBoundingClientRect();
    return { x: er.right - wr.left, y: er.top + er.height / 2 - wr.top };
  }
  function midLeft(el) {
    const wr = wrap.getBoundingClientRect();
    const er = el.getBoundingClientRect();
    return { x: er.left - wr.left, y: er.top + er.height / 2 - wr.top };
  }

  function redrawSvg() {
    const svg = document.getElementById('lpSvg');
    if (!svg) return;
    const wr = wrap.getBoundingClientRect();
    svg.setAttribute('width', wr.width);
    svg.setAttribute('height', wr.height);
    svg.innerHTML = '';
    ligacoes.forEach(lig => {
      const eEl = wrap.querySelector(`#lpEsq [data-k="${lig.eKey}"]`);
      const dEl = wrap.querySelector(`#lpDir [data-k="${lig.dKey}"]`);
      if (!eEl || !dEl) return;
      const p1 = midRight(eEl);
      const p2 = midLeft(dEl);
      const cx = (p1.x + p2.x) / 2;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M${p1.x},${p1.y} C${cx},${p1.y} ${cx},${p2.y} ${p2.x},${p2.y}`);
      path.setAttribute('stroke', lig.cor);
      path.setAttribute('stroke-width', '3.5');
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke-linecap', 'round');
      svg.appendChild(path);
    });
  }

  wrap.querySelectorAll('.lp-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('lp-ligado')) return;
      const lado = btn.dataset.lado;
      const k = btn.dataset.k;

      if (!selecionado) {
        wrap.querySelectorAll('.lp-btn.lp-ativo').forEach(b => b.classList.remove('lp-ativo'));
        btn.classList.add('lp-ativo');
        selecionado = { lado, k };
        return;
      }

      if (selecionado.lado === lado) {
        wrap.querySelectorAll('.lp-btn.lp-ativo').forEach(b => b.classList.remove('lp-ativo'));
        btn.classList.add('lp-ativo');
        selecionado = { lado, k };
        return;
      }

      const eKey = lado === 'dir' ? selecionado.k : k;
      const dKey = lado === 'dir' ? k : selecionado.k;
      wrap.querySelectorAll('.lp-btn.lp-ativo').forEach(b => b.classList.remove('lp-ativo'));
      selecionado = null;

      const ok = eKey === dKey;
      const cor = ok ? CORES[acertos % CORES.length] : '#EF4444';
      const eEl = wrap.querySelector(`#lpEsq [data-k="${eKey}"]`);
      const dEl = wrap.querySelector(`#lpDir [data-k="${dKey}"]`);

      if (ok) {
        acertos++;
        [eEl, dEl].forEach(el => {
          el.classList.add('lp-ligado', 'lp-certo');
          el.style.borderColor = cor;
          el.style.color = cor;
        });
        ligacoes.push({ eKey, dKey, cor });
        requestAnimationFrame(() => redrawSvg());
        if (acertos >= pares.length) {
          setTimeout(() => mostrarFeedbackMG(true, true), 400);
          document.getElementById('btnConfLP').disabled = true;
          document.getElementById('btnDesistirLP').disabled = true;
        }
      } else {
        [eEl, dEl].forEach(el => {
          if (!el) return;
          el.classList.add('lp-erro');
          setTimeout(() => el.classList.remove('lp-erro'), 600);
        });
      }
    });
  });

  const finalizarLP = (isDesistir = false) => {
    document.getElementById('btnConfLP').disabled = true;
    document.getElementById('btnDesistirLP').disabled = true;

    pares.forEach(par => {
      const k = norm(par.palavra);
      const eEl = wrap.querySelector(`#lpEsq [data-k="${k}"]`);
      const dEl = wrap.querySelector(`#lpDir [data-k="${k}"]`);
      if (eEl && dEl && !eEl.classList.contains('lp-ligado')) {
        [eEl, dEl].forEach(el => el.classList.add('lp-revelado'));
        ligacoes.push({ eKey: k, dKey: k, cor: '#9CA3AF' });
      }
    });
    requestAnimationFrame(() => redrawSvg());

    const ok = isDesistir ? false : ((acertos / pares.length) > 0.5);
    registrarEventoMG('ligar_pontos', ok ? 'acerto' : 'erro');
    mostrarFeedbackMG(ok, true);
  };

  document.getElementById('btnConfLP').addEventListener('click', () => finalizarLP(false));
  document.getElementById('btnDesistirLP')?.addEventListener('click', () => finalizarLP(true));
}

// ─── 7. RIMA ────────────────────────────────────────────────────────────────
const DICIONARIO_RIMAS = [
  { palavra: 'leão', rimas: ['balão', 'coração', 'pão', 'mão', 'botão', 'dragão', 'avião', 'canção'], erradas: ['livro', 'pedra', 'floresta', 'vento'] },
  { palavra: 'dragão', rimas: ['balão', 'coração', 'leão', 'botão', 'avião', 'canção', 'sabão'], erradas: ['nuvem', 'janela', 'árvore', 'sol'] },
  { palavra: 'coração', rimas: ['canção', 'balão', 'leão', 'pão', 'mão', 'botão'], erradas: ['rio', 'estrela', 'casa', 'mar'] },
  { palavra: 'pão', rimas: ['mão', 'coração', 'balão', 'leão', 'canção'], erradas: ['suco', 'pedra', 'neve', 'bola'] },
  { palavra: 'balão', rimas: ['leão', 'dragão', 'pão', 'coração', 'botão'], erradas: ['vento', 'passarinho', 'terra', 'lua'] },
  { palavra: 'dia', rimas: ['alegria', 'magia', 'poesia', 'fantasia', 'folia'], erradas: ['noite', 'sol', 'estrela', 'nuvem'] },
  { palavra: 'magia', rimas: ['alegria', 'dia', 'poesia', 'fantasia'], erradas: ['varinha', 'livro', 'castelo', 'pedra'] },
  { palavra: 'alegria', rimas: ['magia', 'dia', 'poesia', 'fantasia', 'folia'], erradas: ['tristeza', 'riso', 'festa', 'brinquedo'] },
  { palavra: 'fada', rimas: ['espada', 'risada', 'estrada', 'caminhada', 'enxada'], erradas: ['magia', 'livro', 'floresta', 'vento'] },
  { palavra: 'espada', rimas: ['fada', 'risada', 'estrada', 'enxada'], erradas: ['escudo', 'rei', 'cavalo', 'pedra'] },
  { palavra: 'estrela', rimas: ['janela', 'vela', 'amarela', 'tigela', 'fivela'], erradas: ['lua', 'céu', 'noite', 'brilho'] },
  { palavra: 'janela', rimas: ['estrela', 'vela', 'amarela', 'tigela'], erradas: ['porta', 'casa', 'vidro', 'vento'] },
  { palavra: 'corajoso', rimas: ['bondoso', 'gostoso', 'famoso', 'grandioso', 'medroso'], erradas: ['forte', 'valente', 'leão', 'medo'] },
  { palavra: 'passarinho', rimas: ['carinho', 'caminho', 'ninho', 'pinguinho'], erradas: ['asa', 'voar', 'árvore', 'céu'] },
  { palavra: 'pinguinho', rimas: ['passarinho', 'carinho', 'caminho', 'ninho'], erradas: ['chuva', 'gota', 'água', 'nuvem'] },
  { palavra: 'carinho', rimas: ['passarinho', 'caminho', 'ninho', 'pinguinho'], erradas: ['amor', 'abraço', 'amigo', 'festa'] },
  { palavra: 'chuva', rimas: ['uva', 'luva'], erradas: ['água', 'nuvem', 'vento', 'pingo'] },
  { palavra: 'sol', rimas: ['farol', 'caracol', 'girassol'], erradas: ['lua', 'dia', 'calor', 'céu'] },
  { palavra: 'lua', rimas: ['rua', 'sua'], erradas: ['noite', 'estrela', 'céu', 'brilho'] },
  { palavra: 'mar', rimas: ['voar', 'cantar', 'olhar', 'brincar', 'luar'], erradas: ['água', 'peixe', 'onda', 'barco'] },
  { palavra: 'voar', rimas: ['cantar', 'olhar', 'brincar', 'mar', 'luar'], erradas: ['asa', 'passarinho', 'céu', 'nuvem'] },
  { palavra: 'flor', rimas: ['amor', 'calor', 'pintor', 'tambor', 'valor'], erradas: ['jardim', 'pétala', 'planta', 'cheiro'] },
  { palavra: 'amor', rimas: ['flor', 'calor', 'pintor', 'valor'], erradas: ['coração', 'carinho', 'amigo', 'festa'] },
  { palavra: 'gato', rimas: ['prato', 'sapato', 'pato', 'fato'], erradas: ['cachorro', 'miado', 'caixa', 'rato'] },
  { palavra: 'fogo', rimas: ['jogo'], erradas: ['calor', 'chama', 'cinza', 'fumaça'] },
  { palavra: 'presente', rimas: ['valente', 'dente', 'diferente', 'contente'], erradas: ['caixa', 'festa', 'laço', 'amigo'] }
];

function extrairPalavraERimaDoTexto(h) {
  let textoBruto = String(h?.textoCompleto || '').replace(/<[^>]+>/g, '').toLowerCase();
  if (!textoBruto && Array.isArray(h?.fases)) {
    textoBruto = h.fases.map(f => String(f.texto || '').replace(/<[^>]+>/g, '')).join(' ').toLowerCase();
  }
  const palavrasChave = (h?.palavrasChave || []).map(p => p.toLowerCase());
  const palavrasTexto = textoBruto.match(/[a-záàâãéèêíïóôõúçñ]{3,}/gi) || [];
  const todasPalavras = [...new Set([...palavrasChave, ...palavrasTexto])];

  for (const item of DICIONARIO_RIMAS) {
    if (todasPalavras.some(w => w === item.palavra || w.includes(item.palavra) || item.palavra.includes(w))) {
      const rimasDiferentes = item.rimas.filter(r => r.toLowerCase() !== item.palavra.toLowerCase());
      if (rimasDiferentes.length > 0) {
        const rimaSorteada = rimasDiferentes[Math.floor(Math.random() * rimasDiferentes.length)];
        return {
          palavra: item.palavra,
          rima: rimaSorteada,
          erradas: item.erradas
        };
      }
    }
  }

  const sufixosMap = [
    { sufixo: 'ão', rimas: ['balão', 'coração', 'pão', 'mão', 'canção'], erradas: ['livro', 'pedra', 'vento', 'lua'] },
    { sufixo: 'ia', rimas: ['alegria', 'magia', 'poesia', 'folia'], erradas: ['noite', 'sol', 'estrela', 'pedra'] },
    { sufixo: 'ada', rimas: ['espada', 'risada', 'estrada', 'enxada'], erradas: ['livro', 'vento', 'floresta', 'céu'] },
    { sufixo: 'ela', rimas: ['janela', 'estrela', 'vela', 'amarela'], erradas: ['lua', 'noite', 'porta', 'vidro'] },
    { sufixo: 'inho', rimas: ['carinho', 'passarinho', 'caminho', 'ninho'], erradas: ['asa', 'árvore', 'céu', 'vento'] },
    { sufixo: 'oso', rimas: ['bondoso', 'gostoso', 'famoso', 'grandioso'], erradas: ['forte', 'leão', 'pedra', 'sol'] },
    { sufixo: 'osa', rimas: ['bondosa', 'gostosa', 'famosa', 'curiosa'], erradas: ['livro', 'pedra', 'vento', 'luz'] },
    { sufixo: 'ar', rimas: ['cantar', 'voar', 'olhar', 'brincar'], erradas: ['água', 'peixe', 'nuvem', 'terra'] },
    { sufixo: 'or', rimas: ['amor', 'calor', 'pintor', 'flor'], erradas: ['jardim', 'céu', 'festa', 'casa'] }
  ];

  for (const pal of todasPalavras) {
    if (pal.length >= 4) {
      for (const suf of sufixosMap) {
        if (pal.endsWith(suf.sufixo)) {
          const rimasDiferentes = suf.rimas.filter(r => r.toLowerCase() !== pal.toLowerCase());
          if (rimasDiferentes.length > 0) {
            const rimaSorteada = rimasDiferentes[Math.floor(Math.random() * rimasDiferentes.length)];
            return {
              palavra: pal,
              rima: rimaSorteada,
              erradas: suf.erradas
            };
          }
        }
      }
    }
  }

  const fallback = DICIONARIO_RIMAS[Math.floor(Math.random() * DICIONARIO_RIMAS.length)];
  const rimasValidas = fallback.rimas.filter(r => r.toLowerCase() !== fallback.palavra.toLowerCase());
  return {
    palavra: fallback.palavra,
    rima: rimasValidas[Math.floor(Math.random() * rimasValidas.length)],
    erradas: fallback.erradas
  };
}

function renderRima(h, corpo, spec) {
  let par;
  let opcoes;

  if (spec && spec.palavra && spec.rima && Array.isArray(spec.opcoes) && spec.opcoes.length >= 2) {
    let palavraTarget = String(spec.palavra).trim();
    let rimaCorreta = String(spec.rima).trim();
    let opcoesBrutas = spec.opcoes.map(String).map(s => s.trim());

    if (palavraTarget.toLowerCase() === rimaCorreta.toLowerCase()) {
      const extraido = extrairPalavraERimaDoTexto({ textoCompleto: palavraTarget });
      rimaCorreta = extraido.rima;
    }

    let opcoesFiltradas = opcoesBrutas.filter(op => op.toLowerCase() !== palavraTarget.toLowerCase());

    if (!opcoesFiltradas.some(op => op.toLowerCase() === rimaCorreta.toLowerCase())) {
      opcoesFiltradas.push(rimaCorreta);
    }

    par = { palavra: palavraTarget, rima: rimaCorreta };
    opcoes = embaralhar(opcoesFiltradas);
  } else {
    const extraido = extrairPalavraERimaDoTexto(h);
    par = { palavra: extraido.palavra, rima: extraido.rima };
    opcoes = embaralhar([par.rima, ...extraido.erradas.slice(0, 3)]);
  }

  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <p class="mg-desc">Escolha a palavra que rima com a palavra destacada!</p>
    <div class="rima-destaque">
      <span class="rima-label">Rima com:</span>
      <span class="rima-palavra-alvo">${par.palavra}</span>
    </div>
    <div class="rima-opcoes-grid">
      ${opcoes.map(op => `<button class="rima-opc" data-rima="${op}" aria-label="${op}">${op}</button>`).join('')}
    </div>
    <div style="text-align:center;margin-top:12px;">
      <button class="btn-desistir-mg" id="btnDesistirRima">🏳️ Desistir / Ver Solução</button>
    </div>
  `;
  corpo.appendChild(wrap);

  const revelarResposta = (clicou, btnClicado) => {
    const btnDesistir = document.getElementById('btnDesistirRima');
    if (btnDesistir) btnDesistir.disabled = true;

    const ok = clicou ? (btnClicado && btnClicado.dataset.rima.toLowerCase() === par.rima.toLowerCase()) : false;
    wrap.querySelectorAll('.rima-opc').forEach(b => {
      b.disabled = true;
      if (b.dataset.rima.toLowerCase() === par.rima.toLowerCase()) {
        b.classList.add('correta');
        b.innerHTML = `🎵 ${par.rima} ✓`;
      }
    });

    if (clicou && !ok && btnClicado) {
      btnClicado.classList.add('errada');
      btnClicado.innerHTML = `${btnClicado.dataset.rima} ✗`;
    }

    registrarEventoMG('rima', ok ? 'acerto' : 'erro');
    mostrarFeedbackMG(ok);
  };

  wrap.querySelectorAll('.rima-opc').forEach(btn => {
    btn.addEventListener('click', () => revelarResposta(true, btn));
  });

  document.getElementById('btnDesistirRima')?.addEventListener('click', () => revelarResposta(false, null));
}

// ─── 8. QUEM DISSE ISSO? ────────────────────────────────────────────────────
function extrairFalasEAlvosDaHistoria(h) {
  const paresValidos = [];
  const textoBruto = obterTextoBaseHistoria(h).replace(/<[^>]+>/g, '').trim();

  // Dicionário de falas conhecidas em histórias pré-definidas
  const falasConhecidas = [
    { regex: /Léo, onde você está/i, fala: 'Léo, onde você está?', alvo: 'Amigos' },
    { regex: /não tenha medo.*fico aqui com você/i, fala: 'Léo, não tenha medo! Eu fico aqui com você toda noite.', alvo: 'Lua' },
    { regex: /Nuvens\? Mas elas somem/i, fala: 'Nuvens? Mas elas somem!', alvo: 'Colegas' },
    { regex: /Você demorou/i, fala: 'Você demorou.', alvo: 'Raposa' },
    { regex: /Cada guardião demora/i, fala: 'Cada guardião demora um tempo diferente para encontrar a biblioteca.', alvo: 'Raposa' },
    { regex: /Três o quê/i, fala: 'Três o quê?', alvo: 'Pedro' },
    { regex: /Anos de escola/i, fala: 'Anos de escola.', alvo: 'Raposa' },
    { regex: /Histórias verdadeiras precisam ser lidas/i, fala: 'Histórias verdadeiras precisam ser lidas.', alvo: 'Raposa' },
    { regex: /A história desaparece/i, fala: 'A história desaparece. Como se nunca tivesse acontecido.', alvo: 'Raposa' }
  ];

  for (const item of falasConhecidas) {
    if (item.regex.test(textoBruto)) {
      paresValidos.push({ trecho: item.fala, alvo: item.alvo });
    }
  }

  // Extração por Regex para histórias dinâmicas (como geradas por IA)
  const regexAspas = /["“«]([^"”»]{5,180})["”»]/g;
  const regexTravessao = /(?:^|\n)\s*[—–-]\s*([^\n]{5,180})/g;
  let match;

  const extraisDinamicos = [];

  const extrairDoMatch = (falaTexto, index) => {
    falaTexto = falaTexto.trim();
    if (paresValidos.some(p => p.trecho.includes(falaTexto) || falaTexto.includes(p.trecho))) return;

    const inicioContexto = Math.max(0, index - 120);
    const fimContexto = Math.min(textoBruto.length, index + falaTexto.length + 120);
    const contextoAntes = textoBruto.substring(inicioContexto, index);
    const contextoDepois = textoBruto.substring(index + falaTexto.length, fimContexto);

    const regexQuemDisseDepois = /(?:disse|perguntou|respondeu|explicou|falou|gritou|chamou|exclamou)\s+(?:a|o)?\s*([A-ZÁÉÍÓÚÂÊÔÃÕ][a-záéíóúâêôãõç]+)/i;
    const regexQuemDisseAntes = /([A-ZÁÉÍÓÚÂÊÔÃÕ][a-záéíóúâêôãõç]+)\s+(?:disse|perguntou|respondeu|explicou|falou|gritou|chamou|exclamou)/i;

    let mPersonagem = contextoAntes.match(regexQuemDisseAntes) || contextoDepois.match(regexQuemDisseDepois) || contextoAntes.match(regexQuemDisseDepois);

    if (mPersonagem && mPersonagem[1]) {
      const pNome = mPersonagem[1].trim();
      const ignorar = ['Uma', 'Cada', 'Ele', 'Ela', 'Quando', 'Todos', 'Alguns', 'Outros'];
      if (!ignorar.includes(pNome) && pNome.length >= 3) {
        extraisDinamicos.push({ trecho: falaTexto, alvo: pNome });
        return;
      }
    }
  };

  while ((match = regexAspas.exec(textoBruto)) !== null) {
    extrairDoMatch(match[1], match.index);
  }
  while ((match = regexTravessao.exec(textoBruto)) !== null) {
    extrairDoMatch(match[1], match.index);
  }

  paresValidos.push(...extraisDinamicos);

  // Incluir opção narrativa (onde o alvo é o Narrador)
  const frasesNarrativas = textoBruto.match(/[^.!?]+[.!?]+/g) || [textoBruto];
  const frasesSemAspas = frasesNarrativas.filter(f => {
    const fLimpa = f.trim();
    return fLimpa.length >= 35 && fLimpa.length <= 110 && !/["“«—–-]/.test(fLimpa);
  });

  if (frasesSemAspas.length > 0) {
    const idxNarrador = Math.floor(frasesSemAspas.length / 2);
    paresValidos.push({
      trecho: frasesSemAspas[idxNarrador].trim(),
      alvo: 'Narrador'
    });
  } else {
    paresValidos.push({
      trecho: frasesNarrativas[0].trim(),
      alvo: 'Narrador'
    });
  }

  return paresValidos;
}

function renderQuemDisse(fase, h, corpo, spec) {
  const todosPersonagens = [...new Set(
    (Array.isArray(h?.fases) ? h.fases : [])
      .flatMap(f => (f.personagens || []))
      .concat(h?.personagens || [])
      .concat(h?.palavrasChave || [])
  )].filter(Boolean).map(p => String(p).trim());

  let alvo = 'Narrador';
  let opcoes = [];
  let trecho = '';

  const paresValidos = extrairFalasEAlvosDaHistoria(h);

  if (spec && Array.isArray(spec.opcoes) && spec.opcoes.length >= 2 && spec.fala && spec.fala.length >= 5 && spec.fala !== spec.pergunta) {
    opcoes = spec.opcoes.map(String);
    alvo = opcoes[Math.min(opcoes.length - 1, Math.max(0, normalizarCorreta(spec.correta)))] || 'Narrador';
    trecho = String(spec.fala).trim();

    if (!opcoes.includes('Narrador')) {
      if (opcoes.length >= 4) {
        const idxSubstituir = opcoes.findIndex(op => op !== alvo);
        if (idxSubstituir !== -1) opcoes[idxSubstituir] = 'Narrador';
        else opcoes.push('Narrador');
      } else {
        opcoes.push('Narrador');
      }
    }
  } else {
    const parSorteado = paresValidos[Math.floor(Math.random() * paresValidos.length)];
    trecho = parSorteado.trecho;
    alvo = parSorteado.alvo;

    const distratoresPadrao = ['Narrador', 'Dragão', 'Fada', 'Rei', 'Bruxo', 'Lobo', 'Gigante', 'Urso', 'Pedro', 'Marina', 'Léo', 'Raposa'];
    const candidatos = [...new Set([...todosPersonagens, ...distratoresPadrao])];

    const distratoresFiltrados = candidatos.filter(p => p.toLowerCase() !== alvo.toLowerCase() && p !== 'Narrador');
    const distratoresSorteados = embaralhar(distratoresFiltrados);

    if (alvo === 'Narrador') {
      opcoes = embaralhar(['Narrador', ...distratoresSorteados.slice(0, 3)]);
    } else {
      opcoes = embaralhar([alvo, 'Narrador', ...distratoresSorteados.slice(0, 2)]);
    }
  }

  const trechoLimpo = trecho.replace(/^["“«\s]+|["”»\s]+$/g, '');

  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <p class="mg-desc">Leia o trecho e descubra quem disse isso na história!</p>
    <div class="qd-trecho">"${trechoLimpo}"</div>
    <div class="qd-opcoes">
      ${opcoes.map(op => `<button class="qd-btn" data-nome="${op}" aria-label="${op}">${op}</button>`).join('')}
    </div>
    <div style="text-align:center;margin-top:12px;">
      <button class="btn-desistir-mg" id="btnDesistirQuemDisse">🏳️ Desistir / Ver Solução</button>
    </div>
  `;
  corpo.appendChild(wrap);

  const revelarResposta = (clicou, btnClicado) => {
    const btnDesistir = document.getElementById('btnDesistirQuemDisse');
    if (btnDesistir) btnDesistir.disabled = true;

    const ok = clicou ? (btnClicado && btnClicado.dataset.nome.toLowerCase() === alvo.toLowerCase()) : false;
    wrap.querySelectorAll('.qd-btn').forEach(b => {
      b.disabled = true;
      if (b.dataset.nome.toLowerCase() === alvo.toLowerCase()) {
        b.classList.add('correta');
        b.innerHTML = `💬 ${alvo} ✓`;
      }
    });

    if (clicou && !ok && btnClicado) {
      btnClicado.classList.add('errada');
      btnClicado.innerHTML = `${btnClicado.dataset.nome} ✗`;
    }

    registrarEventoMG('quem_disse', ok ? 'acerto' : 'erro');
    mostrarFeedbackMG(ok);
  };

  wrap.querySelectorAll('.qd-btn').forEach(btn => {
    btn.addEventListener('click', () => revelarResposta(true, btn));
  });

  document.getElementById('btnDesistirQuemDisse')?.addEventListener('click', () => revelarResposta(false, null));
}

// ─── 9. ORDENAR PASSOS ──────────────────────────────────────────────────────
function renderOrdenarPassos(h, corpo, spec) {
  function extrairFraseCompleta(fase, fallbackIdx) {
    const txt = fase.texto.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    const frases = txt.match(/[^.!?]+[.!?]+/g) || [txt];
    const ideal = frases.find(f => f.trim().length >= 40 && f.trim().length <= 120);
    if (ideal) return ideal.trim();
    const maior = frases.slice().sort((a, b) => b.length - a.length)[0];
    return (maior || txt).trim() || `Evento ${fallbackIdx + 1}`;
  }

  let passos;
  if (spec && Array.isArray(spec.passos) && spec.passos.length >= 3) {
    passos = spec.passos.map((txt, i) => ({ id: i, texto: String(txt) }));
  } else {
    // ── Tenta extrair de h.fases ──────────────────────────────────────────
    const fasesUsadas = Array.isArray(h?.fases) && h.fases.length > 0
      ? (h.fases.length > 5 ? h.fases.slice(0, 5) : h.fases)
      : [];

    const passosDeFases = fasesUsadas
      .map((f, i) => {
        const txt = String(f.texto || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
        if (!txt) return null;
        const frases = txt.match(/[^.!?]+[.!?]+/g) || [];
        const ideal = frases.find(f => f.trim().length >= 20 && f.trim().length <= 150);
        const maior = frases.slice().sort((a, b) => b.length - a.length)[0];
        const resultado = (ideal || maior || txt).trim();
        return resultado.length >= 10 ? { id: i, texto: resultado } : null;
      })
      .filter(Boolean);

    if (passosDeFases.length >= 3) {
      passos = passosDeFases;
    } else {
      // ── Fallback: extrai bloco CONTÍGUO de frases do texto completo ────────
      const textoBase = obterTextoBaseHistoria(h)
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      // Divide por . ! ? preservando a ordem original — frases com tamanho adequado
      const todasFrases = (textoBase.match(/[^.!?]+[.!?]+/g) || [])
        .map(s => s.trim())
        .filter(s => s.length >= 15 && s.length <= 150);

      let selecionadas = [];

      const QTD_PASSOS = 4; // quantidade ideal de passos sequenciais

      if (todasFrases.length >= 3) {
        // Tenta pegar até QTD_PASSOS frases consecutivas
        const qtd = Math.min(QTD_PASSOS, todasFrases.length);

        // Escolhe ponto de início aleatório, garantindo qtd frases à frente
        const maxInicio = todasFrases.length - qtd;
        const inicio = maxInicio > 0
          ? Math.floor(Math.random() * (maxInicio + 1))
          : 0;

        // Pega o bloco contíguo — juntas formam um trecho coeso
        selecionadas = todasFrases
          .slice(inicio, inicio + qtd)
          .map((txt, pos) => ({ id: pos, texto: txt }));
      }

      // Fallback: divide por vírgula e pega bloco contíguo
      if (selecionadas.length < 3) {
        const clausulas = textoBase.split(/[,;]+/)
          .map(s => s.trim())
          .filter(s => s.length >= 15 && s.length <= 120);
        const qtd = Math.min(QTD_PASSOS, clausulas.length);
        const maxInicio = clausulas.length - qtd;
        const inicio = maxInicio > 0 ? Math.floor(Math.random() * (maxInicio + 1)) : 0;
        selecionadas = clausulas
          .slice(inicio, inicio + qtd)
          .map((txt, pos) => ({ id: pos, texto: txt }));
      }

      // Mínimo absoluto: preenche com marcadores genéricos se ainda faltar
      if (selecionadas.length < 3) {
        const qtdFaltando = 3 - selecionadas.length;
        for (let i = 0; i < qtdFaltando; i++) {
          selecionadas.push({ id: selecionadas.length, texto: `Evento ${selecionadas.length + 1} da história` });
        }
      }

      passos = selecionadas;
    }
  }
  // Embaralha garantindo que o resultado NUNCA seja igual à ordem correta
  const embaralharGarantido = (arr) => {
    if (arr.length <= 1) return [...arr];
    let resultado;
    let igual = true;
    for (let t = 0; t < 20 && igual; t++) {
      resultado = embaralhar([...arr]);
      igual = resultado.every((v, i) => v === arr[i]);
    }
    // Se mesmo assim saiu igual (improvável), força rotação de 1 posição
    if (igual) {
      resultado = [...arr.slice(1), arr[0]];
    }
    return resultado;
  };

  const ordemCorreta = passos.map((_, i) => i);
  let ordem = embaralharGarantido(ordemCorreta);

  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <p class="mg-desc">Use as setas ↑↓ para colocar os eventos da história na ordem correta!</p>
    <ul class="op-lista" id="opLista"></ul>
    <div class="mg-acoes-row">
      <button class="btn-confirmar" id="btnConfOP" style="flex:1;">✔ Confirmar Ordem</button>
      <button class="btn-desistir-mg" id="btnDesistirOP">🏳️ Solução</button>
    </div>
  `;
  corpo.appendChild(wrap);

  function renderLista(finalizado = false, isDesistir = false) {
    const lista = document.getElementById('opLista');
    if (!lista) return;
    lista.innerHTML = ordem.map((stepId, i) => {
      const ehCorreto = (stepId === i);
      const posicaoCorreta = stepId + 1;
      const classStatus = finalizado
        ? (ehCorreto ? 'correta' : 'errada')
        : '';

      let gabaritoHtml = '';
      if (finalizado) {
        if (ehCorreto) {
          gabaritoHtml = `<span class="op-gabarito ok">✓ Posição correta!</span>`;
        } else {
          gabaritoHtml = `<span class="op-gabarito erro">➔ Posição correta na história: nº ${posicaoCorreta}</span>`;
        }
      }

      return `
        <li class="op-item ${classStatus}">
          <span class="op-num">${i + 1}</span>
          <div class="op-corpo-item">
            <span class="op-texto">${passos[stepId].texto}</span>
            ${gabaritoHtml}
          </div>
          ${!finalizado ? `
          <div class="op-setas">
            <button class="op-seta" data-action="up"   data-i="${i}" aria-label="Mover para cima"  ${i === 0 ? 'disabled' : ''}>↑</button>
            <button class="op-seta" data-action="down" data-i="${i}" aria-label="Mover para baixo" ${i === ordem.length - 1 ? 'disabled' : ''}>↓</button>
          </div>
          ` : ''}
        </li>
      `;
    }).join('');

    if (!finalizado) {
      lista.querySelectorAll('.op-seta').forEach(btn => {
        btn.addEventListener('click', () => {
          const i = parseInt(btn.dataset.i, 10);
          if (btn.dataset.action === 'up' && i > 0) {
            [ordem[i], ordem[i - 1]] = [ordem[i - 1], ordem[i]];
          } else if (btn.dataset.action === 'down' && i < ordem.length - 1) {
            [ordem[i], ordem[i + 1]] = [ordem[i + 1], ordem[i]];
          }
          renderLista();
        });
      });
    }
  }
  renderLista();

  const finalizarOP = (isDesistir = false) => {
    let corretosCount = 0;
    ordem.forEach((stepId, i) => {
      if (stepId === i) corretosCount++;
    });
    const ok = isDesistir ? false : ((corretosCount / passos.length) > 0.5);

    // Não reseta a ordem — mantém a do usuário para mostrar o gabarito real
    renderLista(true, isDesistir);

    const btnConf = document.getElementById('btnConfOP');
    const btnDesistir = document.getElementById('btnDesistirOP');
    if (btnConf) btnConf.disabled = true;
    if (btnDesistir) btnDesistir.disabled = true;

    registrarEventoMG('ordenar_passos', ok ? 'acerto' : 'erro');
    mostrarFeedbackMG(ok);
  };

  document.getElementById('btnConfOP').addEventListener('click', () => finalizarOP(false));
  document.getElementById('btnDesistirOP')?.addEventListener('click', () => finalizarOP(true));
}
