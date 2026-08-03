@echo off
echo ================================================
echo   AURA - Android APK Builder
echo ================================================
echo.

REM Step 1: Sync Capacitor
echo [1/3] Syncing Capacitor...
cd /d "%~dp0.."
call npx cap sync android
if %errorlevel% neq 0 (
    echo ERROR: Capacitor sync failed.
    pause
    exit /b 1
)

REM Step 2: Build APK using Gradle
echo.
echo [2/3] Building Debug APK with Gradle...
cd /d "%~dp0"
call gradlew.bat assembleDebug
if %errorlevel% neq 0 (
    echo ERROR: Gradle build failed.
    echo Make sure Android Studio and Java JDK 17+ are installed.
    pause
    exit /b 1
)

REM Step 3: Show output location
echo.
echo [3/3] Build complete!
echo.
echo ================================================
echo   APK Location:
echo   android\app\build\outputs\apk\debug\app-debug.apk
echo ================================================
echo.
echo Transfer this APK to your Android phone and install it.
echo Make sure your phone is on the same WiFi as this PC.
echo.

REM Open the output folder
start "" "%~dp0app\build\outputs\apk\debug"
pause
