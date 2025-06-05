const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const ver = '00000039'; // Versión del juego

// Configuración del canvas
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
    //location.reload(); // Recargar la página al cambiar el tamaño de la ventana

    // Configuración del canvas
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    //
    groundY = canvas.height * 0.8; // Altura del suelo al 80% del alto del canvas
    dinosaurY = groundY - desiredHeight + 5;
    //
    visibleBladeCount = Math.ceil(canvas.width / grassSpacing) + 1;
    grassBladeCount = visibleBladeCount * 4; // 4 veces más pasto

    for (let i = grassBlades.length; i < grassBladeCount; i++) {
        console.log('la pantalla cambio de tamaño, se generaron nuevas briznas de pasto');
        grassBlades.push({
            x: i * grassSpacing,
            height: 10 + Math.random() * 10,
            swayOffset: Math.random() * 100,
            color: ['#228B22', '#2E8B57', '#32CD32'][Math.floor(Math.random() * 3)]
        });
    }
});

// Cargar sprites
const dinosaurSprites = {
    idle: new Image(),
};

const logo = new Image();
logo.src = 'logo.png';


dinosaurSprites.walkFrames = [];
for (let i = 1; i <= 10; i++) {
    const img = new Image();
    img.src = `Walk (${i}).png`;
    dinosaurSprites.walkFrames.push(img);
}

dinosaurSprites.jumpFrames = [];
for (let i = 1; i <= 12; i++) {
    const img = new Image();
    img.src = `Jump (${i}).png`;
    dinosaurSprites.jumpFrames.push(img);
}

dinosaurSprites.deadFrames = [];
for (let i = 1; i <= 8; i++) {
    const img = new Image();
    img.src = `Dead (${i}).png`;
    dinosaurSprites.deadFrames.push(img);
}

dinosaurSprites.idle.src = 'idle_sprite.png'; // Ruta a tus sprites

const walkAudio = new Audio('sfx_step_grass_l.flac');
walkAudio.preload = 'auto';

const jumpAudio = new Audio('jump.mp3');
jumpAudio.preload = 'auto';

const gameoverAudio = new Audio('gameover.ogg');
gameoverAudio.preload = 'auto';

// Variables del juego
const desiredHeight = 150;
let score = 0;
let scoreInterval;
let dinosaurX = 50;
let groundY = canvas.height * 0.8; // Altura del suelo al 80% del alto del canvas
let dinosaurY = groundY - desiredHeight+5;

let dinosaurVelY = 0;  // Velocidad en Y del dinosaurio (gravedad)
let isJumping = false;
let jumpSpeed = -1000;  // Velocidad de salto hacia arriba
let gravity = 2000;      // Gravedad (aceleración)
let clouds = [];
let obstacles = [];
let mountains = [];
let speed = 300; // Velocidad de movimiento de los obstáculos

let isGrounded = true; // Determina si el dinosaurio está tocando el suelo
let gameover = false;

// Control de teclas
let keys = {};





let walkFrameIndex = 0;
let walkFrameCounter = 0;
//
let jumpFrameIndex = 0;
let jumpFrameCounter = 0;
//
//
let deadFrameIndex = 0;
let deadFrameCounter = 0;

