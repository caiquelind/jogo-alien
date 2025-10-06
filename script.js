// Canvas & UI Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('gameOver-screen');
const scoreDisplay = document.getElementById('score');
const finalScoreDisplay = document.getElementById('finalScore');
const shootButton = document.getElementById('shoot-button');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const langEnButton = document.getElementById('lang-en');
const langPtButton = document.getElementById('lang-pt');

// Set canvas size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// --- Language and Translations ---
const translations = {
    en: {
        scoreText: "Score",
        title: "Galaxy Shooter",
        subtitle: "Destroy the invaders before they reach you!",
        instructionsPC: "PC:",
        instructionsMobile: "Mobile:",
        startButton: "Start Game",
        gameOverTitle: "Game Over",
        finalScoreText: "Final Score",
        restartButton: "Play Again"
    },
    pt: {
        scoreText: "Pontos",
        title: "Atirador Galáctico",
        subtitle: "Destrua os invasores antes que eles cheguem até você!",
        instructionsPC: "PC:",
        instructionsMobile: "Celular:",
        startButton: "Começar Jogo",
        gameOverTitle: "Fim de Jogo",
        finalScoreText: "Pontuação Final",
        restartButton: "Jogar Novamente"
    }
};

function setLanguage(lang) {
    document.querySelectorAll('[data-text-key]').forEach(el => {
        const key = el.getAttribute('data-text-key');
        if(translations[lang][key]) {
            el.textContent = translations[lang][key];
        }
    });
    
    const instructionsDiv = document.querySelector('.instructions');
    if (lang === 'pt') {
        instructionsDiv.innerHTML = `
            <strong data-text-key="instructionsPC">${translations.pt.instructionsPC}</strong> Use as Setas para mover & Barra de Espaço para atirar.<br>
            <strong data-text-key="instructionsMobile">${translations.pt.instructionsMobile}</strong> Arraste para mover & use o botão de Atirar.
        `;
    } else {
        instructionsDiv.innerHTML = `
            <strong data-text-key="instructionsPC">${translations.en.instructionsPC}</strong> Use Arrow Keys to move & Spacebar to shoot.<br>
            <strong data-text-key="instructionsMobile">${translations.en.instructionsMobile}</strong> Drag to move & use the Shoot button.
        `;
    }
}


// Game Variables
let player, projectiles, enemies, particles, stars, meteorites, score, animationId;
let enemyInterval, angelInterval, meteoriteInterval;
const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    ' ': false
};

// Game Object Classes
class Player {
    constructor() {
        this.width = 50;
        this.height = 50;
        this.x = canvas.width / 2 - this.width / 2;
        this.y = canvas.height - this.height - 20;
        this.speed = 12;
        this.emoji = '🚀';
    }

    draw() {
        ctx.font = '40px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(this.emoji, this.x + this.width / 2, this.y + this.height - 5);
    }

    update() {
        if (keys.ArrowLeft && this.x > 0) {
            this.x -= this.speed;
        }
        if (keys.ArrowRight && this.x < canvas.width - this.width) {
            this.x += this.speed;
        }
        this.draw();
    }
}

class Projectile {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 5;
        this.color = '#ffeb3b';
        this.velocity = { x: 0, y: -8 };
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }

    update() {
        this.y += this.velocity.y;
        this.draw();
    }
}

class Enemy {
    constructor(x, y, type = 'normal') {
        this.x = x;
        this.y = y;
        this.radius = 25;
        this.type = type;

        if (this.type === 'angel') {
            this.emoji = '👼';
            this.velocity = { y: Math.random() * 3 + 0.5 };
        } else {
            this.emoji = ['👾', '👽', '🛸'][Math.floor(Math.random() * 3)];
            this.velocity = { y: Math.random() * 2 + 1 };
        }
    }

    draw() {
        ctx.font = '40px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(this.emoji, this.x, this.y);
    }
    
    update() {
        this.y += this.velocity.y;
        this.draw();
    }
}

class Particle {
     constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.radius = Math.random() * 2;
        this.color = color;
        this.velocity = {
            x: (Math.random() - 0.5) * (Math.random() * 6),
            y: (Math.random() - 0.5) * (Math.random() * 6)
        };
        this.alpha = 1;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }
    
    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.alpha -= 0.02;
        this.draw();
    }
}

class Star {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.radius = Math.random() * 1.5;
        this.speed = Math.random() * 2 + 0.5;
        this.color = 'white';
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }

    update() {
        this.y += this.speed;
        if (this.y > canvas.height) {
            this.y = 0;
            this.x = Math.random() * canvas.width;
        }
        this.draw();
    }
}

class Meteorite {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = -Math.random() * canvas.height; // Start above screen
        this.radius = Math.random() * 10 + 5; // Size between 5 and 15
        this.speed = Math.random() * 3 + 1; // Speed between 1 and 4
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.05;
        this.color = '#8B4513'; // Brown color for meteorite (not used if emoji is used)
        this.emoji = '🪨'; // Using a rock emoji for now, or could draw a shape
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.font = `${this.radius * 2}px sans-serif`; // Scale emoji with radius
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.emoji, 0, 0);
        ctx.restore();
    }

    update() {
        this.y += this.speed;
        this.rotation += this.rotationSpeed;
        if (this.y > canvas.height + this.radius) { // Reset when out of view
            this.y = -this.radius;
            this.x = Math.random() * canvas.width;
            this.radius = Math.random() * 10 + 5;
            this.speed = Math.random() * 3 + 1;
            this.rotation = Math.random() * Math.PI * 2;
            this.rotationSpeed = (Math.random() - 0.5) * 0.05;
        }
        this.draw();
    }
}


