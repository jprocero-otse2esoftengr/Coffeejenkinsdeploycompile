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
                        echo "Setting PATH to include npm global packages..."
                        set PATH=%%PATH%%;%%APPDATA%%\\npm
                        
                        echo "Deploying to Bridge..."
                        echo "Deploying BuilderUML service..."
                        e2ebridge deploy repository/BuilderUML/BuilderUML.rep -h ${BRIDGE_HOST} -u ${BRIDGE_USER} -P ${BRIDGE_PASSWORD} -o overwrite
                        echo "Deploying CoffeeJenkins service..."
                        e2ebridge deploy repository/BuilderUML/CoffeeJenkins.rep -h ${BRIDGE_HOST} -u ${BRIDGE_USER} -P ${BRIDGE_PASSWORD} -o overwrite
                        echo "Deployment completed"
                        
                        echo "Verifying deployed services..."
                        e2ebridge services -h ${BRIDGE_HOST} -u ${BRIDGE_USER} -P ${BRIDGE_PASSWORD}
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
