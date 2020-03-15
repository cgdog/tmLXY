#version 450

in vec2 texCoord;
out vec4 fragColor;
uniform vec2 iResolution;

vec3 finalColor;

const float EPSILON = .0001;
const float SIZE_RATIO = iResolution.y/iResolution.x; // 窗口高宽比。

/////////////////// begin modeling ////////////////////
// 球建模(利用sdf, 即signed distance function)
float sdfSphere(vec3 point, vec3 center = vec3(0.), float r = .26)
{
	return length(point - center) - r;
}

// 长方体建模
float boxSDF(vec3 p, vec3 center = vec3(.0, .0, .2), vec3 size = vec3(.13, .13, .13)) {
    vec3 d = abs(p - center) - size;
    
    float insideDistance = min(max(d.x, max(d.y, d.z)), 0.0);
    
    float outsideDistance = length(max(d, 0.0));
    
    return insideDistance + outsideDistance;
}

float unionSDF(float a, float b)
{
	return min(a, b);
}

float intersetSDF(float a, float b)
{
	return max(a, b);
}

float differenceSDF(float a, float b)
{
	return max(a, -b);
}

// 场景建模
float sdfScene(vec3 point)
{
	float sphere = sdfSphere(point);
	float box = boxSDF(point);
	//float box = boxSDF(point, vec3(0.));
	//return sphere;
	//return box;
	return differenceSDF(sphere, box);
	//return unionSDF(sphere, box);
	//return intersetSDF(sphere, box);
}

///////////////// end modeling ////////////////////////


//////////////// begin lighting /////////////////
// 利用梯度估算表面点p处的法线
vec3 estimateNormal(vec3 p)
{
	return normalize(vec3(
		sdfScene(vec3(p.x + EPSILON, p.y, p.z)) - sdfScene(vec3(p.x - EPSILON,p.y, p.z)),
		sdfScene(vec3(p.x, p.y + EPSILON, p.z)) - sdfScene(vec3(p.x, p.y - EPSILON, p.z)),
		sdfScene(vec3(p.x, p.y, p.z + EPSILON)) - sdfScene(vec3(p.x, p.y, p.z - EPSILON))
	));
}

// 光照计算
vec3 lighting(vec3 point, vec3 normal, vec3 eyePos, vec3 lightPos = vec3(0., .5, .9), 
	vec3 surfaceColor = vec3(.4, .3,.1), vec3 specularColor = vec3(1., 1., 1.), 
	vec3 ambient = vec3(.2), float ka = 1., float kd = 1., float ks = 1., float shiness = 25.)
{
	vec3 color = ka * ambient * surfaceColor;

	vec3 lightDir = normalize(lightPos - point);
	vec3 viewDir = normalize(eyePos - point);
	vec3 halfDir = normalize(lightDir + viewDir);

	float diffuse = dot(lightDir, normal);
	if (diffuse <= 0.)
	{
		return color;
	}
	color += diffuse * surfaceColor * kd;


//	float lightVisibility = step(0., diffuse);
//	//float lightVisibility = smoothstep(-EPSILON, EPSILON, diffuse);
//	color += lightVisibility * diffuse * surfaceColor * kd;

	float specular = dot(halfDir, normal);
	if (specular <= 0.)
	{
		return color;
	}
	color += pow(specular, shiness) * specularColor * ks;

//	float specularVisibility = step(0, specular);
//	//float specularVisibility = smoothstep(-EPSILON, EPSILON, specular);
//	specular = pow(specular, shiness);
//	color += lightVisibility * specularVisibility * specularColor * specular * ks;

	return color;
}

// 指定表面的颜色
vec3 lightingWithSurfaceColor(vec3 point, vec3 normal, vec3 eyePos, vec3 surfaceColor)
{
	return lighting(point, normal, eyePos, vec3(0., .5, .9), surfaceColor);
}

/////////////// end lighting ////////////////////

