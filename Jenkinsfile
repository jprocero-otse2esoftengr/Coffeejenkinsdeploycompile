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
    
    parameters {
        choice(name: 'XUMLC', choices: ['jarfiles/xumlc-7.20.0.jar'], description: 'Location of the xUML Compiler')
        choice(name: 'REGTEST', choices: ['jarfiles/module.regtest.jar'], description: 'Location of the Regression Test Runner')
        string(name: 'BRIDGE_HOST', defaultValue: 'ec2-52-74-183-0.ap-southeast-1.compute.amazonaws.com', description: 'Bridge host address')
        string(name: 'BRIDGE_USER', defaultValue: 'jprocero', description: 'Bridge username')
        password(name: 'BRIDGE_PASSWORD', defaultValue: 'jprocero', description: 'Bridge password')
        string(name: 'BRIDGE_PORT', defaultValue: '8080', description: 'Bridge port')
        string(name: 'TEST_PROJECT', defaultValue: 'BuilderUML', description: 'Project name for regression tests')
        choice(name: 'TEST_SUITE', choices: ['Build Test', 'QA Tests', 'Dev Tests', 'All Tests'], description: 'Test suite to run')
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
                    script {
                        def testCommand = ""
                        if (params.TEST_SUITE == 'All Tests') {
                            // Run all tests using the main testsuite.xml file
                            testCommand = "java -jar ${REGTEST} -project ${TEST_PROJECT} -testsuite testsuite.xml -logfile test-results.xml -host ${BRIDGE_HOST} -port ${BRIDGE_PORT} -username ${BRIDGE_USER} -password ${BRIDGE_PASSWORD}"
                        } else {
                            // Run specific test suite
                            testCommand = "java -jar ${REGTEST} -project ${TEST_PROJECT} -suite \"${TEST_SUITE}\" -logfile test-results.xml -host ${BRIDGE_HOST} -port ${BRIDGE_PORT} -username ${BRIDGE_USER} -password ${BRIDGE_PASSWORD}"
                        }
                        
                        bat """
                            echo Starting regression tests...
                            echo Project: ${TEST_PROJECT}
                            echo Test Suite: ${TEST_SUITE}
                            echo Bridge Host: ${BRIDGE_HOST}:${BRIDGE_PORT}
                            echo Test Command: ${testCommand}
                            
                            ${testCommand}
                            
                            if errorlevel 1 (
                                echo Regression tests failed!
                                exit /b 1
                            ) else (
                                echo Regression tests completed successfully
                            )
                        """
                    }
                }
            }
            post {
                always {
                    echo 'Publishing test results...'
                    junit 'test-results.xml'
                    archiveArtifacts artifacts: 'test-results.xml', allowEmptyArchive: true
                    archiveArtifacts artifacts: 'regressiontest/**/*', allowEmptyArchive: true
                }
                success {
                    echo 'All regression tests passed!'
                }
                failure {
                    echo 'Regression tests failed. Check the test results for details.'
                }
            }
        }

    }
}
