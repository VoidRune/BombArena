
@group(0) @binding(0) var<uniform> cam: mat4x4<f32>;
@group(0) @binding(1) var<storage> transforms: array<mat4x4<f32>, 4096>;

struct VertexOutput {
    @location(0) norm: vec3f,
    @location(1) uv: vec2f,
    
    @builtin(position) pos: vec4f,
};

@vertex
fn vertexMain(
    @location(0) pos: vec3f,
    @location(1) norm: vec3f,
    @location(2) uv: vec2f,
    @builtin(instance_index) id: u32,
) -> VertexOutput
{
    var output: VertexOutput;
    output.pos = cam * transforms[id] * vec4f(pos, 1);
    output.norm = norm;
    output.uv = uv;
    return output;
}