// --- Game Functions ---
function init() {
    player = new Player();
    projectiles = [];
    enemies = [];
    particles = [];
    stars = [];
    meteorites = [];
    score = 0;
    scoreDisplay.textContent = 0;
    finalScoreDisplay.textContent = 0;
    
    // Create initial stars
    for (let i = 0; i < 100; i++) {
        stars.push(new Star());
    }

    clearInterval(enemyInterval);
    clearInterval(angelInterval);
    clearInterval(meteoriteInterval); // Clear meteorite interval too
}

function spawnEnemies() {
    enemyInterval = setInterval(() => {
        if (animationId) {
            const x = Math.random() * (canvas.width - 50) + 25;
            enemies.push(new Enemy(x, -30));
        }
    }, 1200);
}

function spawnAngel() {
    angelInterval = setInterval(() => {
        if (animationId) {
            const x = Math.random() * (canvas.width - 50) + 25;
            enemies.push(new Enemy(x, -30, 'angel'));
        }
    }, 10000); // Angel spawns every 10 seconds
}

function spawnMeteorites() {
    meteoriteInterval = setInterval(() => {
        if (animationId) {
            meteorites.push(new Meteorite());
        }
    }, 5000); // Spawn a meteorite every 5 seconds
}

function stopSpawning() {
    clearInterval(enemyInterval);
    clearInterval(angelInterval);
    clearInterval(meteoriteInterval);
}

function handleCollision() {
    // Loop para verificar colisão de projéteis com inimigos
    for (let pIndex = projectiles.length - 1; pIndex >= 0; pIndex--) {
        const proj = projectiles[pIndex];
        for (let eIndex = enemies.length - 1; eIndex >= 0; eIndex--) {
            const enemy = enemies[eIndex];
            if (!enemy) continue; 
            
            const dist = Math.hypot(proj.x - enemy.x, proj.y - enemy.y);

            if (dist - enemy.radius - proj.radius < 1) {
                if (enemy.type === 'angel') {
                    score += 500;
                    
                    for (let i = enemies.length - 1; i >= 0; i--) {
                        const currentEnemy = enemies[i];
                        for (let p = 0; p < 15; p++) {
                            particles.push(new Particle(currentEnemy.x, currentEnemy.y, '#ffff00'));
                        }
                    }
                    enemies.length = 0; 
                    projectiles.splice(pIndex, 1);
                    scoreDisplay.textContent = score;
                    return; 
                } else {
                    for (let i = 0; i < 15; i++) {
                        particles.push(new Particle(enemy.x, enemy.y, '#ff4500'));
                    }
                    enemies.splice(eIndex, 1);
                    projectiles.splice(pIndex, 1);
                    score += 100;
                    scoreDisplay.textContent = score;
                    break; 
                }
            }
        }
    }

    // Loop para verificar colisão de inimigos com o jogador
    enemies.forEach((enemy, index) => {
        const dist = Math.hypot(player.x + player.width / 2 - enemy.x, player.y + player.height / 2 - enemy.y);

        // CONDIÇÃO DE GAME OVER: Acontece se um inimigo que NÃO é um anjo colidir ou passar da tela
        if (enemy.type !== 'angel' && (dist - enemy.radius - player.width / 2 < 1 || enemy.y > canvas.height)) {
            stopSpawning();
            cancelAnimationFrame(animationId);
            animationId = null;
            finalScoreDisplay.textContent = score;
            gameOverScreen.classList.remove('hidden');
            shootButton.classList.add('hidden');
        }

        // Se um anjo passar pela tela, apenas o removemos
        if (enemy.type === 'angel' && enemy.y > canvas.height) {
            setTimeout(() => enemies.splice(index, 1), 0);
        }
    });
}

function animate() {
    animationId = requestAnimationFrame(animate);
    ctx.fillStyle = 'rgba(12, 10, 24, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Update and draw background elements first
    stars.forEach(star => star.update());
    meteorites.forEach(meteorite => meteorite.update());

    player.update();
    
    particles.forEach((particle, index) => {
        if(particle.alpha <= 0) {
            particles.splice(index, 1);
        } else {
            particle.update();
        }
    });

    projectiles.forEach((proj, index) => {
        if (proj.y + proj.radius < 0) {
            setTimeout(() => projectiles.splice(index, 1), 0);
        } else {
            proj.update();
        }
    });

    enemies.forEach(enemy => enemy.update());
    handleCollision();
}

// --- Event Listeners ---
function shoot() {
    projectiles.push(new Projectile(player.x + player.width / 2, player.y));
}

window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ' && animationId) {
        e.preventDefault();
        shoot();
    }
});
window.addEventListener('keyup', (e) => keys[e.key] = false);

let isTouching = false;
canvas.addEventListener('touchstart', (e) => {
    isTouching = true;
    handleTouchMove(e);
});
canvas.addEventListener('touchmove', handleTouchMove);
canvas.addEventListener('touchend', () => isTouching = false);

function handleTouchMove(e) {
    if (isTouching && animationId) {
        let touchX = e.touches[0].clientX;
        player.x = touchX - player.width / 2;
    }
}

shootButton.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (animationId) shoot();
});

function startGame() {
    init();
    animate();
    spawnEnemies();
    spawnAngel();
    spawnMeteorites(); // Start spawning meteorites
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    shootButton.classList.remove('hidden');
}

startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);

langEnButton.addEventListener('click', () => setLanguage('en'));
langPtButton.addEventListener('click', () => setLanguage('pt'));

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if(player) {
       player.y = canvas.height - player.height - 20;
    }
    // Reinitialize stars to fill new canvas size
    if (stars && stars.length > 0) {
        stars = [];
        for (let i = 0; i < 100; i++) {
            stars.push(new Star());
        }
    }
});

window.addEventListener('DOMContentLoaded', () => {
    setLanguage('en'); 
});
