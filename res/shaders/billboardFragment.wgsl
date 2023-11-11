
struct FragmentInput {
    @location(0) texCoord: vec2f,
    @location(1) color: vec3f,
};

struct FragmentOutput {
    @location(0) color: vec4f,
};

@group(1) @binding(0) var textureSampler: sampler;
@group(1) @binding(1) var texture: texture_2d<f32>;

@fragment
fn fragmentMain(input: FragmentInput) -> FragmentOutput
{

    var uv: vec2f = input.texCoord;
    var sampledColor: f32 = textureSample(texture, textureSampler, uv).r;

    var output: FragmentOutput;
    output.color = vec4f(input.color.rgb, sampledColor);
    return output;
}