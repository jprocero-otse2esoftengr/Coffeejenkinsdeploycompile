# Regression Test Cases

This directory contains documentation and examples for regression test cases for the BuilderUML service.

## Important Note About RegTestRunner

The RegTestRunner does **NOT** use external XML files for test cases. Instead, it uses test suites that are created within the Builder project using the Builder IDE.

## Current Status

- **Test Suites Available**: None (test suites need to be created in Builder IDE)
- **External XML Files**: These are examples/documentation only
- **Jenkins Pipeline**: Will run all available test suites in the project

## How RegTestRunner Works

1. **Test Suites**: Must be created within the Builder project using the Builder IDE
2. **Test Cases**: Defined in the Builder IDE, not as external XML files
3. **Execution**: RegTestRunner connects to the Bridge and runs all available test suites
4. **Results**: Generated in JUnit XML format

## Creating Test Suites in Builder IDE

To create actual test suites that RegTestRunner can execute:

1. **Open Builder IDE**
2. **Open the BuilderUML project**
3. **Create Test Suites**:
   - Right-click on the project
   - Select "New" → "Test Suite"
   - Define test cases with input/output data
   - Configure test parameters and assertions

4. **Test Suite Structure**:
   - Test suites are stored within the Builder project
   - Each test suite can contain multiple test cases
   - Test cases define input data and expected outputs
   - Timeouts and other parameters can be configured

## Example Test Cases (for reference)

The XML files in this directory (`coffee_service_tests.xml`) show the structure of test cases that would be created in the Builder IDE:

- **Basic Coffee Operation Test**: Tests the `operation1` with valid coffee data
- **Different Categories**: Tests with hot/cold coffee categories
- **Special Characters**: Tests with special characters in names/descriptions
- **High Price Coffee**: Tests with premium coffee scenarios
- **Service Availability**: Basic connectivity test

## Running Tests

### Via Jenkins Pipeline
Tests are automatically executed by Jenkins during the CI/CD pipeline:
1. RegTestRunner connects to the Bridge
2. Lists all available test suites
3. Executes all test suites
4. Generates JUnit XML results

### Via Local Script
Use `run_tests.bat` for local testing:
```batch
run_tests.bat
```

## Current Behavior

Since no test suites are currently configured in the Builder project:
- RegTestRunner will complete successfully but with 0 tests
- Jenkins will show "No tests configured" status
- This is normal until test suites are created in Builder IDE

## Next Steps

1. **Open Builder IDE** and the BuilderUML project
2. **Create test suites** using the Builder IDE interface
3. **Define test cases** with appropriate input/output data
4. **Deploy the project** to make test suites available
5. **Run Jenkins pipeline** to execute the new test suites

## Troubleshooting

- **"Test suite not found"**: Test suites must be created in Builder IDE, not as external files
- **"0 tests"**: No test suites are configured in the Builder project
- **Connection errors**: Check Bridge host, port, and credentials
