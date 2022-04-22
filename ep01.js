/*
    EP01 - Pescaria

    Primeiro exercício programa de MAC0420/MAC5744.

    Nome: Vitor Carvalho de Melo
    NUSP: 10723753
*/

window.onload = main;
// ==================================================================
// Constantes

// Número de peixes
const FISH_NUMBER = 15
// Tamanho da praia em porcentagem
const BEACH_SIZE_PCT = 0.15
// Tamanho da bolha em porcentagem
const BUBBLE_SIZE_PCT = 0.003
// Tamanho do canvas em relação à resolução do navegador
const MAP_SIZE_PCT = 0.8
// Multiplicador de velocidade dos itens do mapa
const SPEED_MULTIPLIER = 0.2


// Variáveis globais
var interface = {
  botaoJogar: null,
  botaoPasso: null,
  barraVelocidade: null
}

var arpao = {}
var bolha = {}

var jogoPausado = true
var jogoVelocidade = 1

var ctx;
var width, height;  // área do canvas

var peixes = []

//==================================================================
/**
 * função principal 
 */
function main() {
  const canvas = document.getElementById('meucanvas');
  ctx = canvas.getContext('2d');
  if (!ctx) alert("Não consegui abrir o contexto 2d :-( ");
  callbackWindowResize()

  interface.botaoJogar      = document.getElementById('BotaoJogar');
  interface.botaoPasso      = document.getElementById('BotaoPasso');
  interface.barraVelocidade = document.getElementById('BarraVelocidade');

  interface.botaoJogar.onclick      = callbackbotaoJogar;
  interface.botaoPasso.onclick      = callbackbotaoPasso;
  interface.barraVelocidade.onclick = callbackbarraVelocidade;
  window.onresize                   = callbackWindowResize;
  window.onkeydown                  = callbackKeyDown;
  canvas.onmousedown                = onMouseDownCallback;
  canvas.onmousemove                = onMouseMoveCallback;

  arpao.posX = width / 2
  arpao.posY = (1.03-BEACH_SIZE_PCT)*height
  bolha.ativo = false

  bolha.posX = arpao.posX
  bolha.posY = arpao.posY

  for(let i=0; i<FISH_NUMBER; i++) {
    const raio = sorteie_inteiro(10, 50)
    peixes.push({
      cor: `rgba(${sorteie_inteiro(0, 255)},${sorteie_inteiro(0, 255)},${sorteie_inteiro(0, 255)},1.0)`,
      raio: raio,
      posX: sorteie_inteiro(0,width-2*raio),
      posY: sorteie_inteiro(0,((1-BEACH_SIZE_PCT)*height)-2*raio),
      nVertices: sorteie_inteiro(4, 20),
      velX: sorteie_inteiro(1, 10),
      velY: sorteie_inteiro(1, 10)
    })
  }

  // Desenha o primeiro frame do jogo
  redesenheMapaEPeixes()
  redesenheArpao()
  redesenheBolha()
  redesenhe();
}

// Retorna positivo caso o mouse esteja dentro da praia
function verificaPosicaoMouse (posY) {
  return (posY >= (1-BEACH_SIZE_PCT)*height)
}

function onMouseDownCallback (e) {
  const posY = e.offsetY
  if (verificaPosicaoMouse(posY)) {
    atiraBolha()
  }
}

function onMouseMoveCallback (e) {
  const posX = e.offsetX
  const posY = e.offsetY
  if (verificaPosicaoMouse(posY)) {
    arpao.posX = posX
  }
}

function callbackKeyDown (e) {
  const keyName = e.key;
  if (['d', 'D'].includes(keyName)) {
    arpao.posX += width*SPEED_MULTIPLIER*0.02*jogoVelocidade
    if(arpao.posX > width) arpao.posX = width
  } else if (['a', 'A'].includes(keyName)) {
    arpao.posX -= width*SPEED_MULTIPLIER*0.02*jogoVelocidade
    if(arpao.posX < 0) arpao.posX = 0
  } else if (['s', 'S'].includes(keyName)) {
    atiraBolha()
  }
  if (!bolha.ativo) {
    bolha.posX = arpao.posX
  }
}


function callbackWindowResize (e) {
  // Recalcula as posições de todos os itens do mapa
  const widthRatio = MAP_SIZE_PCT*window.innerWidth
  const heightRatio = MAP_SIZE_PCT*window.innerHeight

  for (const item of peixes) {
    item.posX *= widthRatio/width
    item.posY *= heightRatio/height
  }
  arpao.posX *= widthRatio/width
  arpao.posY = (1.03-BEACH_SIZE_PCT)*heightRatio
  
  bolha.posX *= widthRatio/width
  bolha.posY *= heightRatio/height

  // Redefine o novo tamanho do mapa
  width = widthRatio;
  height = heightRatio;
  
  ctx.canvas.width = width;
  ctx.canvas.height = height;
}

function callbackbotaoJogar (e) {
  jogoPausado = !jogoPausado
  interface.botaoPasso.disabled = !jogoPausado
}

function callbackbotaoPasso (e) {
  redesenheMapaEPeixes()
  redesenheArpao()
  redesenheBolha()
}
function callbackbarraVelocidade (e) {
  jogoVelocidade = interface.barraVelocidade.value
}