function drawDinosaur() {
    let sprite;

    if(gameover){
        // Avanzar al siguiente frame de caminata cada 6 ciclos (~16 fps)
        if(deadFrameIndex < 7){
            deadFrameCounter++;
            if (deadFrameCounter % 9 === 0) {
                deadFrameIndex = (deadFrameIndex + 1) % dinosaurSprites.deadFrames.length;
            }
        }
        sprite = dinosaurSprites.deadFrames[deadFrameIndex];
        //
        if (!isGrounded) {
            dinosaurVelY += gravity; // Aplicar gravedad
            dinosaurY += dinosaurVelY; // Mover al dinosaurio hacia abajo
    
            // Si el dinosaurio toca el suelo
            if (dinosaurY >= groundY - desiredHeight + 5) {
                dinosaurY = groundY - desiredHeight + 5; // Asegurarse de que el dinosaurio no pase del suelo
                dinosaurVelY = 0; // Detener la caída
                isJumping = false; // El dinosaurio ya no está saltando
                isGrounded = true; // El dinosaurio está de vuelta en el suelo
            }
        }
    }else if (isJumping) {
        // Avanzar al siguiente frame de caminata cada 6 ciclos (~16 fps)
        jumpFrameCounter++;
        const frameDuration = 10; 
        jumpFrameCounter += deltaTime;
        if (jumpFrameCounter >= frameDuration) {
            jumpFrameIndex = (jumpFrameIndex + 1) % dinosaurSprites.jumpFrames.length;
            jumpFrameCounter = 0; // Reiniciar el contador
        }
        sprite = dinosaurSprites.jumpFrames[jumpFrameIndex];
    } else {
        // Avanzar al siguiente frame de caminata basado en deltaTime (~16 fps)
        const frameDuration = 0.1; // Duración de cada frame en segundos (1/10 de segundo)
        walkFrameCounter += deltaTime;
        if (walkFrameCounter >= frameDuration) {
            walkFrameIndex = (walkFrameIndex + 1) % dinosaurSprites.walkFrames.length;
            walkFrameCounter = 0; // Reiniciar el contador
            //
            // Reproduce el sonido solo cuando cambia el frame
            if (gameStarted && walkAudio.paused) {
            walkAudio.currentTime = 0; // Reinicia el audio
            walkAudio.play().catch(e => console.log('No se pudo reproducir:', e));
            }
        }
        sprite = dinosaurSprites.walkFrames[walkFrameIndex];
    }

    const aspectRatio = sprite.width / sprite.height;
    
    const desiredWidth = desiredHeight * aspectRatio;

    ctx.drawImage(sprite, dinosaurX, dinosaurY + 10, desiredWidth, desiredHeight);
}

// Función para hacer que el dinosaurio salte
//let ignoredFirstJump = false;
function jump() {
    // Verificar si el dinosaurio está en el suelo y la tecla de espacio está presionada
    if (keys['Space'] && isGrounded) {
        /*if (!ignoredFirstJump) {
            ignoredFirstJump = true; // Solo ignoramos la primera vez
            return; // Salimos sin saltar
        }*/
        //
        jumpFrameIndex = 0;
        // Reproduce el sonido solo cuando cambia el frame
        jumpAudio.currentTime = 0; // Reinicia el audio
        jumpAudio.play().catch(e => console.log('No se pudo reproducir:', e));
        
        dinosaurVelY = jumpSpeed; // Iniciar el salto
        isGrounded = false; // El dinosaurio ya no está en el suelo
        isJumping = true;
    }

    // Aplicar gravedad si el dinosaurio está en el aire
    if (!isGrounded) {
        dinosaurVelY += gravity * deltaTime; // Aplicar aceleración gravitacional con deltaTime
        dinosaurY += dinosaurVelY * deltaTime; // Aplicar el desplazamiento con deltaTime

        // Si el dinosaurio toca el suelo
        if (dinosaurY >= groundY - desiredHeight + 5) {
            dinosaurY = groundY - desiredHeight + 5; // Asegurarse de que el dinosaurio no pase del suelo
            dinosaurVelY = 0; // Detener la caída
            isJumping = false; // El dinosaurio ya no está saltando
            isGrounded = true; // El dinosaurio está de vuelta en el suelo
        }
    }
}

