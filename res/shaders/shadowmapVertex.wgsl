

struct CameraData {
    view: mat4x4<f32>,
    projection: mat4x4<f32>,
    invView: mat4x4<f32>,
    invProjection: mat4x4<f32>,
    light: mat4x4<f32>,
};

@group(0) @binding(0) var<uniform> cam: CameraData;
@group(0) @binding(1) var<storage> transforms: array<mat4x4<f32>, 4096>;


@vertex
fn vertexMain(
    @location(0) pos: vec3f,
    @location(1) norm: vec3f,
    @location(2) uv: vec2f,
    @builtin(instance_index) id: u32,
) -> @builtin(position) vec4f
{
    return cam.light * transforms[id] * vec4f(pos, 1);
}