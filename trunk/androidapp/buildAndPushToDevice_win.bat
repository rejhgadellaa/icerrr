@echo off

:config
set path_prj=com.rejh.icerrr.droidapp
set name_prj=Icerrr
set android_sdk_extras=\Android-sdk-extras\

:findandroidbat
if exist C:\android\android-sdk\tools\android.bat set androidsdk=C:\android\android-sdk\
if exist C:\android\sdk\tools\android.bat set androidsdk=C:\android\sdk\
REM --> Add more paths here :)

:checkandroidbat
if exist %androidsdk% goto clean_stuff
echo.
echo Error: could not locate android.bat
echo Please edit this batch file and under 'findandroidbat' add the path to your copy of [android-sdk]/tools/android.bat
goto error

:clean_stuff
set projcd=%cd%
echo.
echo Updating libraries...
echo.
cd %android_sdk_extras%google\google_play_services\libproject\google-play-services_lib
call %androidsdk%tools\android.bat update project -p %cd% -s -t 1
cd %android_sdk_extras%android\support\v7\appcompat
call %androidsdk%tools\android.bat update project -p %cd% -s -t 1
cd %android_sdk_extras%android\support\v7\mediarouter
call %androidsdk%tools\android.bat update project -p %cd% -s -t 1
cd %projcd%

:sdkfound
cd %path_prj%
echo.
echo Updating project
echo.
call %androidsdk%tools\android.bat update project -p %cd% -s -t 1
if not errorlevel 0 goto error

:askifcleanbuild
echo.
echo Run a clean build (this will take longer)?
choice /C YN /N /T 3 /D N /M "(Y/N)"
if errorlevel 2 goto buildincr
if errorlevel 1 goto buildclean
goto error

:buildincr
echo.
echo Building project (INCR)
echo.
call ant -S debug
REM ant -S debug
if not errorlevel 0 goto error
goto installapp

:buildclean
echo.
echo Building project (CLEAN)
echo.
call ant clean debug
REM ant -S debug
if not errorlevel 0 goto error
goto installapp

REM pause

:installapp
echo.
echo Installing app...
echo.

REM C:\Android\android-sdk\platform-tools\adb -d uninstall org.z25.weckerapp
REM if not errorlevel 0 goto error

%androidsdk%platform-tools\adb -d install -r bin\%name_prj%-debug.apk
if not errorlevel 0 goto error

%androidsdk%platform-tools\adb -d shell am start %path_prj%/.%name_prj%
if not errorlevel 0 goto error
goto end

:error
echo.
echo Error!
goto end

:end
cd ..
echo.
pause