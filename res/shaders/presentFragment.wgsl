struct FragmentInput {
    @location(0) uv: vec2f,
};

struct CameraData {
    view: mat4x4<f32>,
    projection: mat4x4<f32>,
    invView: mat4x4<f32>,
    invProjection: mat4x4<f32>,
};

@group(0) @binding(0) var<uniform> cam: CameraData;

@group(1) @binding(0) var mySampler: sampler;
@group(1) @binding(1) var positionAttachment: texture_2d<f32>;
@group(1) @binding(2) var colorAttachment: texture_2d<f32>;
@group(1) @binding(3) var normalAttachment: texture_2d<f32>;
@group(1) @binding(4) var overlayAttachment: texture_2d<f32>;

@fragment
@diagnostic(off,derivative_uniformity) fn fragmentMain(input: FragmentInput) -> @location(0) vec4f 
{
	var view = cam.view;
    var position = textureSample(positionAttachment, mySampler, input.uv);
    var color = textureSample(colorAttachment, mySampler, input.uv);
    var normal = textureSample(normalAttachment, mySampler, input.uv);
	var overlay = textureSample(overlayAttachment, mySampler, input.uv);
	var outColor = color * (1 - overlay.a) + overlay;
    var reflectivity = 0.8 * (1 - overlay.a) * (1 - overlay.a);
	//if(normal.y == 1.0)
	//{
	//	reflectivity = 0.4 * (1 - overlay.a) * (1 - overlay.a);
	//}

	//return overlay.aaaa;
	
    if (reflectivity < 0.005)
    {
		return outColor;
	}

    var rayOrigin = vec3f(cam.invView[3][0], cam.invView[3][1], cam.invView[3][2]);
	var rayDirection = position.xyz - rayOrigin;

    var maxDistance: f32 = min(2.5, length(rayDirection) - 1.0);

	var reflectedDirection = normalize(reflect(normalize(rayDirection), normal.xyz));

	var startView = vec4f(position.xyz, 1);
	var endView   = vec4f(position.xyz + (reflectedDirection * maxDistance), 1);

	var endFrag     = cam.projection * cam.view * endView;
		endFrag.x   = endFrag.x / endFrag.w * 0.5 + 0.5;
		endFrag.y   = endFrag.y / endFrag.w * 0.5 + 0.5;
		endFrag.y 	= 1.0 - endFrag.y;
	var startUv = input.uv;
	var endUv = endFrag.xy;

	var sampleCount: f32 = 32.0;
	var dtUv = (endUv - startUv) / sampleCount;
	var dtView = (endView - startView) / sampleCount;
	var stepLen = 2 * sampleCount * length(dtView);
	var currUv = startUv;
	var currPos = startView;

	for(var i = 0; i < i32(sampleCount); i++)
	{
		currUv += dtUv;
		currPos += dtView;

		if(currUv.x < 0 || currUv.x > 1 || currUv.y < 0 || currUv.y > 1)
		{
			return outColor;
		}

		var pos = textureSample(positionAttachment, mySampler, currUv);

		if(pos.x == 0 && pos.y == 0 && pos.z == 0)
		{
			continue;
		}

		var a = pos.xyz - rayOrigin;
		var b = currPos.xyz - rayOrigin;
		var la = a.x * a.x + a.y * a.y + a.z * a.z;
		var lb = b.x * b.x + b.y * b.y + b.z * b.z;
		if(lb >= la && lb - la <= stepLen)
		{
			var reflection = textureSample(colorAttachment, mySampler, currUv);
			return mix(outColor, reflection, reflectivity);
		}
	}

    return outColor;
	
}