
export function createTexture(device, image, mipsEnabled = true)
{
    let mipLevels = 1;
    if(mipsEnabled)
    {
        mipLevels = Math.floor(Math.log2(Math.min(image.width, image.height))) + 1;
    }
    let tex = device.createTexture({
        size: [image.width, image.height],
        mipLevelCount: mipLevels,
        format: 'rgba8unorm',
        usage:
            GPUTextureUsage.TEXTURE_BINDING |
            GPUTextureUsage.COPY_DST |
            GPUTextureUsage.RENDER_ATTACHMENT,
        });

        
    //device.queue.copyExternalImageToTexture(
    //    { source: imageBitmap, flipY: true },
    //    { texture: tex, mipLevel: 0 },
    //    [imageBitmap.width, imageBitmap.height]
    //);

    device.queue.writeTexture(
        { texture: tex, mipLevel: 0 },
        image.data,
        { bytesPerRow: image.width * 4 },
        [image.width, image.height]
    );

    let lastMip = image.data;

    for(let mip = 1; mip < mipLevels; mip++)
    {
        const lw = image.width / 2 ** (mip - 1);

        const w = image.width / 2 ** mip;
        const h = image.height / 2 ** mip;
        let data = new Uint8Array(w * h * 4);

        for (let y = 0; y < h; ++y) {
            for (let x = 0; x < w; ++x) {
                let x0 = x * 2;
                let y0 = y * 2;
                let x1 = x * 2 + 1;
                let y1 = y * 2 + 1;
                data[4 * (x + y * w) + 0] = (lastMip[4 * (x0 + y0 * lw) + 0] + lastMip[4 * (x1 + y0 * lw) + 0] + lastMip[4 * (x0 + y1 * lw) + 0] + lastMip[4 * (x1 + y1 * lw) + 0]) / 4;
                data[4 * (x + y * w) + 1] = (lastMip[4 * (x0 + y0 * lw) + 1] + lastMip[4 * (x1 + y0 * lw) + 1] + lastMip[4 * (x0 + y1 * lw) + 1] + lastMip[4 * (x1 + y1 * lw) + 1]) / 4;
                data[4 * (x + y * w) + 2] = (lastMip[4 * (x0 + y0 * lw) + 2] + lastMip[4 * (x1 + y0 * lw) + 2] + lastMip[4 * (x0 + y1 * lw) + 2] + lastMip[4 * (x1 + y1 * lw) + 2]) / 4;
                data[4 * (x + y * w) + 3] = (lastMip[4 * (x0 + y0 * lw) + 3] + lastMip[4 * (x1 + y0 * lw) + 3] + lastMip[4 * (x0 + y1 * lw) + 3] + lastMip[4 * (x1 + y1 * lw) + 3]) / 4;
                
                //data[4 * (x + y * w) + 0] = lastMip[4 * (x0 + y0 * lw) + 0];
                //data[4 * (x + y * w) + 1] = lastMip[4 * (x0 + y0 * lw) + 1];
                //data[4 * (x + y * w) + 2] = lastMip[4 * (x0 + y0 * lw) + 2];
                //data[4 * (x + y * w) + 3] = lastMip[4 * (x0 + y0 * lw) + 3];
            }
        }

        device.queue.writeTexture(
            { texture: tex, mipLevel: mip },
            data,
            { bytesPerRow: w * 4 },
            [w, h]
        );

        lastMip = data;
    }

    return tex;
}
