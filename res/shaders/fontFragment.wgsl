struct FragmentInput {
    @location(0) uv: vec2f,
};

@group(1) @binding(0) var mySampler: sampler;
@group(1) @binding(1) var texture: texture_2d<f32>;

const pxRange : f32 = 2.0;

fn median(rgb: vec3f) -> f32 {
    return max(min(rgb.r, rgb.g), min(max(rgb.r, rgb.g), rgb.b));
}

fn screenPxRange(uv: vec2f) -> f32 {
    var unitRange : vec2f = vec2f(pxRange)/vec2f(textureDimensions(texture, 0).xy);
    var screenTexSize : vec2f = vec2f(1.0)/uv;
    return max(0.5*dot(unitRange, screenTexSize), 1.0);
}

struct FragmentOutput {
    @location(0) color: vec4f,
};

@fragment
fn fragmentMain(input: FragmentInput) -> FragmentOutput
{
    var bgColor: vec4f = vec4f(0, 0.2, 0.8, 0);
    var fgColor: vec4f = vec4f(0.4, 0.8, 0.2, 1);

    var msd : vec3f = textureSample(texture, mySampler, input.uv).rgb;
    var sd : f32 = median(msd);
    var scrPxDist: f32 = screenPxRange(input.uv)*(sd - 0.5);
    var opacity: f32 = clamp(scrPxDist + 0.5, 0.0, 1.0);

    var edge: f32 = 0.4;
    var borderLen: f32 = 0.2;
    var borderBlend: f32 = (opacity - edge) / borderLen;
    if(borderBlend <= 0.0)
    {
        discard;
    }

    var output: FragmentOutput;
    output.color = mix(bgColor, fgColor, min(borderBlend, 1));
    return output;
}