struct FragmentInput {
    @location(0) norm: vec3f,
    @location(1) uv: vec2f,
};

@group(1) @binding(0) var mySampler: sampler;
@group(1) @binding(1) var texture: texture_2d<f32>;

@fragment
fn fragmentMain(input: FragmentInput) -> @location(0) vec4f 
{
    var color : vec4f = textureSample(texture, mySampler, input.uv);
    //return vec4f(input.norm, 1);
    return color;
}