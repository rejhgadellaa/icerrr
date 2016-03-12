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


:initlogcat
REM call %androidsdk%platform-tools\adb logcat -s CordovaLog
echo Begin Log:
call adb logcat com.rejh.icerrr.itson:V -s chromium:S
goto end

:end
pause
