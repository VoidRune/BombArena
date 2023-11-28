struct FragmentInput {
    @location(0) pos: vec4f,
    @location(1) uv: vec2f,
    @location(2) T: vec3f,
    @location(3) B: vec3f,
    @location(4) N: vec3f,
    @location(5) shadowPos: vec3f,
    @location(6) lightPos: vec3f,
    @location(7) camDir: vec3f,
};


@group(0) @binding(2) var shadowSampler: sampler_comparison;
@group(0) @binding(3) var shadowMap: texture_depth_2d;

@group(1) @binding(0) var textureSampler: sampler;
@group(1) @binding(1) var texture: texture_2d<f32>;
@group(1) @binding(2) var normalTexture: texture_2d<f32>;

struct FragmentOutput {
    @location(0) pos: vec4f,
    @location(1) color: vec4f,
    @location(2) normal: vec4f,
};

const ambientFactor = 0.2;
const specularFactor = 0.2;

@fragment
fn fragmentMain(input: FragmentInput) -> FragmentOutput
{
    // Percentage-closer filtering. Sample texels in the region
    // to smooth the result.
    var visibility = 0.0;
    let oneOverShadowDepthTextureSize = 1.0 / 2048.0;
    for (var y = -1; y <= 1; y++) {
        for (var x = -1; x <= 1; x++) {
            let offset = vec2<f32>(vec2(x, y)) * oneOverShadowDepthTextureSize;

            visibility += textureSampleCompare(
                shadowMap, shadowSampler,
                input.shadowPos.xy + offset, input.shadowPos.z - 0.007
            );
        }
    }
    visibility /= 9.0;

    var normal = input.N;

    var normalSample = textureSample(normalTexture, textureSampler, input.uv).xyz;
    normalSample = normalSample * 2.0 - 1.0;
    let TBN = mat3x3f(input.T, input.B, input.N);
    normal = normalize(TBN * normalSample);
    

    let lambertFactor = max(dot(normalize(input.lightPos - input.pos.xyz), normal), 0.0);
    let lightingFactor = min(ambientFactor + visibility * lambertFactor, 1.0);

    var ambient = textureSample(texture, textureSampler, input.uv) * lightingFactor;
    var specular = pow(max(dot(reflect(normalize(input.camDir), normal), normalize(input.lightPos)), 0.0), 32) * lightingFactor;

    let phong = reflect(-input.lightPos, normal);

    var output: FragmentOutput;
    output.pos = input.pos;
    output.color = vec4f(ambient + specular * specularFactor);
    output.normal = vec4f(normal, 1);

    //if(input.shadowPos.x < 0 || input.shadowPos.x > 1 || input.shadowPos.y < 0 || input.shadowPos.y > 1)
    //{
    //    output.color = vec4f(1);
    //}
    return output;
}