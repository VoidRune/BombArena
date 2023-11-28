import { vec3, mat4 } from '../Math/gl-matrix-module.js';

import { createTexture } from './Device.js';

import { loadTexture, loadImageRGBA, loadMesh } from '../AssetLoader.js';
import FontGenerator from './FontGenerator.js';
import ResourceCache from './ResourceCache.js';
import ParticleSystem from './ParticleSystem.js';

export class InstancedBatch
{
    constructor()
    {
        this.mesh = 0;
        this.texture = 0;
        this.transforms = new Float32Array(16 * 512);
        this.count = 0;
        this.dirty = false;
    }

    reset()
    {
        this.count = 0;
    }

    setMesh(mesh)
    {
        this.mesh = mesh;
        this.dirty = true;
    }

    setTexture(texture)
    {
        this.texture = texture;
        this.dirty = true;
    }

    updateInstance(id, p)
    {
        mat4.fromTranslation(this.transforms.subarray(16 * id, 16 * (id + 1)), vec3.fromValues(p[0], p[1], p[2]));
        this.dirty = true;
    }

    addInstance(p)
    {
        mat4.fromTranslation(this.transforms.subarray(16 * this.count, 16 * (this.count + 1)), vec3.fromValues(p[0], p[1], p[2]));
        this.count++;
        this.dirty = true;
    }
}


export class RenderData
{
    constructor()
    {
        //this.view = mat4.identity(mat4.create());
        //this.projection = mat4.identity(mat4.create());
        //this.invView = mat4.identity(mat4.create());
        //this.invProjection = mat4.identity(mat4.create());

        this.cameraData = new Float32Array(16 * 8);
        this.size = 0;
        this.instanceBatches = [];
    }

    reset()
    {
        this.size = 0;
    }
    pushMatrix(data)
    {
        mat4.copy(this.cameraData.subarray(this.size, this.size + 16), data);
        this.size += 16;
    }
    pushVec4(data)
    {
        mat4.copy(this.cameraData.subarray(this.size, this.size + 4), data);
        this.size += 4;
    }
}

export default class Renderer
{
    constructor(device, canvas, context, {

    } = {}){
        this.device = device;
        this.canvas = canvas;
        this.context = context;

        const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
        context.configure({
        device: device,
        format: canvasFormat,
        });
        
        
        this.SHADOWMAP_SIZE = 2048;
        this.shadowmapAttachment;
        this.positionAttachment;
        this.colorAttachment;
        this.normalAttachment;
        this.depthAttachment;

        this.overlayAttachment;

        this.shadowmapPipeline;
        this.pipeline;
        this.billboardPipeline;
        this.finalCompositionPipeline;

        this.quadVertices;
        this.quadIndices;
        this.quadIndexBuffer;
        this.quadVertexBuffer;
        this.fontPipeline;

        this.MAX_TRANSFORMS = 4096;
        this.transforms = new Float32Array(16 * this.MAX_TRANSFORMS);

        this.cameraUniformBuffer;
        this.SSBOUniformBuffer;
        this.globalShadowmapBindGroup;
        this.globalBindGroup;

        this.ParticleSSBOUniformBuffer;
        this.globalBillboardBindGroup;
        this.BillboardBindGroup;

        this.globalFontBindGroup;
        this.fontBindGroup;

        this.finalCompositionBindGroup;

        this.fontGenerator = new FontGenerator('res/font/Droidsansmono_ttf.csv');

        this.resourceCache = new ResourceCache(device);
        this.particleSystem = new ParticleSystem();
    }

