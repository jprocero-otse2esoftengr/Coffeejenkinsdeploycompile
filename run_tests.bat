@echo off
REM Regression Test Runner Script
REM This script helps run regression tests locally for debugging

echo ========================================
echo BuilderUML Regression Test Runner
echo ========================================

REM Check if required files exist
if not exist "jarfiles\RegTestRunner-8.10.5.jar" (
    echo ERROR: RegTestRunner jar not found at jarfiles\RegTestRunner-8.10.5.jar
    echo Please ensure the jar file is in the correct location
    pause
    exit /b 1
)

if not exist "testcase\coffee_service_tests.xml" (
    echo ERROR: Test cases not found at testcase\coffee_service_tests.xml
    echo Please ensure test cases are created
    pause
    exit /b 1
)

echo Required files found:
echo - RegTestRunner: jarfiles\RegTestRunner-8.10.5.jar
echo - Test cases: testcase\coffee_service_tests.xml
echo.

REM Set default values (can be overridden by environment variables)
set BRIDGE_HOST=%BRIDGE_HOST%
if "%BRIDGE_HOST%"=="" set BRIDGE_HOST=ec2-52-74-183-0.ap-southeast-1.compute.amazonaws.com

set BRIDGE_PORT=%BRIDGE_PORT%
if "%BRIDGE_PORT%"=="" set BRIDGE_PORT=11186

set BRIDGE_USER=%BRIDGE_USER%
if "%BRIDGE_USER%"=="" set BRIDGE_USER=jprocero

set BRIDGE_PASSWORD=%BRIDGE_PASSWORD%
if "%BRIDGE_PASSWORD%"=="" set BRIDGE_PASSWORD=jprocero

echo Test Configuration:
echo - Host: %BRIDGE_HOST%
echo - Port: %BRIDGE_PORT%
echo - Username: %BRIDGE_USER%
echo - Project: BuilderUML
echo - Note: RegTestRunner will run all available test suites in the project
echo.

echo Starting regression tests...
echo ========================================

echo Checking available test suites...
java -jar "jarfiles\RegTestRunner-8.10.5.jar" -project BuilderUML -host %BRIDGE_HOST% -port %BRIDGE_PORT% -username %BRIDGE_USER% -password %BRIDGE_PASSWORD% -list

echo.
echo Running all available regression tests...
java -jar "jarfiles\RegTestRunner-8.10.5.jar" -project BuilderUML -host %BRIDGE_HOST% -port %BRIDGE_PORT% -username %BRIDGE_USER% -password %BRIDGE_PASSWORD% -logfile result.xml

if errorlevel 1 (
    echo.
    echo ========================================
    echo Tests completed with errors
    echo ========================================
    if exist result.xml (
        echo Test results:
        type result.xml
    )
    pause
    exit /b 1
) else (
    echo.
    echo ========================================
    echo Tests completed successfully
    echo ========================================
    if exist result.xml (
        echo Test results:
        type result.xml
    )
)

echo.
echo Test execution completed. Check result.xml for detailed results.
pause
