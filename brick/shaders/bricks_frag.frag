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

void main()
{
    float x = texCoord.x / bmWidth;
    float y = texCoord.y / bmHeight;

    x += 0.5f * step(0.5f, fract(y * 0.5f));
    x = fract(x);
    y = fract(y);

    float w = step(mwRatio, x) - step(1.0f - mwRatio, x);
    float h = step(mhRatio, y) - step(1.0f - mhRatio, y);

    vec3 color = mix(mortarColor, brickColor, w * h);

    FragColor = vec4(color, 1.0f);
}