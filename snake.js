// Configurações do jogo
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const playAgainBtn = document.getElementById('playAgainBtn');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const finalScoreElement = document.getElementById('finalScore');
const gameOverModal = document.getElementById('gameOverModal');
const gameOverImage = document.getElementById('gameOverImage');

// Imagens de Game Over
const gameOverImages = [
    'maressabrava.jpeg',
    'maressatriste.jpeg'
];

// Dimensões do canvas
const canvasWidth = 400;
const canvasHeight = 400;
canvas.width = canvasWidth;
canvas.height = canvasHeight;

// Tamanho de cada segmento da Polychaeta e do plâncton
const segmentSize = 20;

// Cores temáticas oceânicas
const colors = {
    background: '#001e3c',
    polychaetaHead: '#ff6b6b',
    polychaetaBody: '#ff9e7d',
    polychaetaOutline: '#c1121f',
    plankton: '#90e0ef',
    planktonGlow: 'rgba(144, 224, 239, 0.7)',
    grid: 'rgba(0, 119, 182, 0.1)'
};

// Estado do jogo
let polychaeta = [];
let plankton = { x: 0, y: 0 };
let direction = 'right';
let nextDirection = 'right';
let score = 0;
let highScore = localStorage.getItem('polychaetaHighScore') || 0;
let gameSpeed = 150; // Velocidade inicial em milissegundos
let gameInterval;
let gameActive = false;
let gameStarted = false;

// Inicialização
function init() {
    // Definir o recorde salvo
    highScoreElement.textContent = highScore;
    
    // Configurar eventos de teclado
    document.addEventListener('keydown', handleKeyPress);
    
    // Configurar botões de jogo
    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', startGame);
    playAgainBtn.addEventListener('click', () => {
        gameOverModal.style.display = 'none';
        startGame();
    });
    
    // Configurar botões direcionais para mobile
    const upBtn = document.getElementById('upBtn');
    const downBtn = document.getElementById('downBtn');
    const leftBtn = document.getElementById('leftBtn');
    const rightBtn = document.getElementById('rightBtn');
    
    // Adicionar eventos de toque e clique para os botões direcionais
    upBtn.addEventListener('click', () => handleDirectionChange('up'));
    downBtn.addEventListener('click', () => handleDirectionChange('down'));
    leftBtn.addEventListener('click', () => handleDirectionChange('left'));
    rightBtn.addEventListener('click', () => handleDirectionChange('right'));
    
    // Prevenir comportamento padrão de toque para evitar zoom ou scroll
    const directionBtns = document.querySelectorAll('.direction-btn');
    directionBtns.forEach(btn => {
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const direction = btn.id.replace('Btn', '');
            handleDirectionChange(direction);
        });
    });
    
    // Desenhar o canvas inicial
    drawGrid();
    drawInstructions();
}

// Desenhar grade de fundo
function drawGrid() {
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Desenhar linhas de grade para simular correntes oceânicas
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;
    
    // Linhas horizontais
    for (let y = 0; y < canvasHeight; y += segmentSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvasWidth, y);
        ctx.stroke();
    }
    
    // Linhas verticais
    for (let x = 0; x < canvasWidth; x += segmentSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvasHeight);
        ctx.stroke();
    }
}

// Desenhar instruções iniciais
function drawInstructions() {
    ctx.fillStyle = '#90e0ef';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Polychaeta', canvasWidth / 2, canvasHeight / 2 - 50);
    ctx.font = '16px Arial';
    ctx.fillText('O Verme Marinho', canvasWidth / 2, canvasHeight / 2 - 25);
    ctx.font = '14px Arial';
    ctx.fillText('Use as setas para movimentar', canvasWidth / 2, canvasHeight / 2 + 20);
    ctx.fillText('Colete plâncton para crescer', canvasWidth / 2, canvasHeight / 2 + 45);
    ctx.fillText('Clique em Iniciar para começar', canvasWidth / 2, canvasHeight / 2 + 70);
}

