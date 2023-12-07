
import { vec3, mat4 } from './Math/gl-matrix-module.js';

import Renderer, { InstancedBatch, RenderData } from './RenderEngine/Renderer.js';
import Input from './Input.js';
import Camera from './RenderEngine/Camera.js';
import { loadImageRGBA, loadTexture, loadMesh } from './AssetLoader.js';
import Arena from './Arena.js';
import Player from './Player.js';
import { Particle } from './RenderEngine/ParticleSystem.js';

if (!navigator.gpu) throw new Error("WebGPU not supported on this browser.");
const adapter = await navigator.gpu.requestAdapter();
if (!adapter) throw new Error("No appropriate GPUAdapter found.");

const device = await adapter.requestDevice();
const canvas = document.querySelector('canvas');
const context = canvas.getContext("webgpu");

canvas.width  = window.innerWidth;
canvas.height = window.innerHeight;

var renderer = new Renderer(device, canvas, context);
var particleSystem;
var fontGenerator;
var resourceCache;

var input = new Input(canvas);
var cam = new Camera(canvas, input);
var renderData = new RenderData();
var player1Batch = new InstancedBatch();
let player2Batch = new InstancedBatch()
var crystalBatch = new InstancedBatch();
var batches = [];

let crystalPositions = [
    [-1, 1, 3],
    [-1, 1, 8],
    [5, 1, 16],
    [13, 1, 16],
    [18, 1, 3],
    [18, 1, 8],
];

let particleFrameCount = 0;

const arena = new Arena();

const player1 = new Player()
const player2 = new Player()

let powerUps = []

const powerUpParticles = {
    speed: [2 / 8, 0 / 8, 3 / 8, 1 / 8],
    radius: [3 / 8, 0 / 8, 4 / 8, 1 / 8],
    bomb: [1 / 8, 0 / 8, 2 / 8, 1 / 8]
}

let dummyText;
let player1HUD
let player2HUD

function addPowerup(type, position, particleSystem) {
    const particle = new Particle()
    particle.position = position
    particle.lifetime = 9999999
    particle.texCoord = powerUpParticles[type]

    console.log(particle)
    powerUps.push({
        type: type,
        position: position,
        particle: particle
    })

    particleSystem.emit(0, particle)
}

function getRandomEmptyPosition() {
    const emptyPositions = []
    for(let y = 0; y < arena.arenaForegroundData.length; y++) {
        for(let x = 0; x < arena.arenaForegroundData[y].length; x++) {
            if(arena.arenaForegroundData[y][x] === " ") {
                emptyPositions.push([x + 0.5, 0.5, y + 0.5])
            }
        }
    }

    if(emptyPositions.length < 1) {
        return false
    }
    const randomIndex = Math.floor(Math.random() * emptyPositions.length)

    return emptyPositions[randomIndex]
}

let timeForNewPowerup = 0

function addRandomPowerup(time, timeout) {
    const types = ['speed', 'radius', 'bomb']
    const randomType = types[Math.floor(Math.random() * types.length)]
    const randomPosition = getRandomEmptyPosition()

    timeForNewPowerup = time + timeout

    if(!randomPosition) {
        return
    }
    
    addPowerup(randomType, randomPosition, particleSystem)
    
}

function checkPowerups() {
    const newPowerUps = []
    let dirty = false
    powerUps.forEach((powerUp) => {
        if(checkPlayerExploded(powerUp.position, player1.position)) {
            dirty = true
            powerUp.particle.lifetime = 0
            player1.addPowerup(powerUp.type)
            playSound("powerup")
        } else if (checkPlayerExploded(powerUp.position, player2.position)) {
            dirty = true
            powerUp.particle.lifetime = 0
            player2.addPowerup(powerUp.type)
            playSound("powerup")
        } else {
            newPowerUps.push(powerUp)
        }
    })
    if(dirty) {
        powerUps = newPowerUps
    }
}

