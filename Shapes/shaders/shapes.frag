#version 450 core

in vec2 texCoord;
out vec4 FragColor;

vec3 finalColor;

float plot(vec2 pos, float value, float delta=0.02)
{
	return smoothstep(value - delta, value, pos.y) - smoothstep(value, value + delta, pos.y);
}
void drawSin()
{
	vec2 pos = texCoord * 10;
	float y = sin(pos.x)+5.;

	float ratio = plot(pos, y);
	finalColor = mix(vec3(0.), vec3(1.), ratio);
}

void drawLine()
{
	vec2 pos = texCoord;
	float y = pos.x;

	float ratio = plot(pos, y, 0.01);

	vec3 color = vec3(0);
	//vec3 color = vec3(y);
	finalColor = mix(color, vec3(1), ratio);
}

void drawPowerFunc()
{
	vec2 pos = texCoord;
	float y = pow(pos.x, 5.);

	float ratio = plot(pos, y, 0.01);
	finalColor = mix(vec3(0.), vec3(1.), ratio);
}

void drawCubicInterpolationCurve()
{
	vec2 pos = texCoord;
	float x = texCoord.x;
	float y = x*x*(3. - 2.*x);

	float ratio = plot(pos, y, 0.01);
	finalColor = mix(vec3(0.), vec3(1.), ratio);
}

void main()
{
	drawSin();
//	drawLine();
//	drawPowerFunc();
//	drawCubicInterpolationCurve();
	FragColor = vec4(finalColor, 1.);
}