// Iniciar o jogo
function startGame() {
    // Resetar estado do jogo
    polychaeta = [
        { x: 5 * segmentSize, y: 10 * segmentSize },
        { x: 4 * segmentSize, y: 10 * segmentSize },
        { x: 3 * segmentSize, y: 10 * segmentSize }
    ];
    direction = 'right';
    nextDirection = 'right';
    score = 0;
    scoreElement.textContent = score;
    gameSpeed = 150;
    
    // Gerar primeiro plâncton
    generatePlankton();
    
    // Atualizar UI
    startBtn.style.display = 'none';
    restartBtn.style.display = 'inline-block';
    
    // Iniciar loop do jogo
    if (gameInterval) clearInterval(gameInterval);
    gameActive = true;
    gameStarted = true;
    gameInterval = setInterval(gameLoop, gameSpeed);
}

// Loop principal do jogo
function gameLoop() {
    if (!gameActive) return;
    
    // Atualizar direção
    direction = nextDirection;
    
    // Mover a Polychaeta
    movePolychaeta();
    
    // Verificar colisões
    if (checkCollision()) {
        gameOver();
        return;
    }
    
    // Verificar se comeu plâncton
    checkPlankton();
    
    // Desenhar tudo
    draw();
}

// Mover a Polychaeta
function movePolychaeta() {
    // Obter a posição atual da cabeça
    const head = { ...polychaeta[0] };
    
    // Calcular nova posição da cabeça baseada na direção
    switch (direction) {
        case 'up':
            head.y -= segmentSize;
            break;
        case 'down':
            head.y += segmentSize;
            break;
        case 'left':
            head.x -= segmentSize;
            break;
        case 'right':
            head.x += segmentSize;
            break;
    }
    
    // Adicionar nova cabeça ao início do array
    polychaeta.unshift(head);
    
    // Remover o último segmento (a menos que tenha comido plâncton)
    if (head.x === plankton.x && head.y === plankton.y) {
        // Não remove o último segmento, permitindo crescimento
        // Gerar novo plâncton será tratado em checkPlankton()
    } else {
        polychaeta.pop();
    }
}

// Verificar colisões com paredes ou com o próprio corpo
function checkCollision() {
    const head = polychaeta[0];
    
    // Colisão com paredes
    if (
        head.x < 0 || 
        head.x >= canvasWidth || 
        head.y < 0 || 
        head.y >= canvasHeight
    ) {
        return true;
    }
    
    // Colisão com o próprio corpo
    for (let i = 1; i < polychaeta.length; i++) {
        if (head.x === polychaeta[i].x && head.y === polychaeta[i].y) {
            return true;
        }
    }
    
    return false;
}

// Verificar se a Polychaeta comeu plâncton
function checkPlankton() {
    const head = polychaeta[0];
    
    if (head.x === plankton.x && head.y === plankton.y) {
        // Aumentar pontuação
        score++;
        scoreElement.textContent = score;
        
        // Atualizar recorde se necessário
        if (score > highScore) {
            highScore = score;
            highScoreElement.textContent = highScore;
            localStorage.setItem('polychaetaHighScore', highScore);
        }
        
        // Gerar novo plâncton
        generatePlankton();
        
        // Aumentar velocidade a cada 5 pontos
        if (score % 5 === 0 && gameSpeed > 60) {
            gameSpeed -= 10;
            clearInterval(gameInterval);
            gameInterval = setInterval(gameLoop, gameSpeed);
        }
    }
}

// Gerar plâncton em posição aleatória
function generatePlankton() {
    // Gerar coordenadas aleatórias
    let newX, newY;
    let validPosition = false;
    
    while (!validPosition) {
        newX = Math.floor(Math.random() * (canvasWidth / segmentSize)) * segmentSize;
        newY = Math.floor(Math.random() * (canvasHeight / segmentSize)) * segmentSize;
        
        // Verificar se não está sobre a Polychaeta
        validPosition = true;
        for (const segment of polychaeta) {
            if (segment.x === newX && segment.y === newY) {
                validPosition = false;
                break;
            }
        }
    }
    
    plankton = { x: newX, y: newY };
}

