
import { vec3, mat4 } from './Math/gl-matrix-module.js';

import Renderer, { InstancedBatch, RenderData } from './RenderEngine/Renderer.js';
import Camera from './RenderEngine/Camera.js';
import { cubeVertices, cubeIndices } from './RenderEngine/Cube.js';
import { loadTexture, loadMesh } from './AssetLoader.js';
import FontGenerator from './RenderEngine/FontGenerator.js';

import { createTexture } from './RenderEngine/Device.js';

if (!navigator.gpu) throw new Error("WebGPU not supported on this browser.");
const adapter = await navigator.gpu.requestAdapter();
if (!adapter) throw new Error("No appropriate GPUAdapter found.");

const device = await adapter.requestDevice();
const canvas = document.querySelector('canvas');
const context = canvas.getContext("webgpu");

//canvas.width  = window.innerWidth;
//canvas.height = window.innerHeight;
//canvas.width  = 640;
//canvas.height = 360;

var cam = new Camera(canvas);
var renderer = new Renderer(device, canvas, context);

var renderData = new RenderData();
var playerBatch = new InstancedBatch();
var arenaWallBatch = new InstancedBatch();
var arenaFloorBatch = new InstancedBatch();
var arenaTombstoneBatch = new InstancedBatch();
var arenaEnvironmentBatch = new InstancedBatch();
var batches = [];

let arena = [
	[ '#','#','#','#','#','#','#','#','#','#','#','#','#','#','#','#' ],
	[ '#','_','_','_','_','_','_','_','_','_','_','_','_','_','_','#' ],
	[ '#','_','#','_','#','_','_','#','#','_','_','#','_','#','_','#' ],
	[ '#','_','_','_','_','_','#','_','_','#','_','_','_','_','_','#' ],
	[ '#','_','#','_','#','_','_','_','_','_','_','#','_','#','_','#' ],
	[ '#','_','_','_','_','_','T','_','_','#','_','_','_','_','_','#' ],
	[ '#','_','_','T','_','T','T','_','_','#','#','_','T','_','_','#' ],
	[ '#','_','#','_','_','_','_','_','_','_','_','_','_','#','_','#' ],
	[ '#','_','#','_','_','_','_','_','_','_','_','_','_','#','_','#' ],
	[ '#','_','_','T','_','#','#','_','_','T','T','_','T','_','_','#' ],
	[ '#','_','_','_','_','_','#','_','_','T','_','_','_','_','_','#' ],
	[ '#','_','#','_','#','_','_','_','_','_','_','#','_','#','_','#' ],
	[ '#','_','_','_','_','_','#','_','_','#','_','_','_','_','_','#' ],
	[ '#','_','#','_','#','_','_','#','#','_','_','#','_','#','_','#' ],
	[ '#','_','_','_','_','_','_','_','_','_','_','_','_','_','_','#' ],
	[ '#','#','#','#','#','#','#','#','#','#','#','#','#','#','#','#' ]];
let arenaChanged = false

export async function Init()
{
    let resourceCache = renderer.resourceCache;
    let fontGenerator = renderer.fontGenerator;
    let str = await (await fetch("res/shaders/fontFragment.wgsl")).text();
    fontGenerator.addText(str, 0, 8, 0);
    
    await renderer.Initialize();

    let wall = resourceCache.addMesh(await loadMesh('res/meshes/wall.obj'));
    let floor = resourceCache.addMesh(await loadMesh('res/meshes/floor.obj'));
    let tombstone = resourceCache.addMesh(await loadMesh('res/meshes/tombstone.obj'));
    let environment = resourceCache.addMesh(await loadMesh('res/meshes/environment.obj'));
    let texture1 = resourceCache.addTexture(await loadTexture('res/textures/stoneWall.png'));
    let texture2 = resourceCache.addTexture(await loadTexture('res/textures/stoneTiles.png'));
    
    arenaWallBatch.setMesh(wall);
    arenaWallBatch.setTexture(texture1);
    arenaFloorBatch.setMesh(floor);
    arenaFloorBatch.setTexture(texture2);
    arenaTombstoneBatch.setMesh(tombstone);
    arenaEnvironmentBatch.setMesh(environment);
    arenaEnvironmentBatch.addInstance([0, 0, 0]);
    
    updateArena(arena)

    batches.push(arenaWallBatch);
    batches.push(arenaFloorBatch);
    batches.push(arenaTombstoneBatch);
    batches.push(arenaEnvironmentBatch);

    playerBatch.setMesh(wall);
    playerBatch.addInstance([1, 1, 1]);
    batches.push(playerBatch);


    let teapot = resourceCache.addMesh(await loadMesh('res/meshes/teapot.obj'));
    var batchTeapot = new InstancedBatch();
    batchTeapot.setMesh(teapot);
    batchTeapot.addInstance([-15, 10, 10]);
    batches.push(batchTeapot);
}

function updateArena() {
    arenaWallBatch.reset()
    arenaFloorBatch.reset()
    arenaTombstoneBatch.reset()
    for(let y = 0; y < arena.length; y++)
    {
        for(let x = 0; x < arena[y].length; x++)
        {
            let tile = arena[y][x];
            if(tile == '#')
            {
                arenaWallBatch.addInstance([x, 0, y]);
            }
            else if(tile == '_')
            {
                arenaFloorBatch.addInstance([x, 0, y]);
            }
            else if(tile == 'T')
            {
                arenaTombstoneBatch.addInstance([x, 0, y]);
            }
        }
    }
}

let gameLoop = setInterval(() => {
    if(arenaChanged) {
        updateArena()
        arenaChanged = false
    }
}, 50)

function explodeBomb(coords, radius) {
    
    let [x, y] = coords;

    const directions = [
        [0, -1],
        [0, 1],
        [-1, 0],
        [1, 0]
    ];

    for (let [dx, dy] of directions) {
        for (let i = 1; i <= radius; i++) {
            let newX = x + dx * i;
            let newY = y + dy * i;

            if (newX < 0 || newX >= arena.length || newY < 0 || newY >= arena[newX].length) {
                break
            }

            if (arena[newX][newY] === '#') {
                break
            }

            if (arena[newX][newY] === 'T') {
                arena[newX][newY] = '_';
                break
            }

            if (arena[newX][newY] === '_') {
                continue
            }
        }
    }

    arenaChanged = true;
}


var lastTime = performance.now() / 1000;

export function RenderFrame()
{
    let time = performance.now() / 1000;
    let dt = time - lastTime;
    lastTime = time;

    cam.update(dt);

    playerBatch.updateInstance(0, [cam.position[0], 1, cam.position[2]]);

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

    renderer.Render(renderData);

    requestAnimationFrame(RenderFrame);
}