
import { vec3, mat4 } from './Math/gl-matrix-module.js';

import Renderer, { InstancedBatch, RenderData } from './RenderEngine/Renderer.js';
import Input from './Input.js';
import Camera from './RenderEngine/Camera.js';
import { loadImageRGBA, loadTexture, loadMesh } from './AssetLoader.js';
import Arena from './Arena.js';
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
var arenaEnvironmentBatch = new InstancedBatch();
var batches = [];


let glowEffect1 = new Particle();
let glowEffect2 = new Particle();

let powerUpEffect = new Particle();

const arena = new Arena();

let player1Pos = [1.5, 0, 1.5]
let player2Pos = [arena.arenaForegroundData.length - 1.5, 0, arena.arenaForegroundData[0].length -1.5]
let lastAngle1 = 0
let lastAngle2 = 0

let dummyText;

export async function Init()
{
    resourceCache = renderer.resourceCache;
    fontGenerator = renderer.fontGenerator;
    particleSystem = renderer.particleSystem;

    await renderer.Initialize();
    
    await arena.Initialize(resourceCache);

    dummyText = new Text();
    dummyText.string = "Omegalul";
    dummyText.position = [20, canvas.height];
    dummyText.color = [1, 1, 1];
    dummyText.scale = 400;
    fontGenerator.addText(dummyText);
    
    let environment = resourceCache.addMesh(await loadMesh('/res/meshes/environment.obj'));

    arenaEnvironmentBatch.setMesh(environment);
    arenaEnvironmentBatch.addInstance([0, 0, 0]);
    
    batches.push(arenaEnvironmentBatch);
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


    powerUpEffect.position = [2, 2, 2];
    powerUpEffect.lifetime = 99999999;
    powerUpEffect.texCoord = [0 / 8, 0 / 8, 1 / 8, 1 / 8];
    particleSystem.emit(0, powerUpEffect);

    /*glowEffect1.lifetime = 99999999;
    glowEffect1.texCoord = [0 / 8, 1 / 8, 4 / 8, 5 / 8];
    glowEffect2.lifetime = 99999999;
    glowEffect2.texCoord = [0 / 8, 1 / 8, 4 / 8, 5 / 8];
    particleSystem.emit(0, glowEffect1);
    particleSystem.emit(0, glowEffect2);*/
}


let gameLoop = setInterval(() => {
    if(true) {
        //updateArena()
        //arenaChanged = false
    }
}, 50)

function explodeBomb(coords, radius, time) {
    
    let [x, y] = coords;

    const directions = [
        [ 0,-1],
        [ 0, 1],
        [-1, 0],
        [ 1, 0]
    ];

    let dirty = false;
    for (let [dx, dy] of directions) {
        for (let i = 1; i <= radius; i++) {
            let newX = x + dx * i;
            let newY = y + dy * i;

            if (newX < 0 || newX >= arena.arenaForegroundData.length ||
                newY < 0 || newY >= arena.arenaForegroundData[newX].length) {
                break
            }

            let t = arena.getTile(newX, newY);

            if (t === 'T') {
                arena.setTile(newX, newY, ' ');
                dirty = true;
                explosionEffect([newX + 0.5, 0.5, newY + 0.5], time)
                break
            }
            else if (t === ' ') {
                explosionEffect([newX + 0.5, 0.5, newY + 0.5], time)

                continue
            }
            break
        }
    }

    if(dirty)
    {
        arena.updateArena();
    }
}


let lastTime = performance.now() / 1000;
let hasBomb1Exploded = false
let hasBomb2Exploded = false

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

