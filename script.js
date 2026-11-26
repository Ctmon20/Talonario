//=====================================
// CONFIGURAÇÃO
//=====================================
const URL_API = "https://script.google.com/macros/s/AKfycbyI2JkuIu-3IU5mZM8fkZQmBVzoQXWeUW5HVvR-wRjrTfkjLyTYVUoEz1jXpRS2LWs/exec";

let dados = [];
let batalhoes = [];
let perfilSelecionado = "visualizador";
let tokenSessao = sessionStorage.getItem("pmal_token") || "";
let perfilUsuario = sessionStorage.getItem("pmal_perfil") || "";

//=====================================
// ELEMENTOS E MODAL
//=====================================
const modal = document.getElementById("meuModal");
const modalMsg = document.getElementById("modalMensagem");

function abrirModal(msg) {
  if (modalMsg) modalMsg.innerHTML = msg; 
  if (modal) modal.classList.remove("hidden");
}

function fecharModal() {
  if (modal) modal.classList.add("hidden");
}

const telaLogin = document.getElementById("telaLogin");
const formLogin = document.getElementById("formLogin");
const senhaLogin = document.getElementById("senhaLogin");
const erroLogin = document.getElementById("erroLogin");
const btnEntrar = document.getElementById("btnEntrar");

const loading = document.getElementById("loading");
const home = document.getElementById("home");
const detalhes = document.getElementById("detalhes");
const listaBatalhoes = document.getElementById("listaBatalhoes");
const listaIMEI = document.getElementById("listaIMEI");
const pesquisa = document.getElementById("pesquisa");
const totalBatalhoes = document.getElementById("totalBatalhoes");
const totalAparelhos = document.getElementById("totalAparelhos");
const tituloBatalhao = document.getElementById("tituloBatalhao");
const localSpan = document.getElementById("local");
const quantidadeSpan = document.getElementById("quantidade");
const observacao = document.getElementById("observacao");
const ultimaAtualizacao = document.getElementById("ultimaAtualizacao");
const btnSalvarObs = document.getElementById("btnSalvarObs");

function isAdmin() {
  return perfilUsuario === "admin";
}

//=====================================
// CONTROLE DE LOGIN E PERFIS
//=====================================
document.querySelectorAll(".perfil-tab").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".perfil-tab").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    perfilSelecionado = btn.dataset.perfil;
    if (erroLogin) erroLogin.classList.add("hidden");
  });
});

function aplicarPermissoes() {
  if (observacao) {
    observacao.disabled = !isAdmin();
  }
  if (btnSalvarObs) {
    if (isAdmin()) {
      btnSalvarObs.classList.remove("hidden");
    } else {
      btnSalvarObs.classList.add("hidden");
    }
  }
}

function voltarParaLogin(mensagem) {
  tokenSessao = "";
  perfilUsuario = "";
  sessionStorage.removeItem("pmal_token");
  sessionStorage.removeItem("pmal_perfil");

  if (home) home.classList.add("hidden");
  if (detalhes) detalhes.classList.add("hidden");
  if (loading) loading.classList.add("hidden");
  if (telaLogin) telaLogin.classList.remove("hidden");

  if (mensagem && erroLogin) {
    erroLogin.textContent = mensagem;
    erroLogin.classList.remove("hidden");
  }
}

const btnSair = document.getElementById("btnSair");
if (btnSair) {
  btnSair.onclick = () => {
    if (senhaLogin) senhaLogin.value = "";
    voltarParaLogin();
  };
}

if (formLogin) {
  formLogin.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (erroLogin) erroLogin.classList.add("hidden");

    const senha = senhaLogin ? senhaLogin.value : "";
    if (!senha) return;

    if (btnEntrar) {
      btnEntrar.disabled = true;
      btnEntrar.textContent = "Entrando...";
    }

    try {
      const resposta = await fetch(URL_API, {
        method: "POST",
        body: JSON.stringify({
          acao: "login",
          perfil: perfilSelecionado,
          senha: senha
        })
      });
      const res = await resposta.json();

      if (res.ok && res.token) {
        tokenSessao = res.token;
        perfilUsuario = res.perfil;
        sessionStorage.setItem("pmal_token", tokenSessao);
        sessionStorage.setItem("pmal_perfil", perfilUsuario);

        if (telaLogin) telaLogin.classList.add("hidden");
        aplicarPermissoes();
        carregarDados();
      } else {
        if (erroLogin) {
          erroLogin.textContent = res.erro || "Senha incorreta.";
          erroLogin.classList.remove("hidden");
        }
      }
    } catch (err) {
      if (erroLogin) {
        erroLogin.textContent = "Erro ao conectar com o servidor.";
        erroLogin.classList.remove("hidden");
      }
    } finally {
      if (btnEntrar) {
        btnEntrar.disabled = false;
        btnEntrar.textContent = "Entrar";
      }
    }
  });
}

