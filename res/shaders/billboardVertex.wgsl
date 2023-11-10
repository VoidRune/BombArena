
struct CameraData {
    view: mat4x4<f32>,
    projection: mat4x4<f32>,
    invView: mat4x4<f32>,
    invProjection: mat4x4<f32>,
    light: mat4x4<f32>,
    lightPos: vec4<f32>,
};

struct Particle
{
    position: vec3f,
	rotation: f32,
	color: vec3f,
	radius: f32,
};

@group(0) @binding(0) var<uniform> cam: CameraData;
@group(0) @binding(1) var<uniform> particles: array<Particle, 512>;


const OFFSETS = array<vec2<f32>, 6>(
    vec2<f32>(-1,-1),
    vec2<f32>(-1, 1),
    vec2<f32>( 1, 1),
    vec2<f32>( 1,-1),
    vec2<f32>(-1,-1),
    vec2<f32>( 1, 1),
);

const POSITIONS = array<vec3<f32>, 6>(
    vec3<f32>(3, 3, 3),
    vec3<f32>(4, 3, 4),
    vec3<f32>(1, 9, 2),
    vec3<f32>(0, 0, 1),
    vec3<f32>(1, 1, 2),
    vec3<f32>(2, 2, 3)
);

struct VertexOutput {
    @location(0) offset: vec2f,
    @location(1) color: vec3f,
    @location(2) pos: vec3f,
    @builtin(position) position: vec4f,
};

@vertex
fn vertexMain( @builtin(vertex_index) Vid: u32, @builtin(instance_index) Iid: u32 ) -> VertexOutput
{
    var p = particles[Iid];
    var billboardPosition: vec3f = p.position;
	var billboardRadius: f32 = p.radius;
	var s: f32 = sin(p.rotation);
    var c: f32 = cos(p.rotation);
	var rotation: mat2x2<f32> = mat2x2<f32>(s,c,c,-s);

    var output: VertexOutput;
    output.offset = OFFSETS[Vid];
    var position = OFFSETS[Vid] * rotation;

	var positionCameraSpace: vec4f = cam.view * vec4f(billboardPosition, 1.0) + billboardRadius * vec4f(position, 0.0, 0.0);
    output.pos = billboardPosition + billboardRadius * vec3f(position, 0.0);
	output.position = cam.projection * positionCameraSpace;
    output.color = p.color;
    return output;
}