
export function createTexture(device, imageBitmap)
{
    let tex = device.createTexture({
        size: [imageBitmap.width, imageBitmap.height, 1],
        format: 'rgba8unorm',
        usage:
            GPUTextureUsage.TEXTURE_BINDING |
            GPUTextureUsage.COPY_DST |
            GPUTextureUsage.RENDER_ATTACHMENT,
        });
        device.queue.copyExternalImageToTexture(
        { source: imageBitmap },
        { texture: tex },
        [imageBitmap.width, imageBitmap.height]
        );

    return tex;
}
