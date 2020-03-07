#version 450 core

in vec2 texCoord;
out vec4 FragColor;

float brickWidth = 0.25f;
float brickHeight = 0.08f;
float mortarThickness = 0.01f;

float bmWidth = brickWidth + mortarThickness;
float bmHeight = brickHeight + mortarThickness;
float mwRatio = 0.5f * mortarThickness / bmWidth;
float mhRatio = 0.5f * mortarThickness / bmHeight;

vec3 brickColor = vec3(0.5f, 0.15f, 0.14f);
vec3 mortarColor = vec3(0.5f, 0.5f, 0.5f);

// for lighting
vec3 position = vec3(texCoord * 2.0f - 1.0f, 0.0f);
vec3 originalNormal = normalize(vec3(position.xy, 1.0f)); // 原始法线，指向正z轴的方向
float Ka = 1.0f;
float Kd = 1.0f;
vec3 ambient = vec3(0.1f, 0.1f, 0.1f); // 环境光

vec3 lightDir = normalize(vec3(0.3f, 0.9f, 1.f)); // 平行光照射的方向为-lightDir

vec3 calculateNormal(vec3 pos)
{
    return normalize(cross(dFdxFine(pos), dFdyFine(pos)));
}

float integral(float pos, float ratio)
{
    return floor(pos) * (1-2*ratio) + max(0.0f, fract(pos)-ratio);
}

void main()
{
    float x = texCoord.x / bmWidth;
    float y = texCoord.y / bmHeight;

    x += 0.5f * step(0.5f, fract(y * 0.5f));
    
    float xwidth = fwidth(x); // filter width
    float ywidth = fwidth(y);

    x = fract(x);
    y = fract(y);

    // float w = step(mwRatio, x) - step(1.0f - mwRatio, x);
    // float h = step(mhRatio, y) - step(1.0f - mhRatio, y);
    
    float w = (integral(x + xwidth, mwRatio) - integral(x, mwRatio)) / xwidth;
    float h = (integral(y + ywidth, mhRatio) - integral(y, mhRatio)) / ywidth;

    vec3 textureColor = mix(mortarColor, brickColor, w * h);

    float xBump = smoothstep(0.0f, mwRatio, x) - smoothstep(1-mwRatio, 1.0f, x);
    float yBump = smoothstep(0.0f, mhRatio, y) - smoothstep(1-mhRatio, 1.0f, y);
    float bump = xBump * yBump;

    vec3 bumpedNormal = calculateNormal(position + originalNormal * bump);
    
    vec3 color = textureColor * (Ka * ambient + Kd * max(0.0f, dot(bumpedNormal, lightDir))); // 引入环境光和漫反射光

    FragColor = vec4(color, 1.0f);
}