///////////// begin rendering (ray marching) ////////////////

// 返回view space下的视线方向(即相机空间，此时相机位于原点)
// fov 垂直视角  pos是当前fragment的坐标
vec3 viewDir(float fov, vec2 pos)
{
	vec2 xy = pos - vec2(.5, 0.5 * SIZE_RATIO);
	float z = .5 / tan(radians(fov/2.));
	return vec3(xy, -z);
}

// 把view space下的视线变换到世界空间下的矩阵，
// 即view matrix的逆阵，但由于是作用视向量，不受平移影响，可以计算左上角的3阶方阵
// 又view matrix左上角的3阶方程是正交矩阵，其逆阵等于其转置矩阵
mat3 getViewToWorldMatrix(vec3 eye, vec3 target = vec3(0.), vec3 _up = vec3(0., 1., 0.))
{
	vec3 view = normalize(eye - target);
	vec3 right = normalize(cross(_up, view));
	vec3 up = cross(view, right);

	return mat3(right, up, view);
}

// 从相机出发沿着当前射线方向移动直到找到与表面的交点，或达到最大移动距离，或达到最大迭代次数。
float rayMarching(vec3 eyePos, vec3 viewRay, float initDist, float maxDist, int maxStep)
{
	float depth = initDist;
	for (int i = 0; i < maxStep; ++i)
	{
		vec3 point = eyePos + viewRay * depth;
		float dist = sdfScene(point);
		if (dist < EPSILON)
		{
			return depth;
		}

		depth += dist;

		if (depth > maxStep)
		{
			return maxDist;
		}
	}

	return maxDist;
}

///////////// end rendering (ray marching) ////////////////

//////////// begin noise ////////////////
vec3 random3( vec3 p )	
{
	p = vec3( dot(p,vec3(127.1,311.7, 74.7)),
			  dot(p,vec3(269.5,183.3,246.1)),
			  dot(p,vec3(113.5,271.9,124.6)));

	return -1.0 + 2.0*fract(sin(p)*43758.5453123);
}

float noise3d( in vec3 p )
{
    vec3 i = floor( p );
    vec3 f = fract( p );
	
	vec3 u = f*f*(3.0-2.0*f);

    return mix( mix( mix( dot( random3( i + vec3(0.0,0.0,0.0) ), f - vec3(0.0,0.0,0.0) ), 
                          dot( random3( i + vec3(1.0,0.0,0.0) ), f - vec3(1.0,0.0,0.0) ), u.x),
                     mix( dot( random3( i + vec3(0.0,1.0,0.0) ), f - vec3(0.0,1.0,0.0) ), 
                          dot( random3( i + vec3(1.0,1.0,0.0) ), f - vec3(1.0,1.0,0.0) ), u.x), u.y),
                mix( mix( dot( random3( i + vec3(0.0,0.0,1.0) ), f - vec3(0.0,0.0,1.0) ), 
                          dot( random3( i + vec3(1.0,0.0,1.0) ), f - vec3(1.0,0.0,1.0) ), u.x),
                     mix( dot( random3( i + vec3(0.0,1.0,1.0) ), f - vec3(0.0,1.0,1.0) ), 
                          dot( random3( i + vec3(1.0,1.0,1.0) ), f - vec3(1.0,1.0,1.0) ), u.x), u.y), u.z );
}

//////////// end noise ////////////////

/////////// begin marble //////////////

vec3 paleBlue = vec3(0.25f, 0.25f, 0.35f);
vec3 mediumBlue = vec3(0.10f, 0.10f, 0.30f);
vec3 darkBlue = vec3(0.05f, 0.05f, 0.26f);
vec3 darkerBlue = vec3(0.03f, 0.03f, 0.20f);

vec3 knots[] = {
    paleBlue, paleBlue,
    mediumBlue, mediumBlue, mediumBlue,
    paleBlue, paleBlue,
    darkBlue, darkBlue,
    darkerBlue, darkerBlue,
    paleBlue, darkerBlue
};

