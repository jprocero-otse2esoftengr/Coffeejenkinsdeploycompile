#!groovy

pipeline {
    agent any

    options {
        buildDiscarder(logRotator(numToKeepStr: '10', artifactNumToKeepStr: '1'))
        disableConcurrentBuilds()
    }
    
    parameters {
        choice(name: 'XUMLC', choices: 'jarfiles/xumlc-7.20.0.jar', description: 'Location of the xUML Compiler')
        choice(name: 'REGTEST', choices: 'D:/jenkins/userContent/RegTestRunner/RegTestRunner-nightly.jar', description: 'Location of the Regression Test Runner')
        string(name: 'BRIDGE_HOST', defaultValue: 'ec2-52-74-183-0.ap-southeast-1.compute.amazonaws.com', description: 'Bridge host address')
        string(name: 'BRIDGE_USER', defaultValue: 'jprocero', description: 'Bridge username')
        password(name: 'BRIDGE_PASSWORD', defaultValue: 'jprocero', description: 'Bridge password')
        string(name: 'BRIDGE_PORT', defaultValue: '8080', description: 'Bridge port')
    }

    stages {
        stage('Build') {
            steps {
                dir('.') {
                    bat """
                        java -jar ${XUMLC} -uml uml/BuilderUML.xml
                        if errorlevel 1 exit /b 1
                        echo Build completed successfully
                        dir repository\\BuilderUML\\*.rep
                    """
                    archiveArtifacts artifacts: 'repository/BuilderUML/*.rep'
                }
            }
        }
        stage('Deploy') {
            steps {
                dir('.') {
                    bat """
                        echo Checking for repository files...
                       
                        if not exist repository\\BuilderUML\\CoffeeJenkins.rep (
                            echo ERROR: CoffeeJenkins.rep not found!
                            exit /b 1
                        )
                        if not exist repository\\BuilderUML\\JenkinsCoffee.rep (
                            echo ERROR: JenkinsCoffee.rep not found!
                            exit /b 1
                        )
                        echo All repository files found, starting deployment...
                        npx e2e-bridge-cli deploy repository/BuilderUML/CoffeeJenkins.rep -h ${BRIDGE_HOST} -u ${BRIDGE_USER} -P ${BRIDGE_PASSWORD} -o overwrite
                        npx e2e-bridge-cli deploy repository/BuilderUML/JenkinsCoffee.rep -h ${BRIDGE_HOST} -u ${BRIDGE_USER} -P ${BRIDGE_PASSWORD} -o overwrite
                    """
                }
            }
        }
        stage('Test') {
            steps {
                dir('.') {
                    bat """
                        java -jar ${REGTEST} -project BuilderUML -suite "QA Tests/Tests" -logfile result.xml -host ${BRIDGE_HOST} -port ${BRIDGE_PORT} -username ${BRIDGE_USER} -password ${BRIDGE_PASSWORD}
                    """
                }
            }
            post {
                always {
                    junit 'result.xml'
                }
            }
        }
    }
}
