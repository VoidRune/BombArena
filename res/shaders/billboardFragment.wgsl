
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

@fragment
fn fragmentMain(input: FragmentInput) -> FragmentOutput
{

    var uv: vec2f = (input.offset + 1.0) * 0.5;
    var sampledColor: vec4f = vec4f(uv, 0, 1);

    var output: FragmentOutput;
    output.pos = vec4f(input.pos, 0.0);
    output.color = vec4f(input.color, 1.0);
    //output.normal = vec4f(input.norm, 1);

    return output;
}