export async function Init()
{
    resourceCache = renderer.resourceCache;
    fontGenerator = renderer.fontGenerator;
    particleSystem = renderer.particleSystem;

    await renderer.Initialize();
    
    await arena.Initialize(resourceCache);

    player1.position = [1.5, 0, 1.5]
    player1.startPosition = [1.5, 0, 1.5]
    player2.position = [arena.arenaForegroundData[0].length - 1.5, 0, arena.arenaForegroundData.length -1.5]
    player2.startPosition = [arena.arenaForegroundData[0].length - 1.5, 0, arena.arenaForegroundData.length -1.5]

    dummyText = new Text();
    dummyText.string = "Omegalul";
    dummyText.position = [20, canvas.height];
    dummyText.color = [1, 1, 1];
    dummyText.scale = 400;
    fontGenerator.addText(dummyText);

    player1HUD = new Text()
    player1HUD.string = ""
    player1HUD.position = [20, 100]
    player1HUD.color = [1, 1, 1]
    player1HUD.scale = 300
    fontGenerator.addText(player1HUD)

    player2HUD = new Text()
    player2HUD.string = ""
    player2HUD.position = [canvas.width - 500, 100]
    player2HUD.color = [1, 1, 1]
    player2HUD.scale = 300
    fontGenerator.addText(player2HUD)
    
    let crystal = resourceCache.addMesh(await loadMesh('/res/meshes/crystal.obj'));
    let crystalTexture = resourceCache.addMaterial(await loadImageRGBA('/res/textures/CrystalShort/albedo.jpeg'), await loadImageRGBA('/res/textures/CrystalShort/normal.png'));

    crystalBatch.setMesh(crystal);
    crystalBatch.setTexture(crystalTexture);
    for(let i = 0; i < crystalPositions.length; i++)
    {
        crystalBatch.addInstance([0, 0, 0]);
    }
    batches.push(crystalBatch);

    //crystal2Batch.setMesh(crystal2);
    //crystal2Batch.setTexture(crystal2Texture);
    //crystal2Batch.addInstance([18, 2, 10]);
    //batches.push(crystal2Batch);

    for (const [key, value] of Object.entries(arena.batches)) 
    {
        batches.push(value);
    }

    // Initialize player meshes, textures and positions
    let crewmate = resourceCache.addMesh(await loadMesh('res/meshes/crewmate.obj'));
    let redCrewmate = resourceCache.addMaterial(await loadImageRGBA('/res/textures/Crewmate/albedo1.png'), await loadImageRGBA('/res/textures/Crewmate/normal.png'));
    let blueCrewmate = resourceCache.addMaterial(await loadImageRGBA('/res/textures/Crewmate/albedo2.png'), await loadImageRGBA('/res/textures/Crewmate/normal.png'));

    player1Batch.setMesh(crewmate);
    player1Batch.setTexture(redCrewmate)
    player1Batch.addInstance([0, 0, 0]);

    player2Batch.setMesh(crewmate);
    player2Batch.setTexture(blueCrewmate)
    player2Batch.addInstance([0, 0, 0]);

    batches.push(player1Batch);
    batches.push(player2Batch)
}

function placeBomb(player, time) {
    const coords = [Math.floor(player.position[0]), Math.floor(player.position[2])]
    if(player.inventory.bombs < 1 || arena.getTile(coords[0], coords[1]) !== ' ') {
        return
    }
    player.inventory.bombs--
    player.inventory.lastPlaced = [coords[0], coords[1]];
    bombs.push({
        coords: coords, 
        radius: player.getBombRadius(),
        time: time + player.getDetonationTime(),
        playerInventory: player.inventory
    })
    arena.setTile(coords[0], coords[1], 'B')
    arena.updateArena()
}

function checkBombs(time) {
    const remainingBombs = [];
    let dirty = false
    bombs.forEach((bomb) => {
        if (bomb.time < time) {
            dirty = true
            explodeBomb(bomb.coords, bomb.radius, time);
            arena.setTile(bomb.coords[0], bomb.coords[1], ' ')
            bomb.playerInventory.bombs++
        } else {
            remainingBombs.push(bomb);
        }
    });
    if(dirty) {
        bombs = remainingBombs;
        arena.updateArena()
    }
}

