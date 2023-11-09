import Renderer, { InstancedBatch, RenderData } from './RenderEngine/Renderer.js';
import { loadTexture, loadMesh } from './AssetLoader.js';

import { vec2, vec3 } from './Math/gl-matrix-module.js';

export class Tile
{
    constructor(
        mesh = 0,
        texture = 0,
        collider = [],
    ){
        this.mesh = mesh;
        this.texture = texture;

        this.collider = collider;
    }
}

export default class Arena
{
    constructor(){
        this.batches = {};

        this.arenaData = [
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
        this.arenaChanged = false;


        this.tiles = {};

        let wall = new Tile();
        wall.mesh = 0;
        wall.texture = 0;
        this.tiles['#'] = wall;
        let floor = new Tile();
        floor.mesh = 1;
        floor.texture = 0;
        this.tiles['_'] = floor;
        let tombstone = new Tile();
        tombstone.mesh = 2;
        tombstone.texture = 1;
        this.tiles['T'] = tombstone;
        this.buildArena();
    }

    collideCircle(position, velocity, radius) 
    {
        let currPos = vec2.fromValues(position[0], position[2]);
        let nextPos = vec2.fromValues(position[0] + velocity[0], position[2] + velocity[2]);
        let vCurrentCell = vec2.floor(vec2.create(), currPos);
        let vTargetCell = vec2.floor(vec2.create(), nextPos);
        
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
                if (this.arenaData[vCell[1]][vCell[0]] == '#')
                {
    
                    let vNearestPoint = vec2.create();
                    vNearestPoint[0] = Math.max(vCell[0] + BL, Math.min(nextPos[0], vCell[0] + TR));
                    vNearestPoint[1] = Math.max(vCell[1] + BL, Math.min(nextPos[1], vCell[1] + TR));
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
        position[0] = nextPos[0];
        position[2] = nextPos[1];
    }

    getTile(x, y)
    {
        return this.arenaData[y][x];
    }

    setTile(x, y, newTile)
    {
        this.arenaData[y][x] = newTile;
    }

    updateArena() 
    {
        for (const [key, value] of Object.entries(this.batches)) 
        {
            value.reset();
        }

        for(let y = 0; y < this.arenaData.length; y++)
        {
            for(let x = 0; x < this.arenaData[y].length; x++)
            {
                let tile = this.arenaData[y][x];
                this.batches[tile].addInstance([x, 0, y]);          
            }
        }
    }

    buildArena() 
    {
        this.batches = {};

        for(let y = 0; y < this.arenaData.length; y++)
        {
            for(let x = 0; x < this.arenaData[y].length; x++)
            {
                let tile = this.arenaData[y][x];

                if(this.batches[tile] === undefined)
                {
                    let batch = new InstancedBatch();
                    let t = this.tiles[tile];
                    batch.mesh = t.mesh;
                    batch.texture = t.texture;
                    


                    this.batches[tile] = batch;
                }

                this.batches[tile].addInstance([x, 0, y]);          
            }
        }
    }

}