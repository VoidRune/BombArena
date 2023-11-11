
import { vec3, mat4 } from './Math/gl-matrix-module.js';

import Renderer, { InstancedBatch, RenderData } from './RenderEngine/Renderer.js';
import Input from './Input.js';
import Camera from './RenderEngine/Camera.js';
import { loadTexture, loadMesh } from './AssetLoader.js';
import Arena from './Arena.js';
import { Particle } from './RenderEngine/ParticleSystem.js';

if (!navigator.gpu) throw new Error("WebGPU not supported on this browser.");
const adapter = await navigator.gpu.requestAdapter();
if (!adapter) throw new Error("No appropriate GPUAdapter found.");

const device = await adapter.requestDevice();
const canvas = document.querySelector('canvas');
const context = canvas.getContext("webgpu");

//canvas.width  = window.innerWidth;
//canvas.height = window.innerHeight;

var renderer = new Renderer(device, canvas, context);
var particleSystem;
var input = new Input(canvas);
var cam = new Camera(canvas, input);
var renderData = new RenderData();
var playerBatch = new InstancedBatch();
var arenaEnvironmentBatch = new InstancedBatch();
var batches = [];

let playerPos = [1.5, 0, 1.5];

const arena = new Arena();

export async function Init()
{
    let resourceCache = renderer.resourceCache;
    let fontGenerator = renderer.fontGenerator;
    particleSystem = renderer.particleSystem;
    await fontGenerator.init();
    let str = await (await fetch("res/shaders/fontFragment.wgsl")).text();
    fontGenerator.addText(str, 0, 8, 0);
    
    await renderer.Initialize();

    let wall = resourceCache.addMesh(await loadMesh('/res/meshes/wall.obj'));
    let floor = resourceCache.addMesh(await loadMesh('/res/meshes/floor.obj'));
    let tombstone = resourceCache.addMesh(await loadMesh('/res/meshes/tombstone.obj'));
    let obstacle = resourceCache.addMesh(await loadMesh('/res/meshes/obstacle.obj'));
    let environment = resourceCache.addMesh(await loadMesh('/res/meshes/environment.obj'));
    let texture1 = resourceCache.addTexture(await loadTexture('/res/textures/stoneWall.png'));
    let texture2 = resourceCache.addTexture(await loadTexture('/res/textures/stoneTiles.png'));
    
    arenaEnvironmentBatch.setMesh(environment);
    arenaEnvironmentBatch.addInstance([0, 0, 0]);
    
    //batches.push(arenaWallBatch);
    //batches.push(arenaFloorBatch);
    //batches.push(arenaTombstoneBatch);
    batches.push(arenaEnvironmentBatch);
    for (const [key, value] of Object.entries(arena.batches)) 
    {
        batches.push(value);
    }

    let cylinder = resourceCache.addMesh(await loadMesh('res/meshes/cylinder.obj'));
    playerBatch.setMesh(cylinder);
    playerBatch.addInstance([0, 0, 0]);
    batches.push(playerBatch);


    let teapot = resourceCache.addMesh(await loadMesh('res/meshes/teapot.obj'));
    var batchTeapot = new InstancedBatch();
    batchTeapot.setMesh(teapot);
    batchTeapot.addInstance([-15, 10, 10]);
    batches.push(batchTeapot);
}


let gameLoop = setInterval(() => {
    if(true) {
        //updateArena()
        //arenaChanged = false
    }
}, 50)

function explodeBomb(coords, radius) {
    
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

            if (newX < 0 || newX >= arena.arenaData.length ||
                newY < 0 || newY >= arena.arenaData[newX].length) {
                break
            }

            let t = arena.getTile(newX, newY);

            if (t === '#') {
                break
            }
            else if (t === 'T') {
                arena.setTile(newX, newY, '_');
                dirty = true;
                break
            }
            else if (t === '_') {
                continue
            }
        }
    }

    if(dirty)
    {
        arena.updateArena();
    }
}


var lastTime = performance.now() / 1000;
var particleTimer = 0;
export function RenderFrame()
{
    let time = performance.now() / 1000;
    let dt = time - lastTime;
    lastTime = time;

    cam.update(dt);

    let movementSpeed = 2.5;
    let velocity = [0, 0, 0];
    if (input.keys['ArrowRight']) { velocity[0] += 1; }
    if (input.keys['ArrowLeft']) { velocity[0] -= 1; }
    if (input.keys['ArrowUp']) { velocity[2] += 1; }
    if (input.keys['ArrowDown']) { velocity[2] -= 1; }

    
    vec3.normalize(velocity, velocity);
    vec3.scale(velocity, velocity, movementSpeed * dt);
    
    arena.collideCircle(playerPos, velocity, 0.4);
    
    if (input.keys['KeyE']) 
    {
        for(let i = 0; i < 1; i++)
        {
            let particle = new Particle();
            particle.position = [playerPos[0], 4, playerPos[2]];
            particle.velocity = [(Math.random() - 0.5) * 2.0, (Math.random() - 0.5) * 2.0 + 4, (Math.random() - 0.5) * 2.0];
            particle.colorStart = [1, 0.631, 0];
            particle.colorEnd = [1, 0.631, 0];
            particle.radiusStart = Math.random() * 0.3 + 0.1;
            particle.radiusEnd = 0.0;
            particle.rotationStart = Math.random() * 6.283;
            particle.rotationEnd = Math.random() * 6.283;
            //particle.gravityStrength = 1.0;
            particle.lifetime = Math.random() * 1.5 + 0.5;
            particleSystem.emit(time, particle);
        }
        if(particleTimer <= time)
        {
            let particle = new Particle();
            particle.position = [playerPos[0], 4, playerPos[2]];
            particle.velocity = [0.0, 1.0, 0.0];
            particle.radiusStart = 3.0;
            particle.radiusEnd = 4.0;
            particle.gravityStrength = 0.0;
            particle.colorStart = [Math.random(), Math.random(), Math.random()];
            particle.colorEnd = [Math.random(), Math.random(), Math.random()];
            particle.rotationStart = Math.random() * 6.283;
            particle.rotationEnd = particle.rotationStart;
            particle.lifetime = 0.5;
            particleSystem.emit(time, particle);
            particleTimer = time + 1;
        }

        //arena.setTile(Math.floor(playerPos[0]), Math.floor(playerPos[2]), '#');
        //arena.updateArena(); 

        explodeBomb([Math.floor(playerPos[0]), Math.floor(playerPos[2])], 5);
    }
    //playerBatch.reset();
    //playerBatch.addInstance([cam.position[0], 1, 1]);
    playerBatch.updateInstance(0, playerPos);

    renderData.reset();
    renderData.pushMatrix(cam.viewMatrix);
    renderData.pushMatrix(cam.projectionMatrix);
    renderData.pushMatrix(cam.invViewMatrix);
    renderData.pushMatrix(cam.invProjectionMatrix);
    let lightPos = [10, 10, 10];
    let ortho = mat4.ortho(mat4.create(), -16, 16, -16, 16, -20, 20);
    ortho[5] *= -1;
    renderData.pushMatrix(mat4.multiply(mat4.create(), ortho, mat4.lookAt(mat4.create(), lightPos, [8, 0, 8], [0, -1, 0])));
    renderData.pushVec4(lightPos);

    renderData.instanceBatches = batches;

    particleSystem.update(time, dt, cam.position);
    renderer.Render(renderData);

    requestAnimationFrame(RenderFrame);
}