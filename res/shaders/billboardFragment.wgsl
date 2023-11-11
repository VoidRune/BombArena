
struct FragmentInput {
    @location(0) offset: vec2f,
    @location(1) color: vec3f,
    @location(2) pos: vec3f,
};

struct FragmentOutput {
    @location(0) pos: vec4f,
    @location(1) color: vec4f,
    @location(2) normal: vec4f,
};

@group(1) @binding(0) var textureSampler: sampler;
@group(1) @binding(1) var texture: texture_2d<f32>;

@fragment
fn fragmentMain(input: FragmentInput) -> FragmentOutput
{

    var uv: vec2f = (input.offset + 1.0) * 0.5;
    var sampledColor: f32 = textureSample(texture, textureSampler, uv).r;
    //if(sampledColor <= 0.1)
    //{
    //    discard;
    //}
    var output: FragmentOutput;
    output.pos = vec4f(input.pos, 0.0);
    output.color = vec4f(input.color.rgb, sampledColor);
    //output.normal = vec4f(input.norm, 1);

    return output;
}