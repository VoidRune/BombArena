
struct VertexOutput {
    @location(0) uv: vec2f,
    
    @builtin(position) pos: vec4f,
};

const pos = array<vec4<f32>, 6>(
    vec4<f32>( -1, -1, 0, 1 ),
    vec4<f32>( -1,  1, 0, 0 ),
    vec4<f32>(  1,  1, 1, 0 ),
    vec4<f32>(  1,  1, 1, 0 ),
    vec4<f32>(  1, -1, 1, 1 ),
    vec4<f32>( -1, -1, 0, 1 )
);

@vertex
fn vertexMain(
    @builtin(vertex_index) id: u32,
) -> VertexOutput
{
    var output: VertexOutput;
    output.pos = vec4f(pos[id].xy, 0, 1);
    output.uv = pos[id].zw;
    return output;
}