function generateObstacles() {
    // Condición para generar un nuevo obstáculo con cierta distancia y probabilidad
    if (
        obstacles.length === 0 ||
        (canvas.width - obstacles[obstacles.length - 1].x) > (Math.random() * 300 + 200)
    ) {
        if (Math.random() < 0.02) { // Probabilidad para generar el obstáculo
            const width = Math.random() * 20 + 30; // Ancho del tronco reducido
            const height = Math.random() * 70 + 40; // Alto del tronco
            const x = canvas.width;
            const y = groundY - height;
            const trunkColor = ['#3B2F2F', '#4F3C2F', '#5C4033'][Math.floor(Math.random() * 3)];

            // Parámetros de la copa (se calcula una sola vez al generar el árbol)
            const crownWidth = width * 1.5 + Math.random() * 40; // Ancho de la copa
            const crownHeight = Math.max(crownWidth + 20, height * 0.8 + Math.random() * 20); // Asegurar que el alto sea mayor que el ancho
            const crownY = y - crownHeight * 0.5; // Ubicación vertical de la copa (más baja)

            // Generar las "elipses" de la copa en un arreglo para hacerlo más orgánico
            const crownEllipses = [];

            // Variar el número de elipses en la copa (de 2 a 4)
            const numEllipses = 3 + Math.floor(Math.random() * 6);

            for (let i = 0; i < numEllipses; i++) {
                const offsetX = Math.random() * crownWidth * 0.5 - crownWidth * 0.2; // Limitar el desplazamiento horizontal de las elipses
                const offsetY = Math.random() * (crownHeight * 0.6) - (crownHeight * 0.3); // Ajustar el desplazamiento vertical
                const ellipseWidth = Math.random() * crownWidth * 0.2 + crownWidth * 0.3; // Reducir el ancho de las elipses
                const ellipseHeight = Math.random() * crownHeight * 0.2 + crownHeight * 0.3; // Reducir la altura de las elipses

                crownEllipses.push({ offsetX, offsetY, ellipseWidth, ellipseHeight });
            }

            // Generar el obstáculo con la copa ya calculada
            obstacles.push({
                x, y, width, height, trunkColor, crownWidth, crownHeight, crownY, crownEllipses
            });
        }
    }

    obstacles.forEach((obs, index) => {
        obs.x -= speed * deltaTime;
        obs.y = groundY - obs.height; // Mantener el tronco en la posición correcta

        if (obs.x + obs.width < 0) {
            obstacles.splice(index, 1);
            return;
        }
        

        // Dibujo del tronco
        ctx.fillStyle = obs.trunkColor;
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);

        // Dibujar la copa del árbol (ahora usando elipses para mayor realismo)
        ctx.fillStyle = '#228B22'; // Color verde para la copa

        // Fijar la copa al tronco
        const crownCenterX = obs.x + obs.width / 2; // Centro de la copa
        const crownCenterY = (obs.y - obs.crownHeight * 0.5) + obs.crownHeight / 2; // Centro de la copa en Y

        // Dibujar las elipses para la copa usando el arreglo pre-calculado
        obs.crownEllipses.forEach(ellipse => {
            ctx.beginPath();
            ctx.ellipse(crownCenterX + ellipse.offsetX, crownCenterY + ellipse.offsetY,
                ellipse.ellipseWidth, ellipse.ellipseHeight, 0, 0, Math.PI * 2);
            ctx.fill();
        });
    });
}



// Generar las briznas solo una vez
let grassBlades = [];
const grassSpacing = 3;
let visibleBladeCount = Math.ceil(canvas.width / grassSpacing) + 1;
let grassBladeCount = visibleBladeCount * 4; // 4 veces más pasto

for (let i = 0; i < grassBladeCount; i++) {
    grassBlades.push({
        x: i * grassSpacing,
        height: 10 + Math.random() * 10,
        swayOffset: Math.random() * 100,
        color: ['#228B22', '#2E8B57', '#32CD32'][Math.floor(Math.random() * 3)]
    });
}

let grassWindOffset = 0;

function drawGround() {
    // Suelo
    ctx.fillStyle = '#654321';
    ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);
    //
    updateAndDrawSoilDetails(); // Llamar a la función para dibujar la textura del suelo

    grassWindOffset += 0.02;

    // Mover y dibujar cada brizna
    for (let blade of grassBlades) {
        
        blade.x -= (speed * deltaTime); // movimiento hacia atrás
        if (blade.x < -grassSpacing) {
            blade.x = canvas.width + (Math.random() * canvas.width * 3); // alejado al final
            // Re-randomizar sus atributos
            blade.height = 10 + Math.random() * 10;
            blade.swayOffset = Math.random() * 100;
            blade.color = ['#228B22', '#2E8B57', '#32CD32'][Math.floor(Math.random() * 3)];
        }

        if (blade.x > -10 && blade.x < canvas.width + 10) {
            const lean = Math.sin(grassWindOffset + blade.swayOffset) * 1.5;
    
            ctx.beginPath();
            ctx.strokeStyle = blade.color;
            ctx.lineWidth = 1;
            ctx.moveTo(blade.x, groundY);
            ctx.lineTo(blade.x + lean, groundY - blade.height);
            ctx.stroke();
        }
    }
}