async function explodeBomb(coords, radius, time) {
    
    let [x, y] = coords;

    let directions = [
        [ 0,-1],
        [ 0, 1],
        [-1, 0],
        [ 1, 0]
    ];

    arena.setTile(x, y, ' ')

    explosionEffect([x + 0.5, 0.5, y + 0.5], time)

    playSound("explosion")

    let player1Died = false
    let player2Died = false

    let playersDied = checkPlayerDeaths(x, y)
    if(playersDied % 2  === 1) {
        player1Died = true
    }
    if(playersDied >= 2) {
        player2Died = true
    }
    executePlayerDeaths(player1Died, player2Died)

    
    for (let i = 1; i <= radius; i++) {
        let newDirections = []
        for (let [dx, dy] of directions) {
            
            let newX = x + dx * i;
            let newY = y + dy * i;

            if (newX < 0 || newX >= arena.arenaForegroundData[newY].length ||
                newY < 0 || newY >= arena.arenaForegroundData.length) {
                break
            }

            let t = arena.getTile(newX, newY);
            let destructible = arena.isDestructible(newX, newY);

            if (destructible) {
                arena.setTile(newX, newY, ' ');
                explosionEffect([newX + 0.5, 0.5, newY + 0.5], time)
            }
            else if (t === ' ') {
                playersDied = checkPlayerDeaths(newX, newY)
                if(playersDied % 2  === 1) {
                    if(!player1Died) {
                        player1Died = true
                        executePlayerDeaths(true, false)
                    }
                }
                if(playersDied >= 2) {
                    if(!player2Died) {
                        player2Died = true
                        executePlayerDeaths(false, true)

                    }
                }


                explosionEffect([newX + 0.5, 0.5, newY + 0.5], time)

                newDirections.push([dx, dy])
            }
        }
        directions = newDirections
        await delay(100)
    }

    arena.updateArena();
}

function delay(timeout) {
    return new Promise(resolve => setTimeout(resolve, timeout));
}


function checkPlayerDeaths(x, y) {
    let result = 0
    if(checkPlayerExploded([x + 0.5, 0, y + 0.5], player1.position)) {
        result += 1
    }
    
    if(checkPlayerExploded([x + 0.5, 0, y + 0.5], player2.position)) {
        result += 2
    }

    return result
}

function executePlayerDeaths(player1Died, player2Died) {
    if(player1Died) {
        player2.score++
        player1.kill()
    }
    if(player2Died) {
        player1.score++
        player2.kill()
    }
    if(player1.lives < 1 || player2.lives < 1) {
        const winner = player1.lives > player2.lives ? "Player 1 wins" : (player1.lives === player2.lives ? "Draw" : "Player 2 Wins")
        alert(winner)
        window.location.reload()
    }

}

function checkPlayerExploded(bombPos, playerPos) {
    if(Math.abs(bombPos[0] - playerPos[0]) < 0.5 && Math.abs(bombPos[2] - playerPos[2]) < 0.5) {
        return true
    }
    return false
}

function playSound(sound) {
    let explosionSound = new Audio('/res/audio/' + sound + '.mp3')
    explosionSound.play()

    explosionSound.onended = function() {
        explosionSound.src = ''
        explosionSound = null
    };
}


let lastTime = performance.now() / 1000;

let bombs = []

function HSVtoRGB(h, s, v) {
    var r, g, b, i, f, p, q, t;
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return [r, g, b]
}

let keyEDown = false
let keyEnterDown = false

let paused = false

export function pause() {
    paused = true
}

export function unpause() {
    lastTime = performance.now() / 1000
    paused = false
    requestAnimationFrame(RenderFrame);
}