// Desenhar todos os elementos
function draw() {
    // Limpar canvas
    drawGrid();
    
    // Desenhar plâncton com efeito de brilho
    ctx.fillStyle = colors.planktonGlow;
    ctx.beginPath();
    ctx.arc(
        plankton.x + segmentSize / 2, 
        plankton.y + segmentSize / 2, 
        segmentSize / 1.5, 
        0, 
        Math.PI * 2
    );
    ctx.fill();
    
    // Desenhar plâncton
    ctx.fillStyle = colors.plankton;
    ctx.beginPath();
    ctx.arc(
        plankton.x + segmentSize / 2, 
        plankton.y + segmentSize / 2, 
        segmentSize / 2.5, 
        0, 
        Math.PI * 2
    );
    ctx.fill();
    
    // Adicionar detalhes ao plâncton
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(
        plankton.x + segmentSize / 2 - 2, 
        plankton.y + segmentSize / 2 - 2, 
        segmentSize / 8, 
        0, 
        Math.PI * 2
    );
    ctx.fill();
    
    // Desenhar a Polychaeta
    polychaeta.forEach((segment, index) => {
        // Determinar se é cabeça ou corpo
        const isHead = index === 0;
        
        // Desenhar segmento
        ctx.fillStyle = isHead ? colors.polychaetaHead : colors.polychaetaBody;
        ctx.fillRect(segment.x, segment.y, segmentSize, segmentSize);
        
        // Adicionar contorno
        ctx.strokeStyle = colors.polychaetaOutline;
        ctx.lineWidth = 2;
        ctx.strokeRect(segment.x, segment.y, segmentSize, segmentSize);
        
        // Adicionar detalhes à cabeça
        if (isHead) {
            // Olhos
            const eyeSize = segmentSize / 5;
            
            // Posição dos olhos baseada na direção
            let leftEyeX, leftEyeY, rightEyeX, rightEyeY;
            
            switch (direction) {
                case 'up':
                    leftEyeX = segment.x + eyeSize;
                    leftEyeY = segment.y + eyeSize;
                    rightEyeX = segment.x + segmentSize - eyeSize * 2;
                    rightEyeY = segment.y + eyeSize;
                    break;
                case 'down':
                    leftEyeX = segment.x + eyeSize;
                    leftEyeY = segment.y + segmentSize - eyeSize * 2;
                    rightEyeX = segment.x + segmentSize - eyeSize * 2;
                    rightEyeY = segment.y + segmentSize - eyeSize * 2;
                    break;
                case 'left':
                    leftEyeX = segment.x + eyeSize;
                    leftEyeY = segment.y + eyeSize;
                    rightEyeX = segment.x + eyeSize;
                    rightEyeY = segment.y + segmentSize - eyeSize * 2;
                    break;
                case 'right':
                    leftEyeX = segment.x + segmentSize - eyeSize * 2;
                    leftEyeY = segment.y + eyeSize;
                    rightEyeX = segment.x + segmentSize - eyeSize * 2;
                    rightEyeY = segment.y + segmentSize - eyeSize * 2;
                    break;
            }
            
            // Desenhar olhos
            ctx.fillStyle = 'white';
            ctx.fillRect(leftEyeX, leftEyeY, eyeSize, eyeSize);
            ctx.fillRect(rightEyeX, rightEyeY, eyeSize, eyeSize);
            
            // Pupilas
            ctx.fillStyle = 'black';
            ctx.fillRect(leftEyeX + eyeSize / 4, leftEyeY + eyeSize / 4, eyeSize / 2, eyeSize / 2);
            ctx.fillRect(rightEyeX + eyeSize / 4, rightEyeY + eyeSize / 4, eyeSize / 2, eyeSize / 2);
        }
        
        // Adicionar detalhes ao corpo (cerdas da Polychaeta)
        if (!isHead && index % 2 === 0) {
            ctx.strokeStyle = '#ff9e7d';
            ctx.lineWidth = 1;
            
            // Cerdas laterais (característica dos Polychaeta)
            const cerdasLength = segmentSize / 4;
            
            // Lado esquerdo
            ctx.beginPath();
            ctx.moveTo(segment.x, segment.y + segmentSize / 2);
            ctx.lineTo(segment.x - cerdasLength, segment.y + segmentSize / 2 - cerdasLength);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(segment.x, segment.y + segmentSize / 2);
            ctx.lineTo(segment.x - cerdasLength, segment.y + segmentSize / 2 + cerdasLength);
            ctx.stroke();
            
            // Lado direito
            ctx.beginPath();
            ctx.moveTo(segment.x + segmentSize, segment.y + segmentSize / 2);
            ctx.lineTo(segment.x + segmentSize + cerdasLength, segment.y + segmentSize / 2 - cerdasLength);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(segment.x + segmentSize, segment.y + segmentSize / 2);
            ctx.lineTo(segment.x + segmentSize + cerdasLength, segment.y + segmentSize / 2 + cerdasLength);
            ctx.stroke();
        }
    });
}