let soilDetails = [];

function updateAndDrawSoilDetails() {
    // Agregar nuevas piedras y fósiles si no hay muchas o la última está lejos
    if (soilDetails.length === 0 || (canvas.width - soilDetails[soilDetails.length - 1].x) > 100) {
        const randomType = Math.random(); // Determina si será una piedra o un fósil (hueso)
        const randomOffset = Math.random() * (canvas.height - groundY - 10); // Guardamos el resultado de Math.random() para su uso posterior

        const stoneY = groundY + randomOffset ;
        const color = ['#3b2a19', '#4a3624', '#2e1c0d', '#5a4633'][Math.floor(Math.random() * 4)];
        
        if (randomType < 0.8) { // 80% de probabilidad para una piedra
            const radius = 4 + Math.random() * 10; // Tamaño mayor
            const squish = 0.6 + Math.random() * 0.8;
            const rotation = Math.random() * Math.PI;

            soilDetails.push({
                type: 'stone',
                x: canvas.width + 10,
                y: stoneY,
                radius,
                squish,
                rotation,
                color,
                randomOffset
            });
        } else { // 20% de probabilidad para un fósil (hueso)
            const width = 15 + Math.random() * 30; // Ancho del hueso
            const height = 5 + Math.random() * 10; // Alto del hueso
            const rotation = Math.random() * Math.PI; // Rotación aleatoria

            soilDetails.push({
                type: 'fossil',
                x: canvas.width + 10,
                y: stoneY,
                width,
                height,
                rotation,
                color: '#d2b48c', // Color de hueso
                randomOffset
            });
        }
    }

    // Dibujar y mover piedras y fósiles
    soilDetails.forEach((item, index) => {
        item.x -= speed * deltaTime; // Se mueven con el suelo

        if (item.x + item.radius * 2 < 0 || item.x + item.width < 0) {
            soilDetails.splice(index, 1); // Eliminar si ya salió
        }

        // Usar el valor guardado en `randomOffset` para mantener la posición de `y` constante
        item.y = groundY + item.randomOffset;

        if (item.type === 'stone') {
            drawStone(item);
        } else if (item.type === 'fossil') {
            drawFossil(item);
        }
    });
}

function drawStone(stone) {
    ctx.beginPath();
    ctx.ellipse(stone.x, stone.y, stone.radius, stone.radius * stone.squish, stone.rotation, 0, Math.PI * 2);
    ctx.fillStyle = stone.color;
    ctx.fill();
}

