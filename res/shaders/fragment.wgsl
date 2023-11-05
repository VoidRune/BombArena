struct FragmentInput {
    @location(0) pos: vec4f,
    @location(1) norm: vec3f,
    @location(2) uv: vec2f,
};

@group(1) @binding(0) var mySampler: sampler;
@group(1) @binding(1) var texture: texture_2d<f32>;

struct FragmentOutput {
    @location(0) pos: vec4f,
    @location(1) color: vec4f,
    @location(2) normal: vec4f,
};

@fragment
fn fragmentMain(input: FragmentInput) -> FragmentOutput
{
    var output: FragmentOutput;
    output.pos = input.pos;
    output.color = textureSample(texture, mySampler, input.uv);
    output.normal = vec4f(input.norm, 1);
    return output;
}