function atiraBolha() {
  if (bolha.ativo) {
    return
  }
  bolha.ativo = true
}


// Redesenha o canvas a cada intervalo 
function redesenhe() {
  if (!jogoPausado) {
    ctx.clearRect(0, 0, width, height);
    redesenheMapaEPeixes()
    redesenheArpao()
    redesenheBolha()
  }
  requestAnimationFrame(redesenhe);
}

function redesenheMapaEPeixes() {
  // Desenha o mar
  ctx.fillStyle = 'rgba(145,185,255,1.0)';
  ctx.fillRect( 0, 0, width, (1-BEACH_SIZE_PCT)*height );
  
  // Para cada peixe, calcula se ele foi atingido pela lança:
  //    Se sim: o retira do array de peixes
  //    Se não: o desenha
  for (let i=peixes.length-1; i >= 0; i--){
    if (
      bolha.ativo &&
      peixes[i].posX <= bolha.posX &&
      peixes[i].posX + 2*peixes[i].raio >= bolha.posX &&
      peixes[i].posY <= bolha.posY &&
      peixes[i].posY + 2*peixes[i].raio >= bolha.posY
      ) {
        peixes.splice(i, 1)
        bolha.ativo = false
    } else {
      redesenhePeixe(peixes[i])
    }
  }

  // Desenha a praia
  ctx.fillStyle = 'rgba(200,250, 20,1.0)';
  ctx.fillRect( 0, (1-(BEACH_SIZE_PCT))*height, width, BEACH_SIZE_PCT*height );
}

function redesenheBolha() {
  if (bolha.ativo) {
    if (bolha.posY < 0) {
      bolha.ativo = false
      return
    }
    bolha.posY -= SPEED_MULTIPLIER*20*jogoVelocidade
    let rect = new Path2D()
    rect.moveTo(bolha.posX - BUBBLE_SIZE_PCT*width, bolha.posY - (BUBBLE_SIZE_PCT*1.05)*height)
    rect.lineTo(bolha.posX + BUBBLE_SIZE_PCT*width, bolha.posY - (BUBBLE_SIZE_PCT*1.05)*height)
    rect.lineTo(bolha.posX + BUBBLE_SIZE_PCT*width, bolha.posY + (BUBBLE_SIZE_PCT*1.05)*height)
    rect.lineTo(bolha.posX - BUBBLE_SIZE_PCT*width, bolha.posY + (BUBBLE_SIZE_PCT*1.05)*height)
    rect.closePath()
    ctx.fill(rect)
  }
}

function redesenheArpao() {
  if (!bolha.ativo) {
    bolha.posX = arpao.posX
    bolha.posY = arpao.posY
  }
  ctx.fillStyle = 'rgba(0,0,0,1)'
  let tri = new Path2D()
  tri.moveTo(arpao.posX, arpao.posY)
  tri.lineTo(arpao.posX + 0.01*width, arpao.posY + 0.1*height);
  tri.lineTo(arpao.posX - 0.01*width, arpao.posY + 0.1*height)
  tri.closePath()
  ctx.fill(tri)
}

function desenheQuadrado(item){
  ctx.fillStyle = "rgba(0,0,0,1)"
  ctx.fillRect( item.posX, item.posY, item.raio*2, item.raio*2 );
}

function redesenhePeixe(item) {
  item.posX = item.posX + 0.2*item.velX*jogoVelocidade;
  item.posY = item.posY + 0.2*item.velY*jogoVelocidade;

  // Verifica se o peixe está dentro do mapa
  if (item.posX < 0) {
    item.velX *= -1;
  }
  if (item.posX + 2*item.raio>= width) {
    item.velX *= -1;
  }
  if (item.posY < 0) {
    item.velY *= -1;
  }
  if (item.posY + 2*item.raio >= (1-BEACH_SIZE_PCT)*height) {
    item.velY *= -1;
  }
  
  // desenheQuadrado(item)

  desenheFillCircle(item);
}

// Desenha um círculo
function desenheFillCircle(item) {
  // Essas duas variáveis são o ponto central do círculo circunscrito no 
  // "quadrado" definido a partir das coordenadas do peixe (x_0, y_0) e
  // o ponto (x_0 + raio, y_0 + raio)
  const centralX = item.posX + item.raio
  const centralY = item.posY + item.raio
  // Calcula o intervalo (em graus) entre cada vértice do "círculo"
  const deltaAngle = 360 / item.nVertices

  ctx.fillStyle = item.cor
  let circ = new Path2D();
  // Calcula a posição do primeiro vértice a partir do ponto central
  circ.moveTo(centralX, centralY + item.raio)
  for (let i=1; i<item.nVertices; i++) {
    // Calcula o próximo vértice a partir do vértice central + i*intervalo
    circ.lineTo(
      centralX + Math.sin(i*(deltaAngle*(Math.PI/180)))*item.raio,
      centralY + Math.cos(i*(deltaAngle*(Math.PI/180)))*item.raio
    )
  }
  circ.closePath();
  ctx.fill(circ);
}

//==================================================================
/**
 * sorteia um número inteiro entre min e max
 * @param {number} min 
 * @param {number} max 
 * @returns 
 */
function sorteie_inteiro(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}
