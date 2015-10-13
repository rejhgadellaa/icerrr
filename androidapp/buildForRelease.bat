@echo off
title Checking...

:config
set path_prj=com.rejh.icerrr.itson
set name_prj=Icerrr
set name_key=icerrr
set name_jarsigner_thingie=icerrr
set android_sdk_extras=\Android-sdk-extras\

:findandroidbat
if exist C:\android\android-sdk\tools\android.bat set androidsdk=C:\android\android-sdk\
if exist C:\android\sdk\tools\android.bat set androidsdk=C:\android\sdk\
REM --> Add more paths here :)

:checkandroidbat
if exist %androidsdk% goto findzipalign
echo.
echo Error: could not locate android.bat
echo Please edit this batch file and under 'findandroidbat' add the path to your copy of [android-sdk]/tools/android.bat
goto error

:findzipalign
if exist %androidsdk%tools\zipalign.exe set zipalign=%androidsdk%tools\zipalign.exe
if exist %androidsdk%build-tools\20.0.0\zipalign.exe set zipalign=%androidsdk%build-tools\20.0.0\zipalign.exe
if exist %zipalign% goto clean_stuff
echo.
echo Error: could not locate zipalign.exe
goto error

:clean_stuff
title Clean stuff...
set projcd=%cd%
echo.
echo Updating libraries...
echo.
cd %android_sdk_extras%google\google_play_services\libproject\google-play-services_lib
call %androidsdk%tools\android.bat update project -p %cd% -s -t android-23
cd %android_sdk_extras%android\support\v7\appcompat
call %androidsdk%tools\android.bat update project -p %cd% -s -t android-23
cd %android_sdk_extras%android\support\v7\mediarouter
call %androidsdk%tools\android.bat update project -p %cd% -s -t android-23
cd %projcd%

:sdkfound
:checklist
title Ready to go?
echo.
echo Checklist:
echo  - Incement versioncode in AndroidManifest.xml ?
echo.
choice /C YN /N /T 10 /D Y /M "Ready? (Y/N)"
if errorlevel 2 goto end

cd %path_prj%

title Update project..
echo.
echo Updating project
echo.
call %androidsdk%tools\android.bat update project -p %cd% -s -t android-23

title Building..
echo.
echo Building project
echo.
call ant clean release
if errorlevel 1 goto error

title Sign app plz
echo.
echo Signing app
echo.
call %JAVA_HOME%\bin\jarsigner -verbose -sigalg MD5withRSA -digestalg SHA1 -keystore ../_keystore/%name_key%.keystore bin\%name_prj%-release-unsigned.apk %name_jarsigner_thingie%

echo.
echo Zipaligning apk
echo.
call %zipalign% -f -v 4 %cd%\bin\%name_prj%-release-unsigned.apk %cd%\..\_apks\%name_prj%.apk
if not errorlevel 0 goto error
if errorlevel 1 goto error

copy %cd%\..\_apks\%name_prj%.apk D:\Desktop\Dropbox\__Static\icerrr\tmp_apks\%name_prj%.apk

title Install?
echo.
echo You can now upload _apks/ScreenDoodle.apk to the Play Store!
echo.
choice /C YN /N /T 10 /D N /M "Install app on phone? (Y/N)"
if errorlevel 2 goto end

:install_app
title Installing..
%androidsdk%\platform-tools\adb -d install -r %cd%\..\_apks\%name_prj%.apk
if not errorlevel 0 goto error

%androidsdk%\platform-tools\adb -d shell am start %path_prj%/.%name_prj%
if not errorlevel 0 goto error
goto end

:error
title Error!
echo.
echo Error! Aborted build.
echo.
pause
goto end

:end
title Done!
cd ..
echo.
REM pause