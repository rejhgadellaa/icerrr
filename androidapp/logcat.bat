@echo off
cls
title LOGCAT

:findandroidsdk
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
choice /C 12 /N /T 10 /D 1 /M "Show (1) CordovaLog or (2) Chromium?"
if errorlevel 2 goto initlogcat_chromium
goto initlogcat_cordovalog

:initlogcat_chromium
REM call %androidsdk%platform-tools\adb logcat -s CordovaLog
call %androidsdk%platform-tools\adb logcat -s chromium
goto end

:initlogcat_cordovalog
call %androidsdk%platform-tools\adb logcat -s CordovaLog
REM call %androidsdk%platform-tools\adb logcat -s chromium
goto end

:end
pause