const fossilColors = ['#e0d8c3', '#dcd6b4', '#cfc6a4', '#eee8dd'];
function drawFossil(fossil) {
    ctx.save();
    ctx.translate(fossil.x, fossil.y);
    ctx.rotate(fossil.rotation);

    const centerWidth = fossil.width * 0.6;
    const centerHeight = fossil.height * 0.4;
    const endOffset = fossil.height * 0.2;
    const endRadius = fossil.height * 0.3;

    // Color de hueso
    ctx.fillStyle = fossil.color;

    // Parte central del hueso
    ctx.beginPath();
    ctx.ellipse(0, 0, centerWidth / 2, centerHeight / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Función para dibujar 2 círculos en diagonal en cada extremo
    function drawBoneEnds(offsetX) {
        ctx.beginPath();
        ctx.arc(offsetX, -endOffset, endRadius, 0, Math.PI * 2);
        ctx.arc(offsetX, +endOffset, endRadius, 0, Math.PI * 2);
        ctx.fill();
    }

    drawBoneEnds(-centerWidth / 2); // Izquierdo
    drawBoneEnds(centerWidth / 2);  // Derecho

    ctx.restore();
}

let meteorites = [];
let nextMeteoriteTime = 0; // Tiempo hasta que aparezca el próximo meteorito

function updateAndDrawMeteorites() {
    nextMeteoriteTime -= deltaTime;

    if (nextMeteoriteTime <= 0) {
        spawnMeteorite();
        nextMeteoriteTime = 1 + Math.random() * 20; // Tiempo aleatorio entre meteoritos
    }

    for (let i = meteorites.length - 1; i >= 0; i--) {
        const m = meteorites[i];
        m.x += m.vx * deltaTime;
        m.y += m.vy * deltaTime;

        const trailWidth = m.size * 2.5; // Ancho de la cola
        const trailLength = trailWidth * (2 + Math.random() * 3); // Longitud de la cola aleatoria

        const angle = Math.atan2(m.vy, m.vx); // Dirección del meteorito

        // Punta del triángulo (en dirección opuesta al movimiento)
        const tipX = m.x - Math.cos(angle) * trailLength;
        const tipY = m.y - Math.sin(angle) * trailLength;

        // Base del triángulo (más cerca del meteorito, en dirección de movimiento)
        const baseCenterX = m.x;
        const baseCenterY = m.y;

        // Perpendicular para los lados de la base
        const perpX = Math.cos(angle + Math.PI / 2) * trailWidth / 2;
        const perpY = Math.sin(angle + Math.PI / 2) * trailWidth / 2;

        const baseLeftX = baseCenterX + perpX;
        const baseLeftY = baseCenterY + perpY;
        const baseRightX = baseCenterX - perpX;
        const baseRightY = baseCenterY - perpY;

        // Dibujar la cola triangular invertida
        ctx.beginPath();
        ctx.fillStyle = ['#FF4500', '#FF6347', '#FFA500', '#FF8C00', '#FFD700', '#FF7F50', '#FF6A6A', '#FF4500', '#FF3030'][Math.floor(Math.random() * 9)];
        ctx.moveTo(baseLeftX, baseLeftY); // Base izquierda
        ctx.lineTo(baseRightX, baseRightY); // Base derecha
        ctx.lineTo(tipX, tipY); // Punta (en la dirección contraria al meteorito)
        ctx.closePath();
        ctx.fill();

        // Fuego exterior
        ctx.beginPath();
        ctx.fillStyle = ['#FF4500', '#FF6347', '#FFA500', '#FF8C00', '#FFD700', '#FF7F50', '#FF6A6A', '#FF4500', '#FF3030'][Math.floor(Math.random() * 9)];
        ctx.arc(m.x, m.y, m.size * 1.4, 0, Math.PI * 2);
        ctx.fill();

        /*ctx.save();


        // Agregar una sombra para dar un efecto de profundidad
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;*/
        // Núcleo café
        ctx.beginPath();
        ctx.fillStyle = m.rockColor;
        ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
        ctx.fill();

        //ctx.restore();

        if (m.x < -100 || m.x > canvas.width + 100 || m.y > canvas.height + 100) {
            meteorites.splice(i, 1);
        }
    }
}

function spawnMeteorite() {
    const startX = Math.random() * canvas.width;
    const startY = -30;
    const speedMet = 0.4 + Math.random() * 0.6;

    // Cambiar ángulo a un rango de -π/4 a π/4 (izquierda o derecha) pero asegurándonos de que vy sea positivo
    const angle = Math.random() * Math.PI / 2 - Math.PI / 4; // Ángulo entre -45° y 45°

    // Asegurarse de que los meteoritos caigan hacia abajo, por eso forzamos vy a ser positivo
    const vy = Math.abs(Math.sin(angle) * speedMet * 100);  // Asegurar que la velocidad vertical sea positiva (hacia abajo)
    
    // Aleatoriamente asignamos vx positivo (izquierda a derecha) o negativo (derecha a izquierda)
    const vx = (Math.random() < 0.5 ? -1 : 1) * Math.cos(angle) * speedMet * 100;  // Dirección aleatoria

    meteorites.push({
        x: startX,
        y: startY,
        vx: vx,
        vy: vy,
        size: 5 + Math.random() * 15, // Tamaño del núcleo
        rockColor: '#8B4513', // Café roca
    });
}

// Función para detectar colisiones con un margen extra
function detectCollisions() {
    const margin = -20;  // Márgen adicional para la colisión

    obstacles.forEach(obstacle => {
        const dinoBottom = dinosaurY + 150 + margin; // Ajustar la altura del dinosaurio con el margen
        const dinoRight = dinosaurX + 100; // Ancho del dinosaurio con el margen
        const dinoLeft = dinosaurX - margin; // Ajustar la izquierda del dinosaurio con el margen
        const obstacleBottom = obstacle.y + obstacle.height;
        const obstacleRight = obstacle.x + obstacle.width;
        const obstacleLeft = obstacle.x;

        // Detectar si hay colisión con el margen extra
        if (dinoRight > obstacleLeft && dinoLeft < obstacleRight && dinoBottom > obstacle.y) {
            // Si hay colisión, reiniciar juego o restar vida
            //gameStarted = false;
            clearInterval(scoreInterval);
            speed = 0;
            
            gameover = true; // Cambiar el estado del juego a "game over"
            //
            if (gameoverAudio.paused) {
                gameoverAudio.currentTime = 0; // Reinicia el audio
                gameoverAudio.play().catch(e => console.log('No se pudo reproducir:', e));
            }
            
        }
    });
}



function updateAndDrawClouds() {
    // Generar nueva nube si no hay muchas o la última está muy atrás
    if (clouds.length === 0 || (canvas.width - clouds[clouds.length - 1].x) > 300) {
        const cloudY = Math.random() * 200 + 20; // Altura aleatoria entre 20 y 220
        const cloudSize = Math.random() * 30 + 20; // Tamaño entre 20 y 50
        clouds.push({ x: canvas.width, y: cloudY, size: cloudSize });
    }

    // Dibujar y mover las nubes
    clouds.forEach((cloud, index) => {
        
        cloud.x -= (speed * deltaTime) * 0.2; // Nubes se mueven más lento que obstáculos para efecto de profundidad
        //cloud.x -= (speed * deltaTime); // Nubes se mueven más lento que obstáculos para efecto de profundidad

        if (cloud.x + cloud.size * 2 < 0) {
            clouds.splice(index, 1); // Eliminar nubes que salieron de pantalla
        }

        drawCloud(cloud.x, cloud.y, cloud.size);
    });
}

// Función para dibujar una nube 3D compuesta de varios círculos
function drawCloud(x, y, size) {
    ctx.save(); // Guardar el estado actual del contexto
    // Crear un gradiente para simular profundidad en la nube
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 20 * 1.5);
    gradient.addColorStop(0, 'white'); // Centro de la nube (más brillante)
    gradient.addColorStop(1, 'lightgray'); // Bordes de la nube (más oscuros)

    // Establecer el color de relleno con el gradiente
    ctx.fillStyle = gradient;

    // Agregar una sombra para dar un efecto de profundidad
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 5;

    // Dibuja varios círculos para la nube con desplazamientos y tamaños variados
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2); // Círculo central
    ctx.arc(x + size * 0.8, y - size * 0.4, size * 0.9, 0, Math.PI * 2); // Círculo superior derecho
    ctx.arc(x + size * 1.6, y, size, 0, Math.PI * 2); // Círculo derecho
    ctx.arc(x + size * 0.4, y + size * 0.6, size * 0.8, 0, Math.PI * 2); // Círculo inferior izquierdo
    ctx.arc(x + size * 1.2, y + size * 0.6, size * 0.8, 0, Math.PI * 2); // Círculo inferior derecho
    ctx.fill();

    ctx.restore(); // Restaurar el contexto para evitar que afecte a otros dibujos
}



