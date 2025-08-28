#!groovy

pipeline {
    agent {
        node {
            label 'Windows'
            customWorkspace "workspace/coffeelistJenkins1"
        }
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10', artifactNumToKeepStr: '1'))
        disableConcurrentBuilds()
    }
    
    parameters {
        choice(name: 'XUMLC', choices: 'jarfiles/xumlc-7.20.0.jar', description: 'Location of the xUML Compiler')
        choice(name: 'REGTEST', choices: 'D:/jenkins/userContent/RegTestRunner/RegTestRunner-nightly.jar', description: 'Location of the Regression Test Runner')
        string(name: 'BRIDGE_HOST', defaultValue: 'ec2-52-74-183-0.ap-southeast-1.compute.amazonaws.com', description: 'Bridge host address')
        string(name: 'BRIDGE_PORT', defaultValue: '8080', description: 'Bridge port')
        string(name: 'BRIDGE_USER', defaultValue: 'jprocero', description: 'Bridge username')
        password(name: 'BRIDGE_PASSWORD', defaultValue: 'jprocero', description: 'Bridge password')
    }

    stages {
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
        stage('Test') {
            steps {
                dir('.') {
                    bat """
                        echo "Running regression tests..."
                        java -jar ${REGTEST} -project BuilderUML -suite "QA Tests/Tests" -logfile result.xml -host ${BRIDGE_HOST} -port ${BRIDGE_PORT} -username ${BRIDGE_USER} -password ${BRIDGE_PASSWORD}
                        echo "Regression tests completed"
                    """
                }
            }
much            post {
                always {
                    junit 'result.xml'
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
