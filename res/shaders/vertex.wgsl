

struct CameraData {
    view: mat4x4<f32>,
    projection: mat4x4<f32>,
    invView: mat4x4<f32>,
    invProjection: mat4x4<f32>,
    light: mat4x4<f32>,
    lightPos: vec4<f32>,
};

@group(0) @binding(0) var<uniform> cam: CameraData;
@group(0) @binding(1) var<storage> transforms: array<mat4x4<f32>, 4096>;

struct VertexOutput {
    @location(0) pos: vec4f,
    @location(1) uv: vec2f,
    @location(2) T: vec3f,
    @location(3) B: vec3f,
    @location(4) N: vec3f,
    @location(5) shadowPos: vec3f,
    @location(6) lightPos: vec3f,
    @location(7) camDir: vec3f,

    @builtin(position) position: vec4f,
};

@vertex
fn vertexMain(
    @location(0) pos: vec3f,
    @location(1) norm: vec3f,
    @location(2) tang: vec3f,
    @location(3) uv: vec2f,
    @builtin(instance_index) id: u32,
) -> VertexOutput
{
    var output: VertexOutput;
    output.pos = transforms[id] * vec4f(pos, 1);
    output.position = cam.projection * cam.view * output.pos;
    //output.norm = norm;
    //output.tang = tang;
    output.uv = uv;

    output.T = normalize(tang);
    output.N = normalize(norm);
    output.B = cross(output.N, output.T);

    let posFromLight = cam.light * output.pos;
    output.shadowPos = vec3(
    posFromLight.xy * vec2(0.5, -0.5) + vec2(0.5),
    posFromLight.z
    );
    output.lightPos = cam.lightPos.xyz;
    output.camDir = output.pos.xyz - vec3f(cam.invView[3][0], cam.invView[3][1], cam.invView[3][2]);
    return output;
}