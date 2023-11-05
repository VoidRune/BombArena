
struct CameraData {
    view: mat4x4<f32>,
    projection: mat4x4<f32>,
    invView: mat4x4<f32>,
    invProjection: mat4x4<f32>,
};

@group(0) @binding(0) var<uniform> cam: CameraData;

struct VertexOutput {
    @location(0) pos: vec3f,
    @location(1) norm: vec3f,
    @location(2) uv: vec2f,
    
    @builtin(position) position: vec4f,
};

@vertex
fn vertexMain(
    @location(0) pos: vec3f,
    @location(1) norm: vec3f,
    @location(2) uv: vec2f,
) -> VertexOutput
{
    var output: VertexOutput;
    var p = vec4f(pos, 1);
    output.position = cam.projection * cam.view * p;
    output.pos = p.xyz;
    output.norm = norm;
    output.uv = uv;
    return output;
}