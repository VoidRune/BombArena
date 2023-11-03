
@group(0) @binding(0) var<uniform> cam: mat4x4<f32>;

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
) -> VertexOutput
{
    var output: VertexOutput;
    output.pos = cam * vec4f(pos, 1);
    output.norm = norm;
    output.uv = uv;
    return output;
}