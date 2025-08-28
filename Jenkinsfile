#!groovy

pipeline {
    agent any

    options {
        buildDiscarder(logRotator(numToKeepStr: '10', artifactNumToKeepStr: '1'))
        disableConcurrentBuilds()
    }
    
    // Git repository configuration
    environment {
        GIT_REPO_URL = 'https://github.com/jprocero-otse2esoftengr/coffeejenkins1.git'
        GIT_BRANCH = 'main'
    }
    
    parameters {
        choice(name: 'XUMLC', choices: 'jarfiles/xumlc-7.20.0.jar', description: 'Location of the xUML Compiler')
        string(name: 'BRIDGE_HOST', defaultValue: 'ec2-52-74-183-0.ap-southeast-1.compute.amazonaws.com', description: 'Bridge host address')
        string(name: 'BRIDGE_PORT', defaultValue: '8080', description: 'Bridge port')
        string(name: 'BRIDGE_USER', defaultValue: 'jprocero', description: 'Bridge username')
        password(name: 'BRIDGE_PASSWORD', defaultValue: 'jprocero', description: 'Bridge password')
    }
    
    environment {
        // Use environment variables to avoid string interpolation warnings
        BRIDGE_HOST_ENV = "${params.BRIDGE_HOST}"
        BRIDGE_PORT_ENV = "${params.BRIDGE_PORT}"
        BRIDGE_USER_ENV = "${params.BRIDGE_USER}"
        BRIDGE_PASSWORD_ENV = "${params.BRIDGE_PASSWORD}"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout([
                    $class: 'GitSCM',
                    branches: [[name: '*/main']],
                    userRemoteConfigs: [[
                        url: 'https://github.com/jprocero-otse2esoftengr/coffeejenkins1.git',
                        credentialsId: ''
                    ]]
                ])
            }
        }
        stage('Setup') {
            steps {
                dir('.') {
                    bat """
                        echo "Installing Bridge CLI..."
                        npm install -g e2e-bridge-cli
                        echo "Bridge CLI installation completed"
                        
                        echo "Verifying Bridge CLI installation..."
                        e2ebridge --help
                        echo "Bridge CLI verification completed"
                    """
                }
            }
        }
        stage('Build') {
            steps {
                dir('.') {
                    bat """
                        echo "Starting xUML compilation..."
                        java -jar ${XUMLC} -uml uml/BuilderUML.xml
                        echo "xUML compilation completed"
                    """
                    archiveArtifacts artifacts: 'repository/BuilderUML/*.rep'
                }
            }
        }
        stage('Deploy') {
            steps {
                dir('.') {
                    bat """
                        echo "Finding Bridge CLI installation..."
                        where e2ebridge
                        if %%ERRORLEVEL%% NEQ 0 (
                            echo "Bridge CLI not found in PATH, trying npm global location..."
                            set BRIDGE_CLI=%%APPDATA%%\\npm\\e2ebridge.cmd
                            if exist "%%BRIDGE_CLI%%" (
                                echo "Found Bridge CLI at: %%BRIDGE_CLI%%"
                            ) else (
                                echo "Bridge CLI not found, trying alternative locations..."
                                set BRIDGE_CLI=%%APPDATA%%\\npm\\e2ebridge
                            )
                        ) else (
                            set BRIDGE_CLI=e2ebridge
                        )
                        
                        echo "Deploying to Bridge API..."
                        echo "Deploying BuilderUML service..."
                        "%%BRIDGE_CLI%%" deploy repository/BuilderUML/BuilderUML.rep -h %BRIDGE_HOST_ENV% -u %BRIDGE_USER_ENV% -P %BRIDGE_PASSWORD_ENV% -o overwrite -o startup
                        if %%ERRORLEVEL%% NEQ 0 (
                            echo "Deployment failed for BuilderUML service"
                            exit /b 1
                        )
                        
                        echo "Deploying CoffeeJenkins service..."
                        "%%BRIDGE_CLI%%" deploy repository/BuilderUML/CoffeeJenkins.rep -h %BRIDGE_HOST_ENV% -u %BRIDGE_USER_ENV% -P %BRIDGE_PASSWORD_ENV% -o overwrite -o startup
                        if %%ERRORLEVEL%% NEQ 0 (
                            echo "Deployment failed for CoffeeJenkins service"
                            exit /b 1
                        )
                        
                        echo "Deployment completed successfully!"
                        
                        echo "Verifying deployed services..."
                        "%%BRIDGE_CLI%%" services -h %BRIDGE_HOST_ENV% -u %BRIDGE_USER_ENV% -P %BRIDGE_PASSWORD_ENV%
                    """
                }
            }
        }

    }
    
    post {
        always {
            echo "Build completed with status: ${currentBuild.result}"
        }
        success {
            echo "Build successful! Services deployed and tests passed."
        }
        failure {
            echo "Build failed! Check the logs for details."
        }
    }
}
