# Regression Test Cases

This directory contains regression test cases for the BuilderUML service.

## Test Files

- `coffee_service_tests.xml` - Main test cases for the coffee service operations
- `test_suite_config.xml` - Test suite configuration file

## Test Structure

Each test case includes:
- **Input**: Test data to send to the service
- **Expected Output**: Expected response from the service
- **Timeout**: Maximum time to wait for response (in milliseconds)

## Running Tests

Tests are automatically executed by Jenkins during the CI/CD pipeline. The RegTestRunner will:
1. Load the test configuration
2. Execute each test case
3. Compare actual vs expected results
4. Generate test reports

## Adding New Tests

To add new test cases:
1. Create or modify XML test files in this directory
2. Update the test suite configuration if needed
3. Ensure test data matches the service's expected input format
4. Run the Jenkins pipeline to execute the tests