export function RenderFrame()
{
    //canvas.width  = window.innerWidth;
    //canvas.height = window.innerHeight;

    let time = performance.now() / 1000;
    let dt = time - lastTime;
    lastTime = time;

    cam.update(dt);

    let movementSpeed = 2.5;
    let velocity1 = [0, 0, 0];

    if (input.keys['KeyD']) { velocity1[0] += 1; }
    if (input.keys['KeyA']) { velocity1[0] -= 1; }
    if (input.keys['KeyW']) { velocity1[2] += 1; }
    if (input.keys['KeyS']) { velocity1[2] -= 1; }
    
    let angle1 = Math.atan2(-velocity1[2], velocity1[0]) * 180 / Math.PI - 90;
    if (velocity1[0] != 0 || velocity1[2] != 0)
    {
        angle1 = (angle1 + 180) % 360 - 180;

        let deltaAngle = ((angle1 - lastAngle1 + 540) % 360) - 180;
        lastAngle1 += deltaAngle * 0.1;
    }


    vec3.normalize(velocity1, velocity1);
    vec3.scale(velocity1, velocity1, movementSpeed * dt);
    
    arena.collideCircle(player1Pos, velocity1, 0.4);

    let velocity2 = [0, 0, 0];
    if (input.keys['ArrowRight']) { velocity2[0] += 1; }
    if (input.keys['ArrowLeft']) { velocity2[0] -= 1; }
    if (input.keys['ArrowUp']) { velocity2[2] += 1; }
    if (input.keys['ArrowDown']) { velocity2[2] -= 1; }

    
    let angle2 = Math.atan2(-velocity2[2], velocity2[0]) * 180 / Math.PI - 90;
    if (velocity2[0] != 0 || velocity2[2] != 0)
    {
        angle2 = (angle2 + 180) % 360 - 180;

        let deltaAngle = ((angle2 - lastAngle2 + 540) % 360) - 180;
        lastAngle2 += deltaAngle * 0.1;
    }
    vec3.normalize(velocity2, velocity2);
    vec3.scale(velocity2, velocity2, movementSpeed * dt);
    
    arena.collideCircle(player2Pos, velocity2, 0.4);

    dummyText.string = "Current time: " + time.toFixed(2);
    dummyText.color = HSVtoRGB(time * 0.1, 1.0, 1.0);

    powerUpEffect.position = [1.5, 0.4 + Math.sin(time * 1.5) * 0.2, 5.5];
    powerUpEffect.colorStart = HSVtoRGB(time * 0.2, 1.0, 1.0);
    powerUpEffect.colorEnd = powerUpEffect.colorStart;
    powerUpEffect.radiusStart = 0.4;
    powerUpEffect.radiusEnd = powerUpEffect.radiusStart;
    /*
    glowEffect1.position = [player1Pos[0], 0.75, player1Pos[2]];
    glowEffect1.radiusStart = 1.5 + Math.sin(time) * 0.5;
    glowEffect1.radiusEnd = glowEffect1.radiusStart;
    glowEffect1.rotationStart = time * 0.4;
    glowEffect1.rotationEnd = glowEffect1.rotationStart;
    glowEffect2.position = [player1Pos[0], 0.75, player1Pos[2]];
    glowEffect2.radiusStart = glowEffect1.radiusStart;
    glowEffect2.radiusEnd = glowEffect2.radiusStart;
    glowEffect2.rotationStart = -time * 0.4;
    glowEffect2.rotationEnd = glowEffect2.rotationStart;*/
    let fire = new Particle();
    fire.position = [7.5, 0.8, 7.5];
    fire.velocity = [(Math.random() - 0.5) * 2.0, (Math.random() - 0.5) * 2.0 + 2, (Math.random() - 0.5) * 2.0];
    fire.colorStart = [0.8, 0.5, 0.2];
    fire.colorEnd = [1, 0.2, 0.2];
    fire.radiusStart = Math.random() * 0.3 + 0.1;
    fire.radiusEnd = 0.0;
    fire.rotationStart = Math.random() * 6.283;
    fire.rotationEnd = Math.random() * 6.283;
    let fireX = Math.floor(Math.random() * 4);
    fire.texCoord = [fireX / 8, 7 / 8, (fireX + 1) / 8, 8 / 8];
    fire.lifetime = Math.random() * 0.3 + 0.3;
    particleSystem.emit(time, fire);
    // If the key E is pressed down and a bomb has not yet exploded
    // temporary fix for chain bomb explosions
    if (input.keys['KeyE'] && !hasBomb1Exploded) 
    {
        hasBomb1Exploded = true
        explodeBomb([Math.floor(player1Pos[0]), Math.floor(player1Pos[2])], 5, time);
    } else if (!input.keys['KeyE']) {
        hasBomb1Exploded = false
    }

     // If the key E is pressed down and a bomb has not yet exploded
    // temporary fix for chain bomb explosions
    if (input.keys['Enter'] && !hasBomb2Exploded) 
    {
        hasBomb2Exploded = true
        explodeBomb([Math.floor(player2Pos[0]), Math.floor(player2Pos[2])], 5, time);
    } else if (!input.keys['Enter']) {
        hasBomb2Exploded = false
    }
    //player1Batch.reset();
    //player1Batch.addInstance([cam.position[0], 1, 1]);
    player1Batch.updateInstance(0, player1Pos, [0, lastAngle1, 0]);
    player2Batch.updateInstance(0, player2Pos, [0, lastAngle2, 0]);

    // Camera in the average position between the two players
    // Offset scaled by their distance
    const averagePosition = player1Pos.map((value, index) => (value + player2Pos[index]) / 2)
    let distanceOfPositions = 0;
    for (let i = 0; i < 3; i++) {
        distanceOfPositions += (player1Pos[i] - player2Pos[i]) ** 2;
    }
    distanceOfPositions = Math.sqrt(distanceOfPositions)

    cam.updatePosition(averagePosition, distanceOfPositions)
    console.log(averagePosition, distanceOfPositions);

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


    renderData.instanceBatches = batches;

    particleSystem.update(time, dt, cam.position);
    fontGenerator.update();
    renderer.Render(renderData);

    requestAnimationFrame(RenderFrame);
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