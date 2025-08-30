@echo off
echo ========================================
echo Testing Complete Pipeline Locally
echo ========================================

echo.
echo 1. Testing Build Stage...
java -jar jarfiles/xumlc-7.20.0.jar -uml uml/BuilderUML.xml
if errorlevel 1 (
    echo ERROR: Build failed!
    exit /b 1
)
echo Build completed successfully!

echo.
echo 2. Testing Deploy Stage...
if not exist repository\BuilderUML\JenkinsCoffeeSoap.rep (
    echo ERROR: JenkinsCoffeeSoap.rep not found!
    exit /b 1
)
echo Repository file found, testing deployment...
npx e2e-bridge-cli deploy repository/BuilderUML/JenkinsCoffeeSoap.rep -h ec2-52-74-183-0.ap-southeast-1.compute.amazonaws.com -u jprocero -P jprocero -o overwrite
if errorlevel 1 (
    echo ERROR: Deploy failed!
    exit /b 1
)
echo Deploy completed successfully!

echo.
echo 3. Testing Test Stage...
if not exist jarfiles\RegTestRunner-8.10.5.jar (
    echo ERROR: RegTestRunner jar not found!
    exit /b 1
)
echo RegTestRunner found, running tests...
java -jar jarfiles/RegTestRunner-8.10.5.jar -project BuilderUML -host ec2-52-74-183-0.ap-southeast-1.compute.amazonaws.com -port 8080 -username jprocero -password jprocero -logfile test_result.xml
if errorlevel 1 (
    echo ERROR: Tests failed!
    exit /b 1
)
echo Tests completed successfully!

echo.
echo 4. Checking Test Results...
if exist test_result.xml (
    echo Test results found:
    type test_result.xml
) else (
    echo WARNING: No test results file found
)

echo.
echo ========================================
echo Pipeline Test Completed Successfully!
echo ========================================