//=====================================
// CARREGAR DADOS
//=====================================
async function carregarDados() {
  if (!tokenSessao) {
    voltarParaLogin();
    return;
  }

  if (loading) loading.classList.remove("hidden");
  try {
    const resposta = await fetch(`${URL_API}?token=${encodeURIComponent(tokenSessao)}`);
    const json = await resposta.json();

    if (json && json.erro) {
      voltarParaLogin(json.erro);
      return;
    }

    dados = json;
    agruparBatalhoes();
    mostrarBatalhoes();
    if (ultimaAtualizacao) ultimaAtualizacao.innerHTML = new Date().toLocaleString("pt-BR");
    if (loading) loading.classList.add("hidden");
    if (home) home.classList.remove("hidden");
  } catch (e) {
    abrirModal("⚠️ Erro ao carregar dados.<br>Tente novamente mais tarde.");
    console.log(e);
  }
}

function agruparBatalhoes() {
  const mapa = {};
  dados.forEach(item => {
    if (!mapa[item.batalhao]) {
      mapa[item.batalhao] = { batalhao: item.batalhao, local: item.local, observacao: item.observacao, patrimonios: [] };
    }
    mapa[item.batalhao].patrimonios.push(item);
  });

  batalhoes = Object.values(mapa);
  batalhoes.forEach(b => { b.quantidade = b.patrimonios.length; });
  batalhoes.sort((a, b) => a.batalhao.localeCompare(b.batalhao));
  
  if (totalBatalhoes) totalBatalhoes.innerHTML = batalhoes.length;
  if (totalAparelhos) totalAparelhos.innerHTML = dados.length;
  
  const elTotalImp = document.getElementById("totalImpressorasDashboard");
  if (elTotalImp) elTotalImp.innerHTML = dados.length;

  atualizarIndicadores();
}

function mostrarBatalhoes() {
  if (!listaBatalhoes) return;
  listaBatalhoes.innerHTML = "";
  batalhoes.forEach(item => {
    const total = item.patrimonios.length;
    const entregues = item.patrimonios.filter(i => i.entregue).length;
    const percentual = Math.round((entregues / total) * 100);

    let classe = entregues == total ? "verde" : (entregues > 0 ? "amarelo" : "vermelho");

    const card = document.createElement("div");
    card.className = `cardBatalhao ${classe}`;
    card.dataset.patrimonios = item.patrimonios.map(i => i.patrimonio).join(',');
    
    card.innerHTML = `
      <div class="tituloCard">
        <div><h2>🏛 ${item.batalhao}</h2><small>📍 ${item.local}</small></div>
        <div class="qtd">${total}</div>
      </div>
      <div class="barra"><div class="progresso" style="width:${percentual}%"></div></div>
      <div class="rodapeCard"><span>${entregues} de ${total} = </span><strong>${percentual}%</strong></div>
    `;
    card.onclick = () => abrirBatalhao(item);
    listaBatalhoes.appendChild(card);
  });
}

function abrirBatalhao(item) {
  if (home) home.classList.add("hidden");
  if (detalhes) detalhes.classList.remove("hidden");
  
  aplicarPermissoes();

  if (tituloBatalhao) tituloBatalhao.innerHTML = item.batalhao;
  if (localSpan) localSpan.innerHTML = item.local;
  if (quantidadeSpan) quantidadeSpan.innerHTML = item.quantidade;
  if (observacao) observacao.value = item.observacao || "";

  const elImpressoras = document.getElementById("totalImpressorasDetalhes");
  if (elImpressoras) {
    elImpressoras.innerHTML = item.patrimonios.length;
  }
  
  if (listaIMEI) {
    listaIMEI.innerHTML = "";
    item.patrimonios.forEach(obj => {
      const div = document.createElement("div");
      div.className = "itemIMEI";
      const numImpressora = obj.impressora || "N/A";
      const disabledAttr = isAdmin() ? "" : "disabled";
      const onchangeAttr = isAdmin() ? `onchange="alterarEntrega('${obj.patrimonio}', this.checked)"` : "";

      div.innerHTML = `
        <div class="cabIMEI"><input type="checkbox" ${obj.entregue ? "checked" : ""} ${disabledAttr} ${onchangeAttr}></div>
        <div class="numeroIMEI"><strong>Patrimônio: ${obj.patrimonio}</strong> <span class="badge-imp">Imp: ${numImpressora}</span></div>
        <button class="btnCopiar" onclick="copiarPatrimonio('${obj.patrimonio}')">Copiar Patrimônio</button>
      `;
      listaIMEI.appendChild(div);
    });
  }
}

