# Regression Test Framework for Coffee Service

This directory contains the regression test framework for the Coffee Jenkins Deploy Compile project.

## Directory Structure

```
regressiontest/
├── source/           # Test input files
├── reference/        # Expected output files for comparison
├── .$output/         # Test execution output (auto-generated)
└── README.md         # This file
```

## Test Suites

### 1. Build Test (`Build Test/testsuite.xml`)
Tests the build process and basic functionality:
- **BuildCoffeeService**: Verifies successful compilation
- **RepositoryFileGenerated**: Checks that .rep files are created

### 2. QA Tests (`QA Tests/testsuite.xml`)
Tests quality assurance aspects:
- **CoffeeDataValidation**: Tests data validation logic
- **CoffeeBusinessLogic**: Tests business rules and calculations
- **ErrorHandling**: Tests error handling for invalid inputs
- **PerformanceTest**: Tests service performance under load

### 3. Dev Tests (`Dev Tests/testsuite.xml`)
Tests development and integration aspects:
- **ServiceDeployment**: Tests deployment to Bridge
- **ServiceConnectivity**: Tests service accessibility
- **ServiceIntegration**: Tests integration with other systems
- **ConfigurationManagement**: Tests service configuration

## Running Tests

### Using RegTestRunner
```bash
java -jar RegTestRunner-8.10.5.jar \
  -project BuilderUML \
  -suite "QA Tests/Tests" \
  -host <bridge-host> \
  -port <bridge-port> \
  -username <username> \
  -password <password> \
  -logfile result.xml
```

### Using Jenkins Pipeline
The tests are automatically run in the Jenkins pipeline after deployment:
1. Build stage compiles the UML model
2. Deploy stage deploys to Bridge
3. Test stage runs regression tests

## Adding New Tests

1. **Create test case** in the appropriate testsuite.xml
2. **Add input file** in `source/` directory
3. **Add expected output** in `reference/` directory
4. **Update main testsuite.xml** if adding new test suites

## Test File Format

- **Input files**: XML format with test data and parameters
- **Expected files**: XML format with expected results
- **Output files**: Auto-generated during test execution

## Configuration

Test properties are configured in each testsuite.xml:
- `source.folder`: Location of test input files
- `reference.folder`: Location of expected output files
- `output.folder`: Location for test execution results

## Ignored Elements

The following elements are ignored during comparison:
- `startTime` and `stopTime` (timing variations)
- `trace:Size` (memory usage variations)
- `BuildTime` (build timing variations)

## Troubleshooting

- Ensure all referenced input and expected files exist
- Check file permissions for output directory
- Verify Bridge connectivity for deployment tests
- Review RegTestRunner logs for detailed error information