export function RenderFrame()
{
    //canvas.width  = window.innerWidth;
    //canvas.height = window.innerHeight;

    let time = performance.now() / 1000;
    let dt = time - lastTime;
    lastTime = time;

    checkPowerups()
    if(time > timeForNewPowerup && powerUps.length < 5) {
        addRandomPowerup(time, 5)
    }

    let velocity1 = [0, 0, 0];

    if (input.keys['KeyD']) { velocity1[0] += 1; }
    if (input.keys['KeyA']) { velocity1[0] -= 1; }
    if (input.keys['KeyW']) { velocity1[2] += 1; }
    if (input.keys['KeyS']) { velocity1[2] -= 1; }
    
    let angle1 = Math.atan2(-velocity1[2], velocity1[0]) * 180 / Math.PI - 90;
    if (velocity1[0] != 0 || velocity1[2] != 0)
    {
        angle1 = (angle1 + 180) % 360 - 180;

        let deltaAngle = ((angle1 - player1.angle + 540) % 360) - 180;
        player1.angle += deltaAngle * 0.1;
    }


    vec3.normalize(velocity1, velocity1);
    vec3.scale(velocity1, velocity1, player1.getSpeed() * dt);
    
    arena.collideCircle(player1.position, velocity1, 0.4, player1.inventory.lastPlaced);

    if(Math.floor(player1.position[0]) != player1.inventory.lastPlaced[0] || Math.floor(player1.position[2]) != player1.inventory.lastPlaced[1])
        player1.inventory.lastPlaced = [-1, -1];

    let velocity2 = [0, 0, 0];
    if (input.keys['ArrowRight']) { velocity2[0] += 1; }
    if (input.keys['ArrowLeft']) { velocity2[0] -= 1; }
    if (input.keys['ArrowUp']) { velocity2[2] += 1; }
    if (input.keys['ArrowDown']) { velocity2[2] -= 1; }

    
    let angle2 = Math.atan2(-velocity2[2], velocity2[0]) * 180 / Math.PI - 90;
    if (velocity2[0] != 0 || velocity2[2] != 0)
    {
        angle2 = (angle2 + 180) % 360 - 180;

        let deltaAngle = ((angle2 - player2.angle + 540) % 360) - 180;
        player2.angle += deltaAngle * 0.1;
    }
    vec3.normalize(velocity2, velocity2);
    vec3.scale(velocity2, velocity2, player2.getSpeed() * dt);
    
    arena.collideCircle(player2.position, velocity2, 0.4, player2.inventory.lastPlaced);
    if(Math.floor(player2.position[0]) != player2.inventory.lastPlaced[0] || Math.floor(player2.position[2]) != player2.inventory.lastPlaced[1])
        player2.inventory.lastPlaced = [-1, -1];

    dummyText.string = "Current time: " + time.toFixed(2);
    dummyText.color = HSVtoRGB(time * 0.1, 1.0, 1.0);

    player1HUD.string = "Bombs: " + player1.getBombs() + " Score: " + player1.score + " Lives: " + player1.lives
    player2HUD.string = "Bombs: " + player2.getBombs() + " Score: " + player2.score + " Lives: " + player2.lives


    particleFrameCount++;
    if(particleFrameCount >= 8)
    {
        let fire = new Particle();
        fire.position = [Math.random() * 17, 0, Math.random() * 13];
        fire.velocity = [Math.random() * 0.3, Math.random() * 1.0, Math.random() * 0.3];
        fire.colorStart = [Math.random(), Math.random(), Math.random()];
        fire.colorEnd = [Math.random(), Math.random(), Math.random()];
        fire.radiusStart = Math.random() * 0.6 + 0.1;
        fire.radiusEnd = 0.0;
        fire.rotationStart = Math.random() * 6.283;
        fire.rotationEnd = Math.random() * 6.283;
        fire.texCoord = [2 / 4, 5 / 8, 3 / 4, 7 / 8];
        fire.lifetime = Math.random() * 2.6 + 0.3;
        particleSystem.emit(time, fire);
        particleFrameCount = 0;
    }

    // If the key E is pressed down
    if (input.keys['KeyE'] && !keyEDown) 
    {
        keyEDown = true
        placeBomb(player1, time);
    } else if (!input.keys['KeyE']) {
        keyEDown = false
    }

     // If the key Enter is pressed down
    if (input.keys['Enter'] && !keyEnterDown) 
    {
        keyEnterDown = true
        placeBomb(player2, time);
    } else if (!input.keys['Enter']) {
        keyEnterDown = false
    }

    checkBombs(time)
    //player1Batch.reset();
    //player1Batch.addInstance([cam.position[0], 1, 1]);
    player1Batch.updateInstance(0, player1.position, [0, player1.angle, 0]);
    player2Batch.updateInstance(0, player2.position, [0, player2.angle, 0]);

    // Camera in the average position between the two players
    // Offset scaled by their distance
    const averagePosition = player1.position.map((value, index) => (value + player2.position[index]) / 2)
    let distanceOfPositions = 0;
    for (let i = 0; i < 3; i++) {
        distanceOfPositions += (player1.position[i] - player2.position[i]) ** 2;
    }
    distanceOfPositions = Math.sqrt(distanceOfPositions)

    cam.updatePosition(averagePosition, distanceOfPositions)
    cam.update(dt);

    //console.log(averagePosition, distanceOfPositions);

    for(let i = 0; i < crystalPositions.length; i++)
    {
        let pos = crystalPositions[i];
        pos[1] = Math.sin(pos[0] - pos[2] + time);
        crystalBatch.updateInstance(i, pos, [0, time * 20, 0]);
    }

    renderData.reset();
    renderData.pushMatrix(cam.viewMatrix);
    renderData.pushMatrix(cam.projectionMatrix);
    renderData.pushMatrix(cam.invViewMatrix);
    renderData.pushMatrix(cam.invProjectionMatrix);
    let lightPos = [averagePosition[0] + 2, 10, averagePosition[2] + Math.sin(time) * 2];
    let lightCenter = averagePosition;
    let lightDirection = [lightCenter[0] - lightPos[0], lightCenter[1] - lightPos[1], lightCenter[2] - lightPos[2]];
    let halfDist = distanceOfPositions * 0.5 + 8;
    let ortho = mat4.ortho(mat4.create(), -halfDist, halfDist, -halfDist, halfDist, -40, 40);

    ortho[5] *= -1;
    renderData.pushMatrix(mat4.multiply(mat4.create(), ortho, mat4.lookAt(mat4.create(), lightPos, lightCenter, [0, -1, 0])));
    renderData.pushVec4(lightDirection);
    let uiMatrix = mat4.ortho(mat4.create(), 0, canvas.width, 0, canvas.height, -10, 10);
    renderData.pushMatrix(uiMatrix);
    let timeData = [time, 0, 0, 0];
    renderData.pushVec4(timeData);

    renderData.instanceBatches = batches;

    particleSystem.update(time, dt, cam.position);
    fontGenerator.update();
    renderer.Render(renderData);

    if(!paused) {
        requestAnimationFrame(RenderFrame);
    }
}

