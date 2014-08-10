@echo off

:config
set path_prj=com.rejh.icerrr.droidapp
set name_prj=Icerrr
set name_key=icerrr
set name_jarsigner_thingie=icerrr

:findandroidbat
if exist C:\android\android-sdk\tools\android.bat set androidsdk=C:\android\android-sdk\
if exist C:\android\sdk\tools\android.bat set androidsdk=C:\android\sdk\
REM --> Add more paths here :)

:checkandroidbat
if exist %androidsdk% goto sdkfound
echo.
echo Error: could not locate android.bat
echo Please edit this batch file and under 'findandroidbat' add the path to your copy of [android-sdk]/tools/android.bat
goto error

:sdkfound
:checklist
echo.
echo Checklist:
echo  - Incement versioncode in AndroidManifest.xml ?
echo.
choice /C YN /N /T 10 /D Y /M "Ready? (Y/N)"
if errorlevel 2 goto end

cd %path_prj%

echo.
echo Updating project
echo.
call %androidsdk%tools\android.bat update project -p %cd% -s -t 1

echo.
echo Building project
echo.
call ant clean release

echo.
echo Signing app
echo.
call %JAVA_HOME%\bin\jarsigner -verbose -sigalg MD5withRSA -digestalg SHA1 -keystore ../_keystore/%name_key%.keystore bin\%name_prj%-release-unsigned.apk %name_jarsigner_thingie%

echo.
echo Zipaligning apk
echo.
call %androidsdk%tools\zipalign -f -v 4 %cd%\bin\%name_prj%-release-unsigned.apk %cd%\..\_apks\%name_prj%.apk


echo.
echo You can now upload _apks/ScreenDoodle.apk to the Play Store!
echo.
choice /C YN /N /T 10 /D N /M "Install app on phone? (Y/N)"
if errorlevel 2 goto end

:install_app
%androidsdk%\platform-tools\adb -d install -r %cd%\..\_apks\%name_prj%.apk
if not errorlevel 0 goto error

%androidsdk%\platform-tools\adb -d shell am start %path_prj%/.%name_prj%
if not errorlevel 0 goto error
pause
goto end

:error
echo.
echo Error! Aborted build.
echo.
pause
goto end

:end
cd ..
echo.
REM pause