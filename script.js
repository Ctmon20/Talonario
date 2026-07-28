//=====================================
// CONFIGURAÇÃO
//=====================================
const URL_API = "https://script.google.com/macros/s/AKfycbybQB86m0v5S6I1Z9DXruSSJ0YpGYEpcTdrP5aqY5donzNj9w_rGJ2prEiRkDwke6o/exec";

let dados = [];
let batalhoes = [];

//=====================================
// ELEMENTOS
//=====================================
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
const barraEntrega = document.getElementById("barraEntrega");
const textoEntrega = document.getElementById("textoEntrega");
const percentualEntrega = document.getElementById("percentualEntrega");

//=====================================
// CARREGAR DADOS
//=====================================
async function carregarDados() {
  if (loading) loading.classList.remove("hidden");
  try {
    const resposta = await fetch(URL_API);
    dados = await resposta.json();
    agruparBatalhoes();
    mostrarBatalhoes();
    if (ultimaAtualizacao) ultimaAtualizacao.innerHTML = new Date().toLocaleString("pt-BR");
    if (loading) loading.classList.add("hidden");
    if (home) home.classList.remove("hidden");
  } catch (e) {
    alert("Erro ao carregar dados.");
    console.log(e);
  }
}

function agruparBatalhoes() {
  const mapa = {};
  dados.forEach(item => {
    if (!mapa[item.batalhao]) {
      mapa[item.batalhao] = {
        batalhao: item.batalhao,
        local: item.local,
        observacao: item.observacao,
        imeis: []
      };
    }
    mapa[item.batalhao].imeis.push(item);
  });

  batalhoes = Object.values(mapa);
  batalhoes.forEach(b => {
    b.quantidade = b.imeis.length;
  });

  batalhoes.sort((a, b) => a.batalhao.localeCompare(b.batalhao));
  if (totalBatalhoes) totalBatalhoes.innerHTML = batalhoes.length;
  if (totalAparelhos) totalAparelhos.innerHTML = dados.length;
  atualizarIndicadores();
}

function mostrarBatalhoes() {
  if (!listaBatalhoes) return;
  listaBatalhoes.innerHTML = "";
  batalhoes.forEach(item => {
    const total = item.imeis.length;
    const entregues = item.imeis.filter(i => i.entregue).length;
    const percentual = Math.round((entregues / total) * 100);

    let classe = "vermelho";
    if (entregues == total) classe = "verde";
    else if (entregues > 0) classe = "amarelo";

    const card = document.createElement("div");
    card.className = `cardBatalhao ${classe}`;
    card.innerHTML = `
      <div class="tituloCard">
        <div>
          <h2>🏛 ${item.batalhao}</h2>
          <small>📍 ${item.local}</small>
        </div>
        <div class="qtd">${total}</div>
      </div>
      <div class="barra">
        <div class="progresso" style="width:${percentual}%"></div>
      </div>
      <div class="rodapeCard">
        <span>${entregues} de ${total}</span>
        <strong>${percentual}%</strong>
      </div>
    `;
    card.onclick = () => abrirBatalhao(item);
    listaBatalhoes.appendChild(card);
  });
}

function abrirBatalhao(item) {
  if (home) home.classList.add("hidden");
  if (detalhes) detalhes.classList.remove("hidden");

  if (tituloBatalhao) tituloBatalhao.innerHTML = item.batalhao;
  if (localSpan) localSpan.innerHTML = item.local;
  if (quantidadeSpan) quantidadeSpan.innerHTML = item.quantidade;
  if (observacao) observacao.value = item.observacao;

  const entregues = item.imeis.filter(i => i.entregue).length;
  const total = item.imeis.length;
  const percentual = Math.round((entregues / total) * 100) || 0;

  if (barraEntrega) barraEntrega.style.width = percentual + "%";
  if (textoEntrega) textoEntrega.innerHTML = entregues + " de " + total + " aparelhos";
  if (percentualEntrega) percentualEntrega.innerHTML = percentual + "%";

  if (listaIMEI) {
    listaIMEI.innerHTML = "";
    item.imeis.forEach(obj => {
      const div = document.createElement("div");
      div.className = "itemIMEI";
      div.innerHTML = `
        <div class="cabIMEI">
          <input type="checkbox" ${obj.entregue ? "checked" : ""} onchange="alterarEntrega('${obj.imei}', this.checked)">
          <strong>IMEI</strong>
        </div>
        <div class="numeroIMEI">${obj.imei}</div>
        <button class="btnCopiar" onclick="copiarIMEI('${obj.imei}')">
          <i class="fa-solid fa-copy"></i> Copiar
        </button>
      `;
      listaIMEI.appendChild(div);
    });
  }
}

//==============================
// PESQUISA
//==============================
if (pesquisa) {
  pesquisa.addEventListener("keyup", function() {
    const texto = this.value.toLowerCase();
    const cards = document.querySelectorAll(".cardBatalhao");
    cards.forEach(card => {
      const nome = card.innerText.toLowerCase();
      card.style.display = nome.includes(texto) ? "block" : "none";
    });
  });
}

function copiarIMEI(imei) {
  navigator.clipboard.writeText(imei);
  alert("IMEI copiado!");
}



const btnVoltar = document.getElementById("voltar");
if (btnVoltar) {
  btnVoltar.onclick = () => {
    if (detalhes) detalhes.classList.add("hidden");
    if (home) home.classList.remove("hidden");
  };
}

// Funções de sistema
function mostrarToast(msg) {
  alert(msg);
}

function alterarEntrega(imei, status) {
  const registro = dados.find(x => x.imei == imei);
  if (!registro) return;
  registro.entregue = status;
  atualizarGoogleSheets(imei, status);
  atualizarIndicadores();
}

function atualizarIndicadores() {
  let entregues = dados.filter(x => x.entregue).length;
  const elEntregues = document.getElementById("totalEntregues");
  const elPendentes = document.getElementById("totalPendentes");
  
  if (elEntregues) elEntregues.innerHTML = entregues;
  if (elPendentes) elPendentes.innerHTML = dados.length - entregues;
}

async function atualizarGoogleSheets(imei, status) {
  await fetch(URL_API, {
    method: "POST",
    body: JSON.stringify({ imei, entregue: status })
  });
}

function atualizarGrafico() {
  // Verifica se elementos existem antes de rodar
  const elCirculo = document.getElementById("circulo");
  const elPercentual = document.getElementById("percentualDashboard");
  if (!elCirculo || !elPercentual) return;

  const total = dados.length;
  const entregues = dados.filter(x => x.entregue).length;
  const perc = Math.round((entregues / total) * 100) || 0;
  const circ = 377;
  const valor = circ - (perc / 100 * circ);
  elCirculo.style.strokeDashoffset = valor;
  elPercentual.innerHTML = perc + "%";
}

const btnAtualizar = document.getElementById("atualizar");
if (btnAtualizar) {
  btnAtualizar.onclick = () => {
    carregarDados();
    mostrarToast("Dados atualizados.");
  };
}

const btnTema = document.getElementById('tema');
if (btnTema) {
  btnTema.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    
    if(document.body.classList.contains('dark-mode')) {
        localStorage.setItem('tema', 'dark');
    } else {
        localStorage.setItem('tema', 'light');
    }
  });
}

// Verifica preferência ao carregar
if(localStorage.getItem('tema') === 'dark') {
    document.body.classList.add('dark-mode');
}

// Inicialização
carregarDados();