function explosionEffect(position, time) {
    
        // Debree
        for(let i = 0; i < 5; i++)
        {
            let particle = new Particle();
            particle.position = [position[0], position[1], position[2]];
            particle.velocity = [(Math.random() - 0.5) * 4.0, (Math.random() - 0.5) * 2.0 + 4, (Math.random() - 0.5) * 4.0];
            particle.colorStart = [0.72, 0.651, 0.271];
            particle.colorEnd = [0.659, 0.565, 0.031];
            particle.radiusStart = Math.random() * 0.3 + 0.1;
            particle.radiusEnd = 0.0;
            particle.rotationStart = Math.random() * 6.283;
            particle.rotationEnd = Math.random() * 6.283;
            particle.gravityStrength = 1.0;
            let xPar = Math.floor(Math.random() * 2);
            let yPar = Math.floor(Math.random() * 3);
            particle.texCoord = [(14 + xPar) / 16, (11 + yPar) / 16, (15 + xPar) / 16, (12 + yPar) / 16];
            particle.lifetime = Math.random() * 1.5 + 0.5;
            particleSystem.emit(time, particle);
        }
        // Dust
        for(let i = 0; i < 2; i++)
        {
            let particle = new Particle();
            particle.position = [position[0], position[1], position[2]];
            particle.velocity = [(Math.random() - 0.5) * 2.0, (Math.random() - 0.5) * 2.0, (Math.random() - 0.5) * 2.0];
            particle.colorStart = [1, 0.631, 0];
            particle.colorEnd = [1, 0.631, 0];
            particle.radiusStart = 0.5;
            particle.radiusEnd = 2.0;
            particle.rotationStart = Math.random();
            particle.rotationEnd = Math.random();
            particle.gravityStrength = 0.0;
            let xPar = Math.floor(Math.random() * 4);
            particle.texCoord = [xPar / 8, 7 / 8, (xPar + 1) / 8, 8 / 8];
            particle.lifetime = Math.random() * 0.5 + 0.8;
            particleSystem.emit(time, particle);
        }
        // Explosion
        for(let i = 0; i < 2; i++)
        {
            let particle = new Particle();
            particle.position = [position[0], position[1], position[2]];
            particle.velocity = [0, 0, 0];
            particle.colorStart = [1, 1, 0];
            particle.colorEnd = [1, 0, 0];
            particle.radiusStart = 1.0;
            particle.radiusEnd = 2.0;
            particle.rotationStart = Math.random();
            particle.rotationEnd = Math.random();
            particle.gravityStrength = 0.2;
            let xPar = Math.floor(Math.random() * 4);
            particle.texCoord = [(xPar + 4) / 8, 7 / 8, (xPar + 5) / 8, 8 / 8];
            particle.lifetime = Math.random() * 0.3 + 0.1;
            particleSystem.emit(time, particle);
        }
        // Halo
        let particle = new Particle();
        particle.position = [position[0], position[1], position[2]];
        particle.velocity = [0.0, 1.0, 0.0];
        particle.radiusStart = 0.1;
        particle.radiusEnd = 2.0;
        particle.gravityStrength = 0.0;
        particle.colorStart = [1, 0.631, 0];
        particle.colorEnd = [1, 0.631, 0];
        particle.rotationStart = Math.random() * 6.283;
        particle.rotationEnd = particle.rotationStart;
        particle.texCoord = [6 / 8, 6 / 8, 7 / 8, 7 / 8];
        particle.lifetime = 0.15;
        particleSystem.emit(time, particle);

}