let mountainGroupId = 0;
let lastMountainGroupEndX = 0;
let nextGroupSpacing = 200 + Math.random() * 1500;

function updateAndDrawMountains() {
    const distanceToLastGroup = lastMountainGroupEndX - canvas.width;

    // Solo intentar generar un nuevo grupo si hay espacio, pero con variación
    if (mountains.length === 0 || distanceToLastGroup < -nextGroupSpacing) {
        const groupSize = Math.floor(Math.random() * 4) + 1;
        let startX = canvas.width + Math.random() * 100;

        const layers = Array.from({ length: groupSize }, (_, i) => i);
        layers.sort(() => Math.random() - 0.5); // Orden aleatorio

        let maxX = 0;

        for (let i = 0; i < groupSize; i++) {
            const height = Math.random() * 100 + 100;
            const width = Math.random() * 100 + 150;

            const mountain = {
                x: startX,
                width,
                height,
                layer: mountainGroupId + layers[i] / 10
            };

            mountains.push(mountain);
            startX += width * 0.6;
            maxX = Math.max(maxX, mountain.x + mountain.width);
        }

        lastMountainGroupEndX = maxX;
        
        nextGroupSpacing = 200 + Math.random() * 1500;
        mountainGroupId++;
    }

    mountains.sort((a, b) => a.layer - b.layer);

    for (let i = 0; i < mountains.length; i++) {
        const mountain = mountains[i];
        mountain.x -= (speed * deltaTime) * 0.1;

        ctx.save();

        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 30);
        gradient.addColorStop(0, 'white');
        gradient.addColorStop(1, '#888');
        ctx.fillStyle = gradient;

        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;

        ctx.beginPath();
        ctx.moveTo(mountain.x, groundY);
        ctx.lineTo(mountain.x + mountain.width / 2, groundY - mountain.height);
        ctx.lineTo(mountain.x + mountain.width, groundY);
        ctx.closePath();
        ctx.fill();

        ctx.restore();

        if (mountain.x + mountain.width < 0) {
            mountains.splice(i, 1);
            i--;
        }
    }

    // Recalcular la posición del final del grupo más lejano visible
    if (mountains.length > 0) {
        lastMountainGroupEndX = Math.max(...mountains.map(m => m.x + m.width));
    } else {
        lastMountainGroupEndX = 0;
    }
}



