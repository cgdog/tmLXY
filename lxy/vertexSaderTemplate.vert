#version 450 core
layout (location = 0) in vec3 aPos;
out vec2 texCoord;
void main()
{
	texCoord = (aPos.xy + vec2(1.0f)) * 0.5f;
    gl_Position = vec4(aPos.x, aPos.y, aPos.z, 1.0f);
}