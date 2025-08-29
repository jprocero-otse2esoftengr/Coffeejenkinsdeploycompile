#!groovy

pipeline {
    agent any

    options {
        buildDiscarder(logRotator(numToKeepStr: '10', artifactNumToKeepStr: '1'))
        disableConcurrentBuilds()
    }
    
    triggers {
        pollSCM('H/5 * * * *')  // Poll GitHub every 5 minutes
    }
    
    environment {
        REGTEST_JAR = 'jarfiles/module.regtest.jar'
    }
    
    parameters {
        choice(name: 'XUMLC', choices: ['jarfiles/xumlc-7.20.0.jar'], description: 'Location of the xUML Compiler')
        choice(name: 'REGTEST', choices: ['jarfiles/module.regtest.jar'], description: 'Location of the Regression Test Runner')
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
                       
                        if not exist repository\\BuilderUML\\JenkinsCoffeeSoap.rep (
                            echo ERROR: JenkinsCoffeeSoap.rep not found!
                            exit /b 1
                        )
                         
                        echo All repository files found, starting deployment...
                        npx e2e-bridge-cli deploy repository/BuilderUML/JenkinsCoffeeSoap.rep -h ${BRIDGE_HOST} -u ${BRIDGE_USER} -P ${BRIDGE_PASSWORD} -o overwrite
                        
                    """
                }
            }
        }
        stage('Test') {
            steps {
                dir('.') {
                    bat """
                        echo Starting regression tests...
                        echo REGTEST parameter: ${REGTEST}
                        echo REGTEST_JAR environment: ${REGTEST_JAR}
                        
                        set REGTEST_PATH=${REGTEST}
                        if "%REGTEST_PATH%"=="" set REGTEST_PATH=${REGTEST_JAR}
                        
                        echo Using RegTest jar: %REGTEST_PATH%
                        echo Checking if regtest jar exists...
                        if not exist "%REGTEST_PATH%" (
                            echo ERROR: RegTest jar not found at %REGTEST_PATH%
                            exit /b 1
                        )
                        echo RegTest jar found, starting tests...
                        java -jar "%REGTEST_PATH%" -project BuilderUML -suite "QA Tests/Tests" -logfile result.xml -host ${BRIDGE_HOST} -port ${BRIDGE_PORT} -username ${BRIDGE_USER} -password ${BRIDGE_PASSWORD}
                        if errorlevel 1 (
                            echo Tests completed with errors
                            exit /b 1
                        )
                        echo Tests completed successfully
                        echo Checking if result.xml was created...
                        if exist result.xml (
                            echo result.xml found, size:
                            dir result.xml
                        ) else (
                            echo WARNING: result.xml not found
                        )
                    """
                }
            }
            post {
                always {
                    script {
                        if (fileExists('result.xml')) {
                            junit 'result.xml'
                            archiveArtifacts artifacts: 'result.xml'
                        } else {
                            echo "No test results file found"
                        }
                    }
                }
            }
        }
    }
}