// Variable para controlar si el juego está en marcha
let gameStarted = false;
let deltaTime = 0; // Tiempo entre frames (60 FPS)
let lastTime = performance.now();

// Función principal de animación
function gameLoop(timestamp) {
    //if (!gameStarted) return; // No iniciar el bucle si el juego no ha comenzado
    deltaTime = (timestamp - lastTime) / 1000; // en segundos
    lastTime = timestamp;

    ctx.clearRect(0, 0, canvas.width, canvas.height); // Limpiar el canvas

    if(!gameover && gameStarted) {
        jump(); // Hacer saltar al dinosaurio y aplicar gravedad
    }
    
    updateAndDrawMeteorites();
    updateAndDrawClouds();
    
    updateAndDrawMountains();
    if(!gameover && gameStarted) {
        generateObstacles(); // Generar y mover obstáculos
    }
    drawDinosaur(); // Dibujar el dinosaurio
    drawGround(); // Dibujar el suelo

    if(!gameover && gameStarted) {    
        detectCollisions(); // Detectar colisiones
    }

    
    const aspectRatio = logo.width / logo.height; // Calcular la relación de aspecto del logo
    const logoHeight = 100; // Alto deseado del logo
    const logoWidth = logoHeight * aspectRatio; // Ajustar el ancho según la relación de aspecto
    const x = canvas.width - logoWidth - 20; // Posición X (10px de margen desde el borde derecho)
    const y = 20; // Posición Y (10px de margen desde el borde superior)
    ctx.drawImage(logo, x, y, logoWidth, logoHeight);


    if(gameStarted){
        ctx.fillStyle = 'black';
        ctx.font = '30px Arial';
        ctx.textBaseline = 'middle'; // Alinear el texto verticalmente al centro
        ctx.fillText("Puntos: " + score, 100, 50);
    }

    if(gameover) {  
        ctx.fillStyle = 'red';
        ctx.font = '50px Arial';
        ctx.textAlign = 'center'; // Alinear el texto horizontalmente al centro
        ctx.textBaseline = 'middle'; // Alinear el texto verticalmente al centro

        const text = "¡Te chocaste con un obstáculo! Presionar espacio o tocar para reiniciar. (ver: "+ver+")";
        const maxWidth = canvas.width * 0.8; // Máximo ancho permitido para el texto
        const lineHeight = 60; // Altura de cada línea

        const words = text.split(' ');
        let line = '';
        let y = canvas.height / 2 - lineHeight / 2; // Centrar verticalmente considerando dos líneas

        words.forEach((word, index) => {
            const testLine = line + word + ' ';
            const testWidth = ctx.measureText(testLine).width;

            if (testWidth > maxWidth && index > 0) {
            ctx.fillText(line, canvas.width / 2, y);
            line = word + ' ';
            y += lineHeight; // Mover a la siguiente línea
            } else {
            line = testLine;
            }
        });

        ctx.fillText(line, canvas.width / 2, y); // Dibujar la última línea
        //
        setTimeout(() => {
            window.addEventListener('keydown', handleKeydown);
        }, 1000);
    }

    if(!gameStarted && !gameover){
        ctx.fillStyle = 'black';
        ctx.font = '50px Arial';
        ctx.textAlign = 'center'; // Alinear el texto horizontalmente al centro
        ctx.textBaseline = 'middle'; // Alinear el texto verticalmente al centro

        const text = "Presiona espacio o toca para empezar. (ver: "+ver+")";
        const maxWidth = canvas.width * 0.8; // Máximo ancho permitido para el texto
        const lineHeight = 60; // Altura de cada línea

        const words = text.split(' ');
        let line = '';
        let y = canvas.height / 2 - lineHeight / 2; // Centrar verticalmente considerando dos líneas

        words.forEach((word, index) => {
            const testLine = line + word + ' ';
            const testWidth = ctx.measureText(testLine).width;

            if (testWidth > maxWidth && index > 0) {
                ctx.fillText(line, canvas.width / 2, y);
                line = word + ' ';
                y += lineHeight; // Mover a la siguiente línea
            } else {
                line = testLine;
            }
        });

        ctx.fillText(line, canvas.width / 2, y); // Dibujar la última línea
    }


    requestAnimationFrame(gameLoop); // Mantener el ciclo de animación
    
}



