@echo off
cls
adb devices
adb devices
adb kill-server
adb kill-server
adb devices
echo.
echo Please disconnect and then reconnect device now...
pause
echo.
adb devices
echo.
echo All should be good now?
choice /C QYN /N /T 10 /D N /M "Press 'Q' to quit"