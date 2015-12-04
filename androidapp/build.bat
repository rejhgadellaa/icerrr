@echo off
cls

:optimize
if exist c:\python33\python.exe set py3=c:\python33\python.exe
if exist c:\python34\python.exe set py3=c:\python34\python.exe
if exist c:\python35\python.exe set py3=c:\python35\python.exe
if exist %py3% goto pyoptimize

echo.
echo Warning: Cannot run py-optimizer because python3 was not found:
echo %py3%
echo Press 'C' to continue...
choice /C C /N /T 10 /D C
goto setvars

:pyoptimize
cd py-web-optimizer
%py3% optimizer.py
cd ..
goto setvars

REM TODO NOT WORKING?
if errorlevel 0 goto setvars
echo.
echo Warning: Py-optimizer ran into an issue?
echo Press 'C' to continue...
choice /C C /N /T 10 /D C

:setvars
set path_prj=com.rejh.icerrr.itson-as
set package=com.rejh.icerrr.itson
set name_prj=Icerrr
set name_act=Icerrr
set name_key=icerrr
set name_jarsigner_thingie=icerrr
set androidsdk_target=android-23

:finddrivepath
set drivepath=d:\desktop\drive\
if not exist %drivepath% set drivepath=c:\data\desktop\drive\

:findsdk
if exist C:\android\android-sdk1\tools\android.bat set androidsdk=C:\android\android-sdk1\
if exist C:\android\sdk1\tools\android.bat set androidsdk=C:\android\sdk1\
if exist C:\android\android-sdk\tools\android.bat set androidsdk=C:\android\android-sdk\
if exist C:\android\sdk\tools\android.bat set androidsdk=C:\android\sdk\
if not exist %androidsdk% goto err_nosdk

:findzipalign
if exist %androidsdk%tools\zipalign.exe set zipalign=%androidsdk%tools\zipalign.exe
if exist %androidsdk%build-tools\20.0.0\zipalign.exe set zipalign=%androidsdk%build-tools\20.0.0\zipalign.exe
if exist %androidsdk%build-tools\23.0.1\zipalign.exe set zipalign=%androidsdk%build-tools\23.0.1\zipalign.exe
if not exist %zipalign% goto err_nozipalign

:whatdoyouwantodo
echo.
echo Make a choice:
echo 1. Build debug (default)
echo 2. Build release_test
echo 3. Build release
echo 4. Quit
choice /C 1234Q /N /T 10 /D 1
if errorlevel 5 goto stop
if errorlevel 4 goto stop
if errorlevel 3 goto buildrelease
if errorlevel 2 goto buildreleasetest
if errorlevel 1 goto builddebug
goto end

:buildrelease
cd _batches
call buildRelease.bat
goto end

:buildreleasetest
cd _batches
call buildReleaseTest.bat
goto end

:builddebug
cd _batches
call buildDebug.bat
goto end


goto end
:err_nosdk
echo.
echo Error: could not locate android sdk
pause
goto stop

:err_nozipalign
echo.
echo Error: could not locate zipalign
pause
goto stop

:end
echo.
choice /C QYN /N /T 10 /D N /M "Press 'Q' to quit"

:stop