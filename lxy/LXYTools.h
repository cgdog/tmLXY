#include <fstream>
#include <string>
#include <iostream>

using namespace std;

namespace LXY
{
	string readFile(const string& filePath)
	{
		ifstream fin(filePath);
		if (!fin)
		{
			cerr << "read file error. File path: " << filePath << endl;
		}
		return string(istreambuf_iterator<char>(fin), istreambuf_iterator<char>());
	}
};