mat4 coeffs = mat4(
    vec4(-0.5f, 1.0f, -0.5f, 0.0f),
    vec4(1.5f, -2.5f, 0.0f, 1.0f),
    vec4(-1.5f, 2.0f, 0.5f, 0.0f),
    vec4(0.5f, -0.5f, 0.0f, 0.0f)
);

vec3 spline(float x, vec3 knots[13])
{
    int nknots = knots.length();
    int span;
    int nspans = nknots - 3;
    vec4 coef;
    vec3 color;
    vec3 knotsSelected[4];

    if (nspans < 1) // illegal
    {
        return vec3(0.0f);
    }

    x = clamp(x, 0, 1) * nspans;
    span = int(floor(x));
    span = min(span, nspans);

    x -= span;

    for (int i = 0; i < 4; ++i)
    {
        knotsSelected[i] = knots[i+span];
    }

    for (int i = 0; i < 3; ++i)
    {
        coef = coeffs * vec4(knotsSelected[0][i], knotsSelected[1][i], knotsSelected[2][i], knotsSelected[3][i]);
        color[i] = ((coef[0] * x + coef[1]) * x + coef[2]) * x + coef[3];
    }
    

    return color;
}

vec3 marbleColor(float m)
{
    return spline(
            clamp(2 * m + 0.75f, 0, 1.0f),
            knots
        );
}

vec3 marbleTexturing(vec3 pos)
{
	float marble = 0.0f;
    float f = 1.0f;
    int noiseNum = 4;

    for (int i = 0; i < noiseNum; i += 1)
    {
        marble  += noise3d(pos * f) / f;
        f *= 2.17f;
    }

	return marbleColor(marble);
}
/////////// end marble //////////////



void main()
{
	float initDist = 0.;
	float maxDist = 10.;
	int maxStep = 100;
	vec2 pos2D = vec2(texCoord.x, texCoord.y * SIZE_RATIO);
	vec3 viewRay = viewDir(45., pos2D);

	//vec3 eyePos = vec3(0., 0., .9);
	//vec3 eyePos = vec3(0., 0., 1.9);
	//vec3 eyePos = vec3(.3, .2, 1.1);
	//vec3 eyePos = vec3(.4, 0.4, .6); // for box
	vec3 eyePos = vec3(-.3, .2, .9);
	
	mat3 v2wMatrix = getViewToWorldMatrix(eyePos);
	vec3 worldViewDir = normalize(v2wMatrix * viewRay);
	float dist = rayMarching(eyePos, worldViewDir, initDist, maxDist, maxStep);

	if (dist > maxDist - EPSILON) // 射线没有和场景模型相碰撞
	{
		finalColor = vec3(.1);
	}
	else // 当前fragment属于场景模型的表面点，渲染场景物体
	{
		vec3 surfacePoint = eyePos + worldViewDir * dist;
		vec3 normal = estimateNormal(surfacePoint);

		bool isUseMarble = true; //是否使用大理石纹理
		if (!isUseMarble)
		{
			finalColor = lighting(surfacePoint, normal, eyePos);
			//finalColor = lighting(surfacePoint, normal, eyePos, vec3(-0.5, .5, .9));
			//finalColor += lighting(surfacePoint, normal, eyePos, eyePos + vec3(-1.5, .5, .1));
		}
		else
		{
			// 用大理石作为表面纹理
			//float scalingFractor = 50.;
			float scalingFractor = 25.;
			vec3 surfaceColor = marbleTexturing(surfacePoint * scalingFractor);
			finalColor = lightingWithSurfaceColor(surfacePoint, normal, eyePos, surfaceColor);
		}

		//finalColor = min(vec3(1.), max(vec3(0.), finalColor));
	}
	

	fragColor = vec4(finalColor, 1.);	
}