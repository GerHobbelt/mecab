set PLATFORM_PREFIX=
if "%BIULD_TYPE%"=="x64" set PLATFORM_PREFIX=-x64
set _CL_=/utf-8

mkdir dic\ipadic
cd mecab\src
call "C:\Program Files (x86)\Microsoft Visual Studio\2017\Community\VC\Auxiliary\Build\vcvarsall.bat" %BUILD_TYPE%
nmake -f Makefile.%BUILD_TYPE%.msvc
cd ..\..\
mecab\src\mecab-dict-index.exe -d mecab-ipadic -o dic\ipadic -f EUC-JP -t UTF-8

rem Zip mecab binaries and ipadic
cd %APPVEYOR_BUILD_FOLDER%\
copy mecab-ipadic\dicrc dic\ipadic\dicrc
copy mecab-ipadic\*.def dic\ipadic\
copy mecab-ipadic\*.csv dic\ipadic\
7z a mecab-msvc-%BUILD_TYPE%.zip %APPVEYOR_BUILD_FOLDER%\mecab\src\*.dll
7z a mecab-msvc-%BUILD_TYPE%.zip %APPVEYOR_BUILD_FOLDER%\mecab\src\*.exe
7z a mecab-msvc-%BUILD_TYPE%.zip %APPVEYOR_BUILD_FOLDER%\mecab\src\*.lib
7z a mecab-msvc-%BUILD_TYPE%.zip %APPVEYOR_BUILD_FOLDER%\mecab\src\mecab.h
7z a mecab-msvc-%BUILD_TYPE%.zip %APPVEYOR_BUILD_FOLDER%\ci\win\mecabrc
7z a mecab-msvc-%BUILD_TYPE%.zip %APPVEYOR_BUILD_FOLDER%\dic
7z x mecab-msvc-%BUILD_TYPE%.zip -oc:\mecab

cd mecab\python
call :BuildPython C:\Python35%PLATFORM_PREFIX%
call :BuildPython C:\Python36%PLATFORM_PREFIX%
call :BuildPython C:\Python37%PLATFORM_PREFIX%
exit

:BuildPython
%1\python -m pip install wheel || goto :error
%1\python setup.py bdist_wheel || goto :error
rmdir /Q /S build
del /S *.pyd
exit /b

:error
exit /b %errorlevel%