if (pesquisa) {
  pesquisa.addEventListener("keyup", function() {
    const texto = this.value.toLowerCase();
    document.querySelectorAll(".cardBatalhao").forEach(card => {
      const nome = card.innerText.toLowerCase();
      const patrimonios = (card.dataset.patrimonios || "").toLowerCase();
      card.style.display = (nome.includes(texto) || patrimonios.includes(texto)) ? "block" : "none";
    });
  });
}

function copiarPatrimonio(patrimonio) {
  navigator.clipboard.writeText(patrimonio);
  abrirModal("✅ Patrimônio copiado com sucesso!<br>Agora é só colar.");
}

const btnVoltar = document.getElementById("voltar");
if (btnVoltar) {
  btnVoltar.onclick = () => {
    if (detalhes) detalhes.classList.add("hidden");
    if (home) home.classList.remove("hidden");
    mostrarBatalhoes();
  };
}

function mostrarToast(msg) { abrirModal(msg); }

function alterarEntrega(patrimonio, status) {
  if (!isAdmin()) return;
  const registro = dados.find(x => x.patrimonio == patrimonio);
  if (!registro) return;
  registro.entregue = status;
  atualizarGoogleSheets(patrimonio, status);
  atualizarIndicadores();
}

function atualizarIndicadores() {
  let entregues = dados.filter(x => x.entregue).length;
  const elEntregues = document.getElementById("totalEntregues");
  const elPendentes = document.getElementById("totalPendentes");
  if (elEntregues) elEntregues.innerHTML = entregues;
  if (elPendentes) elPendentes.innerHTML = dados.length - entregues;
}

async function atualizarGoogleSheets(patrimonio, status) {
  await fetch(URL_API, {
    method: "POST",
    body: JSON.stringify({ token: tokenSessao, patrimonio, entregue: status })
  });
}

const btnAtualizar = document.getElementById("atualizar");
if (btnAtualizar) {
  btnAtualizar.onclick = () => {
    carregarDados();
    mostrarToast("🎉 Dados sincronizados com sucesso!<br>Tudo pronto.");
  };
}

const btnTema = document.getElementById('tema');

function aplicarTemaInicial() {
  const temaSalvo = localStorage.getItem('tema');
  if (temaSalvo === null) {
    document.body.classList.add('dark-mode');
    localStorage.setItem('tema', 'dark');
  } else if (temaSalvo === 'dark') {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }
}

aplicarTemaInicial();

if (btnTema) {
  btnTema.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('tema', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
  });
}

//=====================================
// SALVAR OBSERVAÇÃO
//=====================================
if (btnSalvarObs) {
  btnSalvarObs.onclick = async () => {
    if (!isAdmin()) return;
    const textoObs = observacao ? observacao.value : "";
    const nomeBatalhaoAtual = tituloBatalhao ? tituloBatalhao.innerHTML : "";
    
    const bat = batalhoes.find(b => b.batalhao === nomeBatalhaoAtual);
    if (bat) {
      bat.observacao = textoObs;
      bat.patrimonios.forEach(i => {
        const reg = dados.find(d => d.patrimonio === i.patrimonio);
        if (reg) reg.observacao = textoObs;
      });
    }

    if (bat && bat.patrimonios.length > 0) {
      try {
        await fetch(URL_API, { 
          method: "POST", 
          body: JSON.stringify({ token: tokenSessao, batalhao: nomeBatalhaoAtual, observacao: textoObs }) 
        });
        abrirModal("✅ Observação salva com sucesso na planilha!");
      } catch (e) {
        abrirModal("⚠️ Erro ao salvar observação na planilha.");
      }
    }
  };
}

if (tokenSessao && perfilUsuario) {
  if (telaLogin) telaLogin.classList.add("hidden");
  aplicarPermissoes();
  carregarDados();
}
