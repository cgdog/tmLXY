#version 450 core

in vec2 texCoord;
out vec4 FragColor;

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

float spline(float x, float knots[13])
{
    int nknots = knots.length();
    int span;
    int nspans = nknots - 3;
    vec4 coef;
    vec4 knotsSelected;

    if (nspans < 1) // illegal
    {
        return 0.0f;
    }

    x = clamp(x, 0, 1) * nspans;
    span = int(floor(x));
    span = min(span, nspans);

    x -= span;

    for (int i = 0; i < 4; ++i)
    {
        knotsSelected[i] = knots[i+span];
    }

    coef = coeffs * knotsSelected;

    return ((coef[0] * x + coef[1]) * x + coef[2]) * x + coef[3];
}

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

void main()
{
    float Ka = 1.0f;
    float Kd = 0.8f;
    float Ks = 0.2f;

    vec3 ambient = vec3(0.2f, 0.2f, 0.2f);

    vec3 lightDir = normalize(vec3(0.3f, 0.9f, 1.f));

    float textureScale = 2.5f;

    vec3 position = vec3(texCoord * 2.0f - 1.0f, 0.0f) * 10.0f;
    vec3 normal = normalize(vec3(texCoord * 2.0f - 1.0f, 1.0f));

    float marble = 0.0f;
    float f = 1.0f;
    int noiseNum = 4;

    for (int i = 0; i < noiseNum; i += 1)
    {
        //marble  += noise1(position.x * position.y * f) / f;
        marble  += texCoord.x * texCoord.y;
        f *= 2.17f;
    }

    FragColor = vec4(vec3(marble), 1.0f);
    // vec3 textureColor = marbleColor(marble);
    // FragColor = vec4(textureColor *(Ka * ambient + Kd * max(0.0f, dot(lightDir, normal))), 1.0f);
}