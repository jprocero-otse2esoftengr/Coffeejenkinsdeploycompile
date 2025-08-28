# CoffeeList Jenkins Continuous Delivery Setup

This project implements continuous delivery using Jenkins for xUML/Bridge services based on the [Scheer PAS documentation](https://doc.scheer-pas.com/bridge/24.1/continuous-delivery-with-the-bridge).

## Prerequisites

Before setting up the Jenkins pipeline, ensure you have:

1. **Jenkins Installation** (version 2.89.2 or later)
2. **Node.js and npm** (for Bridge CLI installation)
3. **xUML Command Line Compiler** (part of Bridge 7)
4. **Bridge Command Line Interface** (automatically installed by the pipeline)
5. **Regression Test Runner**
6. **Git repository** with this project checked in

## Project Structure

```
coffeelistJenkins1/
├── Jenkinsfile              # Jenkins pipeline definition
├── README.md               # This file
├── package.json            # Node.js dependencies
├── uml/
│   └── BuilderUML.xml      # xUML model file
├── repository/
│   └── BuilderUML/
│       ├── BuilderUML.rep  # Compiled repository
│       └── CoffeeJenkins.rep
└── jarfiles/               # External JAR dependencies
    └── xumlc-7.20.0.jar    # xUML Command Line Compiler
```

## Jenkins Setup Instructions

### 1. Create a Multibranch Pipeline Job

1. In Jenkins, create a new item
2. Select **Multibranch Pipeline**
3. Name it `coffeelistJenkins1`

### 2. Configure Branch Sources

1. Go to **Branch Sources** section
2. Select **Git** as source
3. Enter your Git repository URL
4. Provide credentials if needed

### 3. Configure Build Configuration

1. Set **Build Configuration** to **by Jenkinsfile**
2. The Jenkinsfile should be automatically detected from the repository root

### 4. Configure Triggers

1. Check **Periodically** 
2. Set to **1** (once per minute)
3. This will check for repository changes every minute

### 5. Configure Parameters

The pipeline uses the following parameters (configure in Jenkins job settings):

- **XUMLC**: Path to xUML Compiler JAR (default: `jarfiles/xumlc-7.20.0.jar`)
- **REGTEST**: Path to Regression Test Runner JAR (default: `D:/jenkins/userContent/RegTestRunner/RegTestRunner-nightly.jar`)
- **BRIDGE_HOST**: Bridge host address (default: `ec2-52-74-183-0.ap-southeast-1.compute.amazonaws.com`)
- **BRIDGE_PORT**: Bridge port (default: `8080`)
- **BRIDGE_USER**: Bridge username (default: `jprocero`)
- **BRIDGE_PASSWORD**: Bridge password (default: `jprocero`)

## Pipeline Stages

The Jenkinsfile defines four main stages:

### 1. Setup Stage
- Installs the Bridge CLI using npm
- Verifies the Bridge CLI installation

### 2. Build Stage
- Compiles the xUML model using the xUML Command Line Compiler
- Archives the compiled repository files as artifacts

### 3. Deploy Stage
- Deploys the compiled services to Bridge using the Bridge CLI
- Uses the `overwrite` option to replace existing services
- Verifies the deployed services

### 4. Test Stage
- Runs regression tests using the Regression Test Runner
- Generates JUnit-compatible test reports

## Usage

1. **Automatic Triggers**: The pipeline automatically runs when changes are pushed to the Git repository
2. **Manual Triggers**: You can manually trigger builds from the Jenkins console
3. **Artifacts**: Compiled repository files are archived and can be downloaded from Jenkins
4. **Test Reports**: Test results are displayed in Jenkins with JUnit integration

## Troubleshooting

### First Run Issues
- The first run may fail if parameters are newly added
- Jenkins needs the first run to add parameters to the pipeline configuration
- Subsequent runs should work normally

### Common Issues
1. **xUML Compiler not found**: Verify the XUMLC parameter path
2. **Bridge connection failed**: Check BRIDGE_HOST, BRIDGE_PORT, and credentials
3. **Test failures**: Review the generated result.xml file for test details

### Logs and Debugging
- Check the Jenkins console output for detailed build logs
- Use the Pipeline Linter to validate Jenkinsfile syntax before execution
- Review archived artifacts for compiled repository files

## Security Notes

- Store sensitive information (passwords, API keys) using Jenkins credentials
- Use parameterized builds to avoid hardcoding values
- Consider using Jenkins secrets management for production environments
- **Important**: The default password is set for development purposes. For production, use Jenkins credentials management to store sensitive information securely.

## Additional Resources

- [Scheer PAS Bridge Documentation](https://doc.scheer-pas.com/bridge/24.1/continuous-delivery-with-the-bridge)
- [Jenkins Pipeline Documentation](https://www.jenkins.io/doc/book/pipeline/)
- [Apache Groovy Script Documentation](https://groovy-lang.org/documentation.html)