    async Initialize()
    {
        let device = this.device;
        let canvas = this.canvas;

        await this.fontGenerator.init();


        const shadowmapVertes = await (await fetch("res/shaders/shadowmapVertex.wgsl")).text();
        const vertexShader = await (await fetch("res/shaders/vertex.wgsl")).text();
        const fragmentShader = await (await fetch("res/shaders/fragment.wgsl")).text();
        const fontVertexShader = await (await fetch("res/shaders/fontVertex.wgsl")).text();
        const fontFragmentShader = await (await fetch("res/shaders/fontFragment.wgsl")).text();
        const billboardVertexShader = await (await fetch("res/shaders/billboardVertex.wgsl")).text();
        const billboardFragmentShader = await (await fetch("res/shaders/billboardFragment.wgsl")).text();
        const finalCompositionVertexShader = await (await fetch("res/shaders/presentVertex.wgsl")).text();
        const finalCompositionFragmentShader = await (await fetch("res/shaders/presentFragment.wgsl")).text();

        const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
    
        this.shadowmapAttachment = device.createTexture({
            size: [this.SHADOWMAP_SIZE, this.SHADOWMAP_SIZE],
            format: 'depth24plus',
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
        });

        this.positionAttachment = device.createTexture({
            size: [canvas.width, canvas.height],
            format: 'rgba16float',
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
        });

        this.colorAttachment = device.createTexture({
            size: [canvas.width, canvas.height],
            format: 'rgba8unorm',
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
        });
            
        this.normalAttachment = device.createTexture({
            size: [canvas.width, canvas.height],
            format: 'rgba8unorm',
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
        });

        this.depthAttachment = device.createTexture({
            size: [canvas.width, canvas.height],
            format: 'depth24plus',
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
        });

        this.overlayAttachment = device.createTexture({
            size: [canvas.width, canvas.height],
            format: 'rgba8unorm',
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
        });
    
        const vertexBufferLayout = {
            arrayStride: (3 + 3 + 3 + 2) * 4,
            attributes: [
            {
                format: "float32x3",
                offset: 0,
                shaderLocation: 0,
            },
            {
                format: "float32x3",
                offset: 4 * 3,
                shaderLocation: 1,
            },
            {
                format: "float32x3",
                offset: 4 * 6,
                shaderLocation: 2,
            },
            {
                format: "float32x2",
                offset: 4 * 9,
                shaderLocation: 3,
            }],
        };

        const fontVertexBufferLayout = {
            arrayStride: (2 + 3 + 2) * 4,
            attributes: [
            {
                format: "float32x2",
                offset: 0,
                shaderLocation: 0,
            },
            {
                format: "float32x3",
                offset: 4 * 2,
                shaderLocation: 1,
            },
            {
                format: "float32x2",
                offset: 4 * 5,
                shaderLocation: 2,
            }],
        };
        
        let fontImageData = await loadImageRGBA('/res/font/DroidSansMono.png');
        let font = createTexture(device, fontImageData, false);
    
        this.quadVertices = new Float32Array(this.fontGenerator.vert);
    
        this.quadVertexBuffer = device.createBuffer({
            label: "Triangle vertices",
            size: 4 * 4 * this.fontGenerator.vertexSize * this.fontGenerator.maxCharacters,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
    
        this.quadIndexBuffer = device.createBuffer({
            label: "indices",
            size: this.fontGenerator.quadIndices.byteLength,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        });
        //device.queue.writeBuffer(this.quadVertexBuffer, /*bufferOffset=*/0, this.quadVertices);
        device.queue.writeBuffer(this.quadIndexBuffer, /*bufferOffset=*/0, this.fontGenerator.quadIndices);
    
        let pointSampler = device.createSampler({
            magFilter: 'nearest',
            minFilter: 'nearest',

            lodMinClamp: 1,
            lodMaxClamp: 64,
        });

        let linearSampler = device.createSampler({
            magFilter: 'linear',
            minFilter: 'linear',

            lodMinClamp: 1,
            lodMaxClamp: 64,
        });

        /*
        const globalBindGrouplayout = device.createBindGroupLayout({
            entries: [
                {
                binding: 0,
                visibility: GPUShaderStage.VERTEX,
                buffer: {},
                },
                {
                binding: 1,
                visibility: GPUShaderStage.VERTEX,
                buffer: {},
                },
            ],
        });
        /*
        const materialBindGrouplayout = device.createBindGroupLayout({
            entries: [
                {
                binding: 0,
                visibility: GPUShaderStage.VERTEX,
                sampler: {},
                },
                {
                binding: 1,
                visibility: GPUShaderStage.VERTEX,
                texture: {},
                },
            ],
        });*/

        this.shadowmapPipeline = device.createRenderPipeline({
            label: "Shadowmap pipeline",
            layout: "auto",
            vertex: {
                module: device.createShaderModule({
                    code: shadowmapVertes
                }),
                entryPoint: "vertexMain",
                buffers: [vertexBufferLayout]
            },
            primitive: {
                topology: 'triangle-list',
                cullMode: 'back',
                frontFace: 'cw'
            },
            depthStencil: {
                depthWriteEnabled: true,
                depthCompare: 'less',
                format: this.shadowmapAttachment.format,
            },
        });

        this.pipeline = device.createRenderPipeline({
            label: "Basic pipeline",
            layout: "auto",
            vertex: {
                module: device.createShaderModule({
                    code: vertexShader
                }),
                entryPoint: "vertexMain",
                buffers: [vertexBufferLayout]
            },
            fragment: {
                module: device.createShaderModule({
                    code: fragmentShader
                }),
                entryPoint: "fragmentMain",
                targets: [{
                    format: 'rgba16float'
                },
                {
                    format: 'rgba8unorm'
                },
                {
                    format: 'rgba8unorm'
                }]
            },
            primitive: {
                topology: 'triangle-list',
                cullMode: 'back',
                frontFace: 'cw'
            },
            depthStencil: {
                depthWriteEnabled: true,
                depthCompare: 'less',
                format: this.depthAttachment.format,
            },
        });

        this.billboardPipeline = device.createRenderPipeline({
            label: "Billboard pipeline",
            layout: "auto",
            vertex: {
                module: device.createShaderModule({
                    code: billboardVertexShader
                }),
                entryPoint: "vertexMain",
                buffers: []
            },
            fragment: {
                module: device.createShaderModule({
                    code: billboardFragmentShader
                }),
                entryPoint: "fragmentMain",
                targets: [{
                    format: 'rgba8unorm',
                    blend: {
                        color: {
                          srcFactor: 'src-alpha',
                          dstFactor: 'one',
                          operation: 'add',
                        },
                        alpha: {
                          srcFactor: 'src-alpha',
                          dstFactor: 'one-minus-src-alpha',
                          operation: 'add',
                        },
                    },
                }]
            },
            primitive: {
                topology: 'triangle-list',
                cullMode: 'back',
                frontFace: 'cw'
            },
            depthStencil: {
                depthWriteEnabled: false,
                depthCompare: 'less',
                format: this.depthAttachment.format,
            },
        });
    
        this.fontPipeline = device.createRenderPipeline({
            label: "Font pipeline",
            layout: "auto",
            vertex: {
                module: device.createShaderModule({
                    code: fontVertexShader
                }),
                entryPoint: "vertexMain",
                buffers: [fontVertexBufferLayout]
            },
            fragment: {
                module: device.createShaderModule({
                    code: fontFragmentShader
                }),
                entryPoint: "fragmentMain",
                targets: [{
                    format: 'rgba8unorm',
                    blend: {
                        color: {
                          srcFactor: 'src-alpha',
                          dstFactor: 'one',
                          operation: 'add',
                        },
                        alpha: {
                          srcFactor: 'src-alpha',
                          dstFactor: 'one-minus-src-alpha',
                          operation: 'add',
                        },
                    },
                }]
            },
            primitive: {
                topology: 'triangle-list',
                cullMode: 'back',
                frontFace: 'cw'
            },
            depthStencil: {
                depthWriteEnabled: false,
                depthCompare: 'less',
                format: this.depthAttachment.format,
            },
        });

        this.finalCompositionPipeline = device.createRenderPipeline({
            label: "Present pipeline",
            layout: "auto",
            vertex: {
                module: device.createShaderModule({
                    code: finalCompositionVertexShader
                }),
                entryPoint: "vertexMain",
                buffers: [vertexBufferLayout]
            },
            fragment: {
                module: device.createShaderModule({
                    code: finalCompositionFragmentShader
                }),
                entryPoint: "fragmentMain",
                targets: [{
                format: canvasFormat
                }]
            },
            primitive: {
                topology: 'triangle-list',
                cullMode: 'back',
                frontFace: 'cw'
            },
        });

        this.resourceCache.materialBindLayout = this.pipeline.getBindGroupLayout(1);
    
        this.cameraUniformBuffer = device.createBuffer({
        label: "UBO",
        size: 64 * 8, //matrix * 8
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        device.queue.writeBuffer(this.cameraUniformBuffer, 0, mat4.identity(mat4.create()));
    
        this.SSBOUniformBuffer = device.createBuffer({
            label: "UBO",
            size: 64 * this.MAX_TRANSFORMS, //matrix * MAX_TRANSFORMS
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });

        this.ParticleSSBOUniformBuffer = device.createBuffer({
            label: "Particle buffer",
            size: 4 * this.particleSystem.PARTICLE_SIZE * this.particleSystem.maxParticles,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });

        this.globalBindGroup = device.createBindGroup({
            label: "Global",
            layout: this.pipeline.getBindGroupLayout(0),
            entries: [{
                binding: 0,
                resource: { buffer: this.cameraUniformBuffer }
            },
            {
                binding: 1,
                resource: { buffer: this.SSBOUniformBuffer }
            },
            {
                binding: 2,
                resource: device.createSampler({
                    compare: 'less'
                }),
            },
            {
                binding: 3,
                resource: this.shadowmapAttachment.createView()
            }],
        });

        this.globalShadowmapBindGroup = device.createBindGroup({
            label: "Global shadowmap",
            layout: this.shadowmapPipeline.getBindGroupLayout(0),
            entries: [{
                binding: 0,
                resource: { buffer: this.cameraUniformBuffer }
            },
            {
                binding: 1,
                resource: { buffer: this.SSBOUniformBuffer }
            }],
        });

        this.globalBillboardBindGroup = device.createBindGroup({
            label: "Global billboard",
            layout: this.billboardPipeline.getBindGroupLayout(0),
            entries: [{
                binding: 0,
                resource: { buffer: this.cameraUniformBuffer }
            },
            {
                binding: 1,
                resource: { buffer: this.ParticleSSBOUniformBuffer }
            }],
        });

        let effectImageData = await loadImageRGBA('/res/effects/effectAtlas.png');

        let effectImage = device.createTexture({
            size: {
                width: effectImageData.width,
                height: effectImageData.height,
                depthOrArrayLayers: 1,
            },
            format: 'r8unorm',
            usage:
                GPUTextureUsage.TEXTURE_BINDING |
                GPUTextureUsage.COPY_DST |
                GPUTextureUsage.RENDER_ATTACHMENT
        });
    
        device.queue.copyExternalImageToTexture(
            { source: effectImageData },
            { texture: effectImage },
            {
                width: effectImageData.width,
                height: effectImageData.height,
                depthOrArrayLayers: 1
            }
        );

        this.BillboardBindGroup = device.createBindGroup({
            label: "Billboard",
            layout: this.billboardPipeline.getBindGroupLayout(1),
            entries: [
            {
                binding: 0,
                resource: linearSampler
            },
            {
                binding: 1,
                resource: effectImage.createView()
            }],
        });

        this.globalFontBindGroup = device.createBindGroup({
            label: "Global",
            layout: this.fontPipeline.getBindGroupLayout(0),
            entries: [{
                binding: 0,
                resource: { buffer: this.cameraUniformBuffer }
            }],
        });
    
        this.fontBindGroup = device.createBindGroup({
            label: "Font",
            layout: this.fontPipeline.getBindGroupLayout(1),
            entries: [
            {
                binding: 0,
                resource: linearSampler
            },
            {
                binding: 1,
                resource: font.createView()
            }],
        });

        this.globalPresentBindGroup = device.createBindGroup({
            label: "Global Present",
            layout: this.finalCompositionPipeline.getBindGroupLayout(0),
            entries: [{
                binding: 0,
                resource: { buffer: this.cameraUniformBuffer }
            }],
        });

        this.finalCompositionBindGroup = device.createBindGroup({
            label: "Present",
            layout: this.finalCompositionPipeline.getBindGroupLayout(1),
            entries: [
            {
                binding: 0,
                resource: pointSampler
            },
            {
                binding: 1,
                resource: this.positionAttachment.createView()
            },
            {
                binding: 2,
                resource: this.colorAttachment.createView()
            },
            {
                binding: 3,
                resource: this.normalAttachment.createView()
            },
            {
                binding: 4,
                resource: this.overlayAttachment.createView()
            }],
        });
    }

    Render(renderData)
    {
        let device = this.device;

        device.queue.writeBuffer(this.cameraUniformBuffer, 0, renderData.cameraData);

        const encoder = device.createCommandEncoder();
        
        {
            const shadowmapPass = encoder.beginRenderPass({
                colorAttachments: [],
                depthStencilAttachment: {
                    view: this.shadowmapAttachment.createView(),
            
                    depthClearValue: 1.0,
                    depthLoadOp: 'clear',
                    depthStoreOp: 'store',
                },
            });
            shadowmapPass.setBindGroup(0, this.globalShadowmapBindGroup);
        
            let instanceOffset = 0;    

            shadowmapPass.setPipeline(this.shadowmapPipeline);
            for (let i = 0; i < renderData.instanceBatches.length; i++)
            {
                let b = renderData.instanceBatches[i];
                if(b.count > 0)
                {
                    shadowmapPass.setVertexBuffer(0, this.resourceCache.vertexBuffers[b.mesh]);
                    shadowmapPass.setIndexBuffer(this.resourceCache.indexBuffers[b.mesh], "uint32");
                    shadowmapPass.drawIndexed(this.resourceCache.indexLength[b.mesh], b.count, 0, 0, instanceOffset);  
                    
                    instanceOffset += b.count;
                }
            }
        
            shadowmapPass.end();
        }

        {
            const geometryPass = encoder.beginRenderPass({
                colorAttachments: [
                {
                    view: this.positionAttachment.createView(),
                    clearValue: { r: 0, g: 0, b: 0, a: 1 },
                    loadOp: "clear",
                    storeOp: "store",
                },
                {
                    view: this.colorAttachment.createView(),
                    clearValue: { r: 0.1, g: 0.4, b: 0.8, a: 1 },
                    loadOp: "clear",
                    storeOp: "store",
                },
                {
                    view: this.normalAttachment.createView(),
                    clearValue: { r: 0, g: 0, b: 0, a: 1 },
                    loadOp: "clear",
                    storeOp: "store",
                }],
                depthStencilAttachment: {
                    view: this.depthAttachment.createView(),
            
                    depthClearValue: 1.0,
                    depthLoadOp: 'clear',
                    depthStoreOp: 'store',
                },
            });
            geometryPass.setBindGroup(0, this.globalBindGroup);
        
            let instanceOffset = 0;    
            let updateSSBO = false;
            let updateStart = 262144;
            let updateEnd = 0;

            geometryPass.setPipeline(this.pipeline);
            for (let i = 0; i < renderData.instanceBatches.length; i++)
            {
                let b = renderData.instanceBatches[i];
                if(b.count > 0)
                {
  
                    this.transforms.set(b.transforms.subarray(0, 16 * b.count), 16 * instanceOffset);

                    geometryPass.setBindGroup(1, this.resourceCache.materialBindGroups[b.texture]);
                    geometryPass.setVertexBuffer(0, this.resourceCache.vertexBuffers[b.mesh]);
                    geometryPass.setIndexBuffer(this.resourceCache.indexBuffers[b.mesh], "uint32");
                    geometryPass.drawIndexed(this.resourceCache.indexLength[b.mesh], b.count, 0, 0, instanceOffset);  

                    updateSSBO |= b.dirty;
                    if(b.dirty)
                    {
                        if (updateStart > instanceOffset) updateStart = instanceOffset;
                        if (updateEnd < instanceOffset + b.count) updateEnd = instanceOffset + b.count;
                    }
                    
                    instanceOffset += b.count;
                    b.dirty = false;
                }
            }
            if(updateSSBO)
            {
                //console.log('Update', (updateEnd - updateStart));
                device.queue.writeBuffer(this.SSBOUniformBuffer, updateStart * 64, this.transforms, updateStart * 16, (updateEnd - updateStart) * 16);
            }
        
            geometryPass.end();
        }

        {
            const overlayPass = encoder.beginRenderPass({
                colorAttachments: [{
                view: this.overlayAttachment.createView(),
                clearValue: { r: 0, g: 0, b: 0, a: 0 },
                loadOp: "clear",
                storeOp: "store",
                }],
                depthStencilAttachment: {
                    view: this.depthAttachment.createView(),
            
                    depthClearValue: 1.0,
                    depthLoadOp: 'load',
                    depthStoreOp: 'discard',
                },
            });

            
            if(this.particleSystem.particleCount > 0)
            {
                device.queue.writeBuffer(this.ParticleSSBOUniformBuffer, 0, this.particleSystem.particleGPUBuffer, 0, this.particleSystem.particleCount * this.particleSystem.PARTICLE_SIZE);
                
                overlayPass.setBindGroup(0, this.globalBillboardBindGroup);
                overlayPass.setBindGroup(1, this.BillboardBindGroup);
                overlayPass.setPipeline(this.billboardPipeline);
                overlayPass.draw(6, this.particleSystem.particleCount, 0, 0, 0);
            }
            
            if(this.fontGenerator.dirty == true)
            {
                device.queue.writeBuffer(this.quadVertexBuffer, /*bufferOffset=*/0, this.fontGenerator.quadVertices, 0, 4 * this.fontGenerator.vertexSize * this.fontGenerator.indIndex);
                this.fontGenerator.dirty = false;
            }

            if(this.fontGenerator.indIndex > 0)
            {
                overlayPass.setBindGroup(0, this.globalFontBindGroup);
                overlayPass.setPipeline(this.fontPipeline);
                overlayPass.setBindGroup(1, this.fontBindGroup);
                overlayPass.setVertexBuffer(0, this.quadVertexBuffer);
                overlayPass.setIndexBuffer(this.quadIndexBuffer, "uint32");
                overlayPass.drawIndexed(this.fontGenerator.indIndex * 1.5, 1, 0, 0, 0);
            }

            overlayPass.end();
        }

        {
            const finalCompositionPass = encoder.beginRenderPass({
                colorAttachments: [{
                view: this.context.getCurrentTexture().createView(),
                clearValue: { r: 0.1, g: 0.4, b: 0.8, a: 1 },
                loadOp: "clear",
                storeOp: "store",
                }],
            });

            
            finalCompositionPass.setBindGroup(0, this.globalPresentBindGroup);
            finalCompositionPass.setBindGroup(1, this.finalCompositionBindGroup);
            finalCompositionPass.setPipeline(this.finalCompositionPipeline);
            finalCompositionPass.setVertexBuffer(0, this.quadVertexBuffer);
            finalCompositionPass.draw(6, 1, 0, 0, 0);

            finalCompositionPass.end();
        }

        device.queue.submit([encoder.finish()]);
    }
}