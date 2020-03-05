#version 450 core

in vec2 texCoord;

vec3 cloudColor = vec3(1.0f, 1.0f, 1.0f);
vec3 skyColor = vec3(0.429f, 0.508f, 0.98f);

out vec4 fragColor;

float i, amplitude, f;
float x, fx, xfreq, xphase;
float y, fy, yfreq, yphase;

float offset = 0.5f;
float xoffset = 13.0f;
float yoffset = 96.0f;

float PI = 3.1415926f;

float SINUSOIDAL_NUMS = 5;

void main()
{
    // vec2 pos = texCoord * 2.0f - 1.0f;
    // x = pos.x * 50 + xoffset;
    // y = pos.y * 50 + yoffset;

    x = texCoord.x * 100 + xoffset;
    y = texCoord.y * 100 + yoffset;

    xphase = 0.9f;
    yphase = 0.7f;
    xfreq = 2.0f * PI * 0.023f;
    yfreq = 2.0f * PI * 0.021f;

    amplitude = 0.3f;
    f = 0.0f;

    for (i = 0; i < SINUSOIDAL_NUMS; i += 1.0f)
    {
        fx = amplitude * (offset + cos(xfreq * (x + xphase)));
        fy = amplitude * (offset + cos(yfreq * (y + yphase)));

        f += fx * fy;

        xphase = PI / 2.0f * 0.9f * cos(yfreq * y);
        yphase = PI / 2.0f * 1.1f * cos(xfreq * x);

        xfreq *= 1.9f + i * 0.1f;
        yfreq *= 2.2f - i * 0.08f;
        amplitude *= 0.707f;
    }

    f = clamp(f, 0.0f, 1.0f);

    vec3 finalColor = mix(skyColor, cloudColor, f);

    fragColor = vec4(finalColor, 1.0f);
    //fragColor = vec4(f, f, f, 1.0f);
}