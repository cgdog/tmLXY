#version 450 core

in vec2 texCoord;
out vec4 fragColor;
uniform vec2 iResolution;
const float SIZE_RATIO = iResolution.y / iResolution.x;
vec2 coord2d = vec2(texCoord.x, texCoord.y * SIZE_RATIO);
const float EPSILON = .0001;

vec3 finalColor;

////////// models ///////

float sdSphere(vec3 p, vec3 center = vec3(0.), float r = 1.)
{
	return length(p - center) - r;
}

float sdPlane( vec3 p, vec4 n = vec4(normalize(vec3(0., 0., 1.)), 6))
{
  // n must be normalized
  return dot(p,n.xyz) + n.w;
}

float sdRoundBox( vec3 p, vec3 b, float r )
{
  vec3 q = abs(p) - b;
  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0) - r;
}

float sdBox( vec3 p, vec3 center=vec3(0), vec3 b=vec3(1.) )
{
  vec3 q = abs(p - center) - b;
  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
}

// 长方体建模
float boxSDF(vec3 p, vec3 center = vec3(.0, .0, .2), vec3 size = vec3(1, 1, 1)) {
    vec3 d = abs(p - center) - size;
    
    float insideDistance = min(max(d.x, max(d.y, d.z)), 0.0);
    
    float outsideDistance = length(max(d, 0.0));
    
    return insideDistance + outsideDistance;
}

float sdUnion(float a, float b)
{
	return min(a, b);
}

float sdIntersect(float a, float b)
{
	return max(a, b);
}
float sdDifference(float a, float b)
{
	return max(a, -b);
}

float sdScene(vec3 p)
{
	float sphere = sdSphere(p);
	float plane = sdPlane(p);
	float roundBox = sdRoundBox(p, vec3(1., 1., 1.), .5);
	float box = boxSDF(p);

	//return sphere;
	//return roundBox;
	return box;
	//return sdUnion(sphere, plane);
	//return sdDifference(sphere, plane);
	//return sdDifference(plane, sphere);
	//return sdIntersect(plane, sphere);
}

vec3 estimateNormal(vec3 p)
{
	return normalize(vec3(
		sdScene(vec3(p.x + EPSILON, p.y, p.z)) - sdScene(vec3(p.x - EPSILON,p.y, p.z)),
		sdScene(vec3(p.x, p.y + EPSILON, p.z)) - sdScene(vec3(p.x, p.y - EPSILON, p.z)),
		sdScene(vec3(p.x, p.y, p.z + EPSILON)) - sdScene(vec3(p.x, p.y, p.z - EPSILON))
	));
}

//////// lighting ///////

vec3 basicLighting(vec3 p, vec3 normal, vec3 eyePos, vec3 lightpos = vec3(0.,0., 8.),
	vec3 surfaceColor = vec3(0.8, .6, .4), vec3 specularColor = vec3(1.), 
	vec3 ambientColor = vec3(.25), float shiness = 20.)
{
	vec3 color = ambientColor * surfaceColor;
	vec3 viewDir = normalize(eyePos - p);
	vec3 lightDir = normalize(lightpos - p);

	float diffuse = dot(lightDir, normal);
	if (diffuse > 0)
	{
		color += diffuse * surfaceColor;
		float specular = dot(normalize(viewDir + lightDir), normal);
		if (specular > 0)
		{
			color += pow(specular, shiness) * specularColor;
		}
	}

	return color;
}

//////// camera ////////

vec3 getViewDir(float fov, vec2 pos2D)
{
	vec2 xy = pos2D - vec2(.5, .5 * SIZE_RATIO);
	float z = .5 / tan(radians(fov *.5));
	return vec3(xy, -z);
}

mat3 getInverseViewMatrix(vec3 camera, vec3 target = vec3(0.), vec3 _up = vec3(0., 1., 0.))
{
	vec3 view = normalize(camera - target);
	vec3 right = normalize(cross(_up, view));
	vec3 up = cross(view, right);
	return mat3(right, up, view);
}

//////// ray marching /////////

float rayMarching(vec3 eyePos, vec3 dir, float maxDist = 10., float initDist = 0., int maxStep = 100)
{
	float depth = initDist;
	for (int i = 0; i < maxStep; ++i)
	{
		vec3 point = eyePos + dir * depth;
		float dist = sdScene(point);
		if (dist < EPSILON)
		{
			return depth;
		}

		depth += dist;
		if (depth > maxDist)
		{
			break;
		}
	}
	return maxStep;
}


void main()
{
	vec3 viewDir = getViewDir(45., coord2d);
	vec3 eyePos = vec3(0., 0., 5);
	mat3 inverseViewMat = getInverseViewMatrix(eyePos);
	vec3 worldView = inverseViewMat * viewDir;
	
	float maxDist = 10.;
	float dist = rayMarching(eyePos, worldView, maxDist);
	if (dist > maxDist - EPSILON)
	{
		finalColor = vec3(.3);
	}
	else
	{
		vec3 shadingPoint = eyePos + dist * worldView;
		vec3 normal = estimateNormal(shadingPoint);
		finalColor = basicLighting(shadingPoint, normal, eyePos);
	}

	fragColor = vec4(finalColor, 1.0);
}