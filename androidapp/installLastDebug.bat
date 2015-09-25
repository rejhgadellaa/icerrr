@echo off

:config
set path_prj=com.rejh.icerrr.itson
set name_prj=Icerrr
set android_sdk_extras=\Android-sdk-extras\

:findandroidbat
if exist C:\android\android-sdk\tools\android.bat set androidsdk=C:\android\android-sdk\
if exist C:\android\sdk\tools\android.bat set androidsdk=C:\android\sdk\

:checkandroidbat
if exist %androidsdk% goto installapp
echo.
echo Error: could not locate android.bat
echo Please edit this batch file and under 'findandroidbat' add the path to your copy of [android-sdk]/tools/android.bat
goto error

:installapp
echo.
echo Installing app...
echo.

%androidsdk%platform-tools\adb devices
%androidsdk%platform-tools\adb -d install -r _apks\%name_prj%-debug.apk
if not errorlevel 0 goto error

%androidsdk%platform-tools\adb -d shell am start %path_prj%/.%name_prj%
if not errorlevel 0 goto error

goto end

:error
echo.
echo Error!
echo.
pause
goto end

:end
cd ..
echo.
choice /C QYN /N /T 10 /D N /M "Press 'Q' to quit"