// Lidar com teclas pressionadas
function handleKeyPress(e) {
    if (!gameStarted) {
        if (e.key === 'Enter') {
            startGame();
            return;
        }
    }
    
    if (!gameActive) return;
    
    // Evitar que a Polychaeta volte sobre si mesma
    switch (e.key) {
        case 'ArrowUp':
            if (direction !== 'down') nextDirection = 'up';
            break;
        case 'ArrowDown':
            if (direction !== 'up') nextDirection = 'down';
            break;
        case 'ArrowLeft':
            if (direction !== 'right') nextDirection = 'left';
            break;
        case 'ArrowRight':
            if (direction !== 'left') nextDirection = 'right';
            break;
    }
}

// Função para lidar com mudanças de direção dos botões touch
function handleDirectionChange(newDirection) {
    if (!gameStarted) {
        startGame();
        return;
    }
    
    if (!gameActive) return;
    
    // Aplicar a mesma lógica de prevenção de voltar sobre si mesma
    switch (newDirection) {
        case 'up':
            if (direction !== 'down') nextDirection = 'up';
            break;
        case 'down':
            if (direction !== 'up') nextDirection = 'down';
            break;
        case 'left':
            if (direction !== 'right') nextDirection = 'left';
            break;
        case 'right':
            if (direction !== 'left') nextDirection = 'right';
            break;
    }
}

// Game Over
function gameOver() {
    gameActive = false;
    clearInterval(gameInterval);
    
    // Atualizar pontuação final
    finalScoreElement.textContent = score;
    
    // Selecionar aleatoriamente uma imagem para exibir
    const randomIndex = Math.floor(Math.random() * gameOverImages.length);
    gameOverImage.src = gameOverImages[randomIndex];
    
    // Ajustar estilo da imagem
    gameOverImage.style.maxWidth = '100%';
    gameOverImage.style.borderRadius = '10px';
    gameOverImage.style.marginBottom = '15px';
    
    // Mostrar modal de Game Over
    gameOverModal.style.display = 'flex';
    
    // Efeito visual de Game Over
    ctx.fillStyle = 'rgba(193, 18, 31, 0.3)';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Polychaeta Encalhada!', canvasWidth / 2, canvasHeight / 2 - 20);
    ctx.font = '20px Arial';
    ctx.fillText(`Plâncton Consumido: ${score}`, canvasWidth / 2, canvasHeight / 2 + 20);
}

// Inicializar o jogo quando a página carregar
window.onload = init;
