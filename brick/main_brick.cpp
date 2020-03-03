
#include "../lxy/LXYGLTemplate.h"



const char* fragmentShaderSource = "#version 450 core\n"
"out vec4 FragColor;\n"
"void main()\n"
"{\n"
"   FragColor = vec4(1.0f, 0.5f, 0.2f, 1.0f);\n"
"}\n\0";

int main()
{
	mainCore(fragmentShaderSource);
	return 0;
}