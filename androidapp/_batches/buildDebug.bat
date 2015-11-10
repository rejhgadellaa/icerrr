@echo off
cls

cd ..
cd %path_prj%

echo.
echo BUILD: DEBUG
choice /C YN /N /T 10 /D N /M "Clean build? (Y/N)"
if errorlevel 2 goto build
goto clean

:clean
call gradlew.bat clean

:build
call gradlew.bat assembleDebug --stacktrace
if errorlevel 1 goto error
if not errorlevel 0 goto error

echo.
echo Copy apk to dropbox...
copy %cd%\app\build\outputs\apk\app-debug.apk %drivepath%Box\__Static\icerrr\tmp_apks\%name_prj%-debug.apk
if errorlevel 1 goto error
if not errorlevel 0 goto error

echo.
echo Install and run on device...
%androidsdk%platform-tools\adb -d install -r %cd%\app\build\outputs\apk\app-debug.apk
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
