import Renderer, { InstancedBatch, RenderData } from './RenderEngine/Renderer.js';
import { loadImageRGBA, loadTexture, loadMesh } from './AssetLoader.js';

import { vec2, vec3 } from './Math/gl-matrix-module.js';

export class Tile
{
    constructor(
        mesh = 0,
        texture = 0,
        collider = [],
        destructible = false,
    ){
        this.mesh = mesh;
        this.texture = texture;
        this.destructible = destructible;
        this.collider = collider;
    }
}

export default class Arena
{
    constructor(){
        this.batches = {};
        this.tiles = {};
        this.arenaChanged = false;

        this.arenaForegroundData = [
            [ '#','#','#','#','#','#','#','#','#','#','#','#','#','#','#','#' ],
            [ '#',' ',' ',' ',' ','O',' ',' ',' ',' ',' ',' ',' ',' ',' ','#' ],
            [ '#',' ','#',' ','#','O',' ','#','#',' ',' ','#',' ','#',' ','#' ],
            [ '#',' ',' ',' ',' ',' ','#','O','O','#',' ',' ',' ',' ',' ','#' ],
            [ '#',' ','#',' ','#',' ',' ',' ',' ',' ',' ','#',' ','#',' ','#' ],
            [ '#',' ',' ',' ',' ',' ','T',' ',' ','#',' ',' ',' ',' ',' ','#' ],
            [ '#',' ',' ','T',' ','T','T',' ',' ','#','#',' ','T',' ',' ','#' ],
            [ '#','B','#','O',' ',' ',' ','I',' ',' ',' ',' ',' ','#',' ','#' ],
            [ '#',' ','#',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ','#',' ','#' ],
            [ '#',' ','O','T','C',' ',' ',' ',' ','T','T',' ','T',' ',' ','#' ],
            [ '#',' ','O',' ',' ',' ',' ',' ',' ','T',' ',' ',' ',' ',' ','#' ],
            [ '#',' ','#','O',' ','F','C','F','C',' ',' ','#',' ','#',' ','#' ],
            [ '#',' ',' ',' ',' ',' ','#',' ',' ','#',' ',' ',' ',' ',' ','#' ],
            [ '#',' ','#',' ','#',' ',' ','#','#',' ',' ','#',' ','#',' ','#' ],
            [ '#',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ','#' ],
            [ '#','#','#','#','#','#','#','#','#','#','#','#','#','#','#','#' ]];

        this.arenaBackgroundData = [
            [ ' ',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ' ],
            [ ' ','_','_','_','_','_','_','_','_','_','_','_','_','_','_',' ' ],
            [ ' ','_',' ','_',' ','_','_',' ',' ','_','_',' ','_',' ','_',' ' ],
            [ ' ','_','_','_','_','_',' ','_','_',' ','_','_','_','_','_',' ' ],
            [ ' ','_',' ','_',' ','_','_','_','_','_','_',' ','_',' ','_',' ' ],
            [ ' ','_','_','_','_','_','_','_','_',' ','_','_','_','_','_',' ' ],
            [ ' ','_','_','_','_','_','_','_','_',' ',' ','_','_','_','_',' ' ],
            [ ' ','_',' ','_','_','_','_','_','_','_','_','_','_',' ','_',' ' ],
            [ ' ','_',' ','_','_','_','_','_','_','_','_','_','_',' ','_',' ' ],
            [ ' ','_','_','_','_','_','_','_','_','_','_','_','_','_','_',' ' ],
            [ ' ','_','_','_','_','_','_','_','_','_','_','_','_','_','_',' ' ],
            [ ' ','_',' ','_','_','_','_','_','_','_','_',' ','_',' ','_',' ' ],
            [ ' ','_','_','_','_','_',' ','_','_',' ','_','_','_','_','_',' ' ],
            [ ' ','_',' ','_',' ','_','_',' ',' ','_','_',' ','_',' ','_',' ' ],
            [ ' ','_','_','_','_','_','_','_','_','_','_','_','_','_','_',' ' ],
            [ ' ',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ' ]];

        
    }

    async Initialize(resourceCache)
    {

        let wallMesh = resourceCache.addMesh(await loadMesh('/res/meshes/wall.obj'));
        let floorMesh = resourceCache.addMesh(await loadMesh('/res/meshes/floor.obj'));
        let tombstoneMesh = resourceCache.addMesh(await loadMesh('/res/meshes/tombstone.obj'));
        let barrelMesh = resourceCache.addMesh(await loadMesh('/res/meshes/barrel.obj'));
        let couldronMesh = resourceCache.addMesh(await loadMesh('/res/meshes/couldron.obj'));
        let bottleMesh = resourceCache.addMesh(await loadMesh('/res/meshes/bottleShort.obj'));
        let candleStandMesh = resourceCache.addMesh(await loadMesh('/res/meshes/candleStand.obj'));
        let barStoolMesh = resourceCache.addMesh(await loadMesh('/res/meshes/barStool.obj'));
        let chairMesh = resourceCache.addMesh(await loadMesh('/res/meshes/chair.obj'));
        let bombMesh = resourceCache.addMesh(await loadMesh('/res/meshes/bomb.obj'))
        
        let sandstone = resourceCache.addMaterial(await loadImageRGBA('/res/textures/Sandstone/albedo.png'), await loadImageRGBA('/res/textures/Sandstone/normal.png'));
        let greystone = resourceCache.addMaterial(await loadImageRGBA('/res/textures/GreyStone/albedo.png'), await loadImageRGBA('/res/textures/GreyStone/normal.png'));
        let barrelTexture = resourceCache.addMaterial(await loadImageRGBA('/res/textures/Barrel/albedo.png'), await loadImageRGBA('/res/textures/Barrel/normal.png'));
        let couldronTexture = resourceCache.addMaterial(await loadImageRGBA('/res/textures/Couldron/albedo.png'), await loadImageRGBA('/res/textures/Couldron/normal.png'));
        let bottleTexture = resourceCache.addMaterial(await loadImageRGBA('/res/textures/BottleShort/albedo.png'), await loadImageRGBA('/res/textures/BottleShort/normal.png'));
        let candleStandTexture = resourceCache.addMaterial(await loadImageRGBA('/res/textures/CandleStand/albedo.png'), await loadImageRGBA('/res/textures/CandleStand/normal.png'));
        let barStoolTexture = resourceCache.addMaterial(await loadImageRGBA('/res/textures/BarStool/albedo.png'), await loadImageRGBA('/res/textures/BarStool/normal.png'));
        let chairTexture = resourceCache.addMaterial(await loadImageRGBA('/res/textures/Chair/albedo.png'), await loadImageRGBA('/res/textures/Chair/normal.png'));


        let wall = new Tile();
        wall.mesh = wallMesh;
        wall.texture = sandstone;
        wall.collider = [0, 0, 1, 1];
        this.tiles['#'] = wall;
        let floor = new Tile();
        floor.mesh = floorMesh;
        floor.texture = greystone;
        this.tiles['_'] = floor;
        let tombstone = new Tile();
        tombstone.mesh = tombstoneMesh;
        tombstone.texture = greystone;
        tombstone.collider = [0.2, 0.2, 0.8, 0.8];
        tombstone.destructible = true;
        this.tiles['T'] = tombstone;
        let barrel = new Tile();
        barrel.mesh = barrelMesh;
        barrel.texture = barrelTexture;
        barrel.collider = [0, 0, 1, 1];
        barrel.destructible = true;
        this.tiles['O'] = barrel;
        let couldron = new Tile();
        couldron.mesh = couldronMesh;
        couldron.texture = couldronTexture;
        couldron.collider = [0.2, 0.2, 0.8, 0.8];
        couldron.destructible = true;
        this.tiles['C'] = couldron;
        let bottle = new Tile();
        bottle.mesh = bottleMesh;
        bottle.texture = bottleTexture;
        bottle.collider = [0.1, 0.1, 0.9, 0.9];
        bottle.destructible = true;
        this.tiles['L'] = bottle;
        let candleStand = new Tile();
        candleStand.mesh = candleStandMesh;
        candleStand.texture = candleStandTexture;
        candleStand.collider = [0.3, 0.3, 0.7, 0.7];
        candleStand.destructible = true;
        this.tiles['S'] = candleStand;
        let barStool = new Tile();
        barStool.mesh = barStoolMesh;
        barStool.texture = barStoolTexture;
        barStool.collider = [0.2, 0.2, 0.8, 0.8];
        barStool.destructible = true;
        this.tiles['V'] = barStool;
        let chair = new Tile();
        chair.mesh = chairMesh;
        chair.texture = chairTexture;
        chair.collider = [0, 0, 1, 1];
        chair.destructible = true;
        this.tiles['h'] = chair;
        let bomb = new Tile();
        bomb.mesh = bombMesh
        bomb.texture = couldronTexture
        bomb.collider = [0.3, 0.3, 0.7, 0.7]
        this.tiles['B'] = bomb

        let batch = new InstancedBatch();
        let t = this.tiles['B'];
        batch.mesh = t.mesh;
        batch.texture = t.texture;
        this.batches['B'] = batch;

        // Temporarily removed for testing purposes
        this.arenaForegroundData = [
            [ '#','#','#','#','#','#','#','#','#','#','#','#','#','#','#','#','#' ],
            [ '#',' ',' ','X','X','X','X',' ','X',' ','X','X','X','X',' ',' ','#' ],
            [ '#',' ','#','X','#','X','#','X','#','X','#','X','#','X','#',' ','#' ],
            [ '#','X','X','X','X','X','X','X','X','X','X','X','X','X','X','X','#' ],
            [ '#','X','#','X','X',' ','#','X','#','X','#',' ','X','X','#','X','#' ],
            [ '#','X','X',' ','X','X','X',' ','#',' ','X','X','X',' ','X','X','#' ],
            [ '#','X','#','X','#','X','#','#','#','#','#','X','#','X','#','X','#' ],
            [ '#','X','X',' ','X','X','X',' ','#',' ','X','X','X',' ','X','X','#' ],
            [ '#','X','#','X','X',' ','#','X','#','X','#',' ','X','X','#','X','#' ],
            [ '#',' ','X','X','X','X','X','X','X','X','X','X','X','X','X','X','#' ],
            [ '#',' ','#','X','#','X','#','X','#','X','#','X','#','X','#',' ','#' ],
            [ '#',' ',' ','X',' ','X','X',' ','X',' ','X','X','X','X',' ',' ','#' ],
            [ '#','#','#','#','#','#','#','#','#','#','#','#','#','#','#','#','#' ]];

        this.arenaBackgroundData = Array(this.arenaForegroundData.length);
        for (var i = 0; i < this.arenaBackgroundData.length; i++) {
            this.arenaBackgroundData[i] = Array(this.arenaForegroundData[i].length).fill(' ');
        }
            

        let probability = {
            'O': 10,
            'C': 8,
            'T': 10,
            'L': 10,
            'S': 10,
            'V': 10,
            'h': 10,
            ' ': 10
        }
        let probabilityList = [];
        for (const [key, value] of Object.entries(probability)) 
        {
            for(let i = 0; i < value; i++)
                probabilityList.push(key)
        }

        for(let y = 0; y < this.arenaForegroundData.length; y++)
        {
            for(let x = 0; x < this.arenaForegroundData[y].length; x++)
            {
                let foreGround = this.arenaForegroundData[y][x];

                if(foreGround == ' ')
                {
                    this.arenaBackgroundData[y][x] = '_'
                }
                else if(foreGround == 'X')
                {
                    let newTile = probabilityList[Math.floor((Math.random()*probabilityList.length))];
                    this.arenaForegroundData[y][x] = newTile;
                    this.arenaBackgroundData[y][x] = '_';
                }
            }  
        }


        this.buildArena();
    }

    collideCircle(position, velocity, radius, excludeCollision) 
    {
        let currPos = vec2.fromValues(position[0], position[2]);
        let nextPos = vec2.fromValues(position[0] + velocity[0], position[2] + velocity[2]);
        let vCurrentCell = vec2.floor(vec2.create(), currPos);
        let vTargetCell = vec2.floor(vec2.create(), nextPos);
        
        let cellMin = vec2.min(vec2.create(), vCurrentCell, vTargetCell);
        let cellMax = vec2.max(vec2.create(), vCurrentCell, vTargetCell);
        let vAreaTL = vec2.max(vec2.create(), vec2.sub(vec2.create(), cellMin, vec2.fromValues(1, 1)), vec2.fromValues(0, 0));
        let vAreaBR = vec2.min(vec2.create(), vec2.add(vec2.create(), cellMax, vec2.fromValues(1, 1)), vec2.fromValues(16, 16));
        
        let playerRadius = radius;
        let vCell = vec2.create();

        for (vCell[1] = vAreaTL[1]; vCell[1] <= vAreaBR[1]; vCell[1]++)
        {
            for (vCell[0] = vAreaTL[0]; vCell[0] <= vAreaBR[0]; vCell[0]++)
            {
                if(vCell[0] == excludeCollision[0] && vCell[1] == excludeCollision[1])
                    continue;

                let tile = this.arenaForegroundData[vCell[1]][vCell[0]];
                if(this.tiles[tile] == undefined)
                    continue;

                let isBomb = tile == 'B';
                let colliders = this.tiles[tile].collider;
                if (colliders.length != 0)
                {
                    for(let i = 0; i < colliders.length; i+=4)
                    {
                        let BL = [colliders[i + 0], colliders[i + 1]];
                        let TR = [colliders[i + 2], colliders[i + 3]];
                        let vNearestPoint = vec2.create();
                        vNearestPoint[0] = Math.max(vCell[0] + BL[0], Math.min(nextPos[0], vCell[0] + TR[0]));
                        vNearestPoint[1] = Math.max(vCell[1] + BL[1], Math.min(nextPos[1], vCell[1] + TR[1]));
                        let vRayToNearest = vec2.sub(vec2.create(), vNearestPoint, nextPos);
                        let fOverlap = playerRadius - vec2.length(vRayToNearest);
                        if (fOverlap == NaN) fOverlap = 0.0;
                        
                        if (fOverlap > 0.0)
                        {
                            vec2.sub(nextPos, nextPos, vec3.scale(vec2.create(), vec2.normalize(vec2.create(), vRayToNearest), fOverlap));
                        }
                    }
                }
            }
        }
        position[0] = nextPos[0];
        position[2] = nextPos[1];
    }

    getTile(x, y)
    {
        return this.arenaForegroundData[y][x];
    }

    isDestructible(x, y)
    { 
        let t = this.arenaForegroundData[y][x];
        if(t == ' ')
            return false;
        return this.tiles[t].destructible;
    }

    setTile(x, y, newTile)
    {
        this.arenaForegroundData[y][x] = newTile;
        this.arenaChanged = true;
    }

    updateArena()
    {
        if(!this.arenaChanged)
            return;

        for (const [key, value] of Object.entries(this.batches)) 
        {
            value.reset();
        }

        for(let y = 0; y < this.arenaForegroundData.length; y++)
        {
            for(let x = 0; x < this.arenaForegroundData[y].length; x++)
            {
                let tile1 = this.arenaForegroundData[y][x];
                let tile2 = this.arenaBackgroundData[y][x];

                if(this.tiles[tile1] != undefined)
                {
                    this.batches[tile1].addInstance([x, 0, y]);
                }    
                if(this.tiles[tile2] != undefined)
                {
                    this.batches[tile2].addInstance([x, 0, y]);
                }    
            }
        }
    }

    buildArena() 
    {
        for(let y = 0; y < this.arenaForegroundData.length; y++)
        {
            for(let x = 0; x < this.arenaForegroundData[y].length; x++)
            {
                let tile1 = this.arenaForegroundData[y][x];
                let tile2 = this.arenaBackgroundData[y][x];

                if(this.tiles[tile1] != undefined)
                {
                    if(this.batches[tile1] === undefined)
                    {
                        let batch = new InstancedBatch();
                        let t = this.tiles[tile1];
                        batch.mesh = t.mesh;
                        batch.texture = t.texture;
                        
                        this.batches[tile1] = batch;
                    }
                    
                    this.batches[tile1].addInstance([x, 0, y]);
                }

                if(this.tiles[tile2] != undefined)
                {
                    if(this.batches[tile2] === undefined)
                    {
                        let batch = new InstancedBatch();
                        let t = this.tiles[tile2];
                        batch.mesh = t.mesh;
                        batch.texture = t.texture;
                        
                        this.batches[tile2] = batch;
                    }

                    this.batches[tile2].addInstance([x, 0, y]);
                }
            }
        }
    }

}