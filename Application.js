
import { vec2, vec3, mat4 } from './Math/gl-matrix-module.js';

import Renderer, { InstancedBatch, RenderData } from './RenderEngine/Renderer.js';
import Input from './Input.js';
import Camera from './RenderEngine/Camera.js';
import { loadTexture, loadMesh } from './AssetLoader.js';

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

var renderer = new Renderer(device, canvas, context);
var input = new Input(canvas);
var cam = new Camera(canvas, input);
var renderData = new RenderData();
var playerBatch = new InstancedBatch();
var batches = [];

var arena = [];
var playerPos = [1.5, 0, 1.5];


export async function Init()
{
    let resourceCache = renderer.resourceCache;
    let fontGenerator = renderer.fontGenerator;
    let str = await (await fetch("res/shaders/fontFragment.wgsl")).text();
    fontGenerator.addText(str, 0, 8, 0);
    
    await renderer.Initialize();

	arena = [
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


    let wall = resourceCache.addMesh(await loadMesh('res/meshes/wall.obj'));
    let floor = resourceCache.addMesh(await loadMesh('res/meshes/floor.obj'));
    let tombstone = resourceCache.addMesh(await loadMesh('res/meshes/tombstone.obj'));
    let environment = resourceCache.addMesh(await loadMesh('res/meshes/environment.obj'));
    let texture1 = resourceCache.addTexture(await loadTexture('res/textures/stoneWall.png'));
    let texture2 = resourceCache.addTexture(await loadTexture('res/textures/stoneTiles.png'));
    var arenaWallBatch = new InstancedBatch();
    var arenaFloorBatch = new InstancedBatch();
    var arenaTombstoneBatch = new InstancedBatch();
    var arenaEnvironmentBatch = new InstancedBatch();
    arenaWallBatch.setMesh(wall);
    arenaWallBatch.setTexture(texture1);
    arenaFloorBatch.setMesh(floor);
    arenaFloorBatch.setTexture(texture2);
    arenaTombstoneBatch.setMesh(tombstone);
    arenaEnvironmentBatch.setMesh(environment);
    arenaEnvironmentBatch.addInstance([0, 0, 0]);
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
    batches.push(arenaWallBatch);
    batches.push(arenaFloorBatch);
    batches.push(arenaTombstoneBatch);
    batches.push(arenaEnvironmentBatch);

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

var lastTime = performance.now() / 1000;

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
    let potentialPosition = vec3.add(vec3.create(), playerPos, velocity);

    let po = vec2.fromValues(potentialPosition[0], potentialPosition[2]);
	let vCurrentCell = vec2.floor(vec2.create(), vec2.fromValues(playerPos[0], playerPos[2]));
	let vTargetCell = vec2.floor(vec2.create(), po);
    
    
    let cellMin = vec2.min(vec2.create(), vCurrentCell, vTargetCell);
    let cellMax = vec2.max(vec2.create(), vCurrentCell, vTargetCell);
	let vAreaTL = vec2.max(vec2.create(), vec2.sub(vec2.create(), cellMin, vec2.fromValues(1, 1)), vec2.fromValues(0, 0));
	let vAreaBR = vec2.min(vec2.create(), vec2.add(vec2.create(), cellMax, vec2.fromValues(1, 1)), vec2.fromValues(16, 16));
    
    
	let playerRadius = 0.4;
	let vCell = vec2.create();
	let BL = 0.0;
	let TR = 1.0;
    
	for (vCell[1] = vAreaTL[1]; vCell[1] <= vAreaBR[1]; vCell[1]++)
	{
        for (vCell[0] = vAreaTL[0]; vCell[0] <= vAreaBR[0]; vCell[0]++)
		{
            if (arena[vCell[1]][vCell[0]] == '#')
			{

                let vNearestPoint = vec2.create();
				vNearestPoint[0] = Math.max(vCell[0] + BL, Math.min(po[0], vCell[0] + TR));
				vNearestPoint[1] = Math.max(vCell[1] + BL, Math.min(po[1], vCell[1] + TR));
				let vRayToNearest = vec2.sub(vec2.create(), vNearestPoint, po);
				let fOverlap = playerRadius - vec2.length(vRayToNearest);
				if (fOverlap == NaN) fOverlap = 0.0;
                
				if (fOverlap > 0.0)
				{
					vec2.sub(po, po, vec3.scale(vec2.create(), vec2.normalize(vec2.create(), vRayToNearest), fOverlap));
                }
			}
		}
	}
    playerPos[0] = po[0];
    playerPos[2] = po[1];
    //playerBatch.reset();
    //playerBatch.addInstance([cam.position[0], 1, 1]);
    playerBatch.updateInstance(0, playerPos);

    renderData.reset();
    renderData.pushMatrix(cam.viewMatrix);
    renderData.pushMatrix(cam.projectionMatrix);
    renderData.pushMatrix(cam.invViewMatrix);
    renderData.pushMatrix(cam.invProjectionMatrix);
    let lightPos = [Math.sin(time) * 5 + 8, 10, Math.cos(time) * 5 + 8];
    let ortho = mat4.ortho(mat4.create(), -16, 16, -16, 16, -20, 20);
    ortho[5] *= -1;
    renderData.pushMatrix(mat4.multiply(mat4.create(), ortho, mat4.lookAt(mat4.create(), lightPos, [8, 0, 8], [0, -1, 0])));
    renderData.pushVec4(lightPos);

    renderData.instanceBatches = batches;

    renderer.Render(renderData);

    requestAnimationFrame(RenderFrame);
}