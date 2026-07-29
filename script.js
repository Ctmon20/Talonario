//=====================================
// CONFIGURAÇÃO
//=====================================
const URL_API = "https://script.google.com/macros/s/AKfycbywrdS1MwzE3VpGM2Tc7UIMuh_mNTU_aFzMBB-4e3WE93zdwAumsCbvHW0nhZpYPxA/exec";

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
  
  // CORREÇÃO: Atualiza o ID correto do Dashboard
  const elTotalImp = document.getElementById("totalImpressorasDashboard");
  if (elTotalImp) elTotalImp.innerHTML = dados.length;

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
    // Ajuste para busca por IMEI: armazena os IMEIs no card como um atributo de dados
    card.dataset.imeis = item.imeis.map(i => i.imei).join(',');
    
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
        <span>${entregues} de ${total} = </span>
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
  
  const elImpressoras = document.getElementById("totalImpressorasDetalhes");
  if (elImpressoras) elImpressoras.innerHTML = item.imeis.length;
  
  if (observacao) observacao.value = item.observacao;

  if (listaIMEI) {
    listaIMEI.innerHTML = "";
    item.imeis.forEach(obj => {
      console.log("Dados do item:", obj); // <--- ADICIONE ESSA LINHA
      const div = document.createElement("div");
      div.className = "itemIMEI";
      
      const numImpressora = obj.impressora || "N/A";
      
      div.innerHTML = `
        <div class="cabIMEI">
           <input type="checkbox" ${obj.entregue ? "checked" : ""} onchange="alterarEntrega('${obj.imei}', this.checked)">
        </div>
        <div class="numeroIMEI">
           <strong>IMEI: ${obj.imei}</strong> 
           <span class="badge-imp">Imp: ${numImpressora}</span>
        </div>
        <button class="btnCopiar" onclick="copiarIMEI('${obj.imei}')">Copiar IMEI</button>
      `;
      listaIMEI.appendChild(div);
    });
  }
}

//==============================
// PESQUISA E FUNÇÕES DE SISTEMA
//==============================
if (pesquisa) {
  pesquisa.addEventListener("keyup", function() {
    const texto = this.value.toLowerCase();
    const cards = document.querySelectorAll(".cardBatalhao");
    cards.forEach(card => {
      const nome = card.innerText.toLowerCase();
      // Ajuste na busca: verifica também nos IMEIs armazenados no card
      const imeis = (card.dataset.imeis || "").toLowerCase();
      card.style.display = (nome.includes(texto) || imeis.includes(texto)) ? "block" : "none";
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

function mostrarToast(msg) { alert(msg); }

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
    localStorage.setItem('tema', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
  });
}

if(localStorage.getItem('tema') === 'dark') {
    document.body.classList.add('dark-mode');
}

carregarDados();
