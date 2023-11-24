import { createTexture } from './Device.js';

export default class ResourceCache
{
    constructor(device, {

    } = {}){
        this.device = device;
        this.vertexBuffers = [];
        this.indexBuffers = [];
        this.indexLength = [];
        this.bufferCount = 0;


        this.linearSampler = device.createSampler({
            magFilter: 'linear',
            minFilter: 'linear',
        });
        this.materialBindGroups = [];
        this.materialBindLayout;
        this.materialCount = 0;
    }

    addMesh(meshData)
    {
        let v = this.device.createBuffer({
            label: "Triangle vertices",
            size: meshData.vertices.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
        
        let i = this.device.createBuffer({
            label: "indices",
            size: meshData.indices.byteLength,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        });
        
        this.device.queue.writeBuffer(v, 0, meshData.vertices);
        this.device.queue.writeBuffer(i, 0, meshData.indices);
        
        this.vertexBuffers.push(v);
        this.indexBuffers.push(i);
        this.indexLength.push(meshData.indices.length);

        return this.bufferCount++;
    }

    addMaterial(textureData, normalData)
    {
        let texture = createTexture(this.device, textureData);
        let normal = createTexture(this.device, normalData);

        let bindGroup = this.device.createBindGroup({
            label: "Material",
            layout: this.materialBindLayout,
            entries: [
            {
                binding: 0,
                resource: this.linearSampler
            },
            {
                binding: 1,
                resource: texture.createView()
            },
            {
                binding: 2,
                resource: normal.createView()
            }],
        });

        this.materialBindGroups.push(bindGroup);

        return this.materialCount++;
    }

}