// Función para iniciar el juego con la tecla 'Space' o el toque en la pantalla táctil
function handleStart() {
    if (gameover) {
        window.location.reload(); // Reiniciar juego si terminó
    } else if (!gameStarted) {
        //
        // Función para manejar la entrada de teclado
        window.addEventListener('keydown', (e) => {
            keys[e.code] = true;
        });
        window.addEventListener('keyup', (e) => {
            keys[e.code] = false;
        });
        //
        // Detectar el toque en la pantalla para iniciar el juego
        window.addEventListener('touchstart', (e) => {
            e.preventDefault();  // Evita el zoom y desplazamiento del navegador
            //
            // Simular la tecla 'Space' para que funcione el salto
            keys['Space'] = true;
        }, { passive: false });  // Evitar el comportamiento predeterminado

        // Detectar el toque final para asegurarse de que el evento "espacio" no se quede presionado
        window.addEventListener('touchend', (e) => {
            e.preventDefault();  // Evitar desplazamiento
            keys['Space'] = false;  // Resetear si hay algo que necesite este estado
        }, { passive: false });  // Evitar el comportamiento predeterminado
        //
        gameStarted = true;
        //gameLoop(); // Iniciar el bucle del juego

        // Iniciar contador de puntos
        scoreInterval = setInterval(() => {
            score += 1;
            speed += 0.10; // Aumentar la velocidad del juego gradualmente
        }, 100); // Aumenta 10 puntos cada 100ms
    }
}

// Detectar la pulsación de la tecla 'Space' para iniciar el juego
function handleKeydown(e) {
    if (e.code === 'Space') {
        handleStart();
        window.removeEventListener('keydown', handleKeydown); // Eliminar el event listener
    }
}

window.addEventListener('keydown', handleKeydown);

// Detectar el toque en la pantalla para iniciar el juego
window.addEventListener('touchstart', (e) => {
    e.preventDefault();  // Evita el zoom y desplazamiento del navegador
    handleStart();  // Iniciar el juego con el toque
    
}, { passive: false });  // Evitar el comportamiento predeterminado

window.addEventListener('load', () => {
    
    

    //gameLoop(); // Iniciar el bucle del juego
    requestAnimationFrame(gameLoop); // Mantener el ciclo de animación
    
});
