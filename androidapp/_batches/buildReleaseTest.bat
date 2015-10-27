@echo off
cls

cd ..
cd %path_prj%

echo.
echo BUILD: RELEASE_TEST
choice /C YN /N /T 10 /D Y /M "Clean build? (Y/N)"
if errorlevel 2 goto build
goto clean

:clean
call gradlew.bat clean

:build
call gradlew.bat assembleRelease --stacktrace
if errorlevel 1 goto error
if not errorlevel 0 goto error

title Sign app plz
echo.
echo Signing app
echo.
call %JAVA_HOME%\bin\jarsigner -verbose -sigalg MD5withRSA -digestalg SHA1 -keystore ../_keystore/%name_key%.keystore %cd%\app\build\outputs\apk\app-release-unsigned.apk %name_jarsigner_thingie%

echo.
echo Zipaligning apk
echo.
call %zipalign% -f -v 4 %cd%\app\build\outputs\apk\app-release-unsigned.apk %cd%\..\_apks\%name_prj%-release-test.apk
if not errorlevel 0 goto error
if errorlevel 1 goto error

echo.
echo Copy apk to dropbox...
copy %cd%\..\_apks\%name_prj%-release-test.apk D:\Desktop\Drive\Box\__Static\icerrr\tmp_apks\%name_prj%-release-test.apk
if errorlevel 1 goto error
if not errorlevel 0 goto error

echo.
echo Install and run on device...
%androidsdk%platform-tools\adb -d install -r D:\Desktop\Drive\Box\__Static\icerrr\tmp_apks\%name_prj%-release-test.apk
if errorlevel 1 goto error
if not errorlevel 0 goto error
%androidsdk%platform-tools\adb -d shell am start %package%/.%name_act%
if errorlevel 1 goto error
if not errorlevel 0 goto error

goto end

:error
title Error
echo.
echo An error occured :(
pause

:end
title Done
