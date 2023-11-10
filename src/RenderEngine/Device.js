
export function createTexture(device, imageBitmap, mipsEnabled = false)
{
    let mipLevels = 1;
    if(mipsEnabled)
    {
        mipLevels = Math.floor(Math.log2(Math.min(imageBitmap.width, imageBitmap.height))) + 1;
    }
    let tex = device.createTexture({
        size: [imageBitmap.width, imageBitmap.height, 1],
        mipLevelCount: mipLevels,
        format: 'rgba8unorm',
        usage:
            GPUTextureUsage.TEXTURE_BINDING |
            GPUTextureUsage.COPY_DST |
            GPUTextureUsage.RENDER_ATTACHMENT,
        });

    device.queue.copyExternalImageToTexture(
        { source: imageBitmap },
        { texture: tex, mipLevel: 0 },
        [imageBitmap.width, imageBitmap.height]
    );

    for(let mip = 1; mip < mipLevels; mip++)
    {
        const w = imageBitmap.width / 2 ** mip;
        const h = imageBitmap.height / 2 ** mip;
        const data = new Uint8Array(w * h * 4);

        for (let y = 0; y < h; ++y) {
            for (let x = 0; x < w; ++x) {
                data[4 * (x + y * w) + 0] = 0;
                data[4 * (x + y * w) + 1] = 255;
                data[4 * (x + y * w) + 2] = 0;
                data[4 * (x + y * w) + 3] = 255;
            }
        }
        device.queue.writeTexture(
            { texture: tex, mip },
            data,
            { bytesPerRow: w * 4 },
            [w, h]
          );
    }

    return tex;
}
