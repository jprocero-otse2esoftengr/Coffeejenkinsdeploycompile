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
        choice(name: 'XUMLC', choices: 'jarfiles/xumlc-7.20.0.jar', description: 'Location of the xUML Compiler')
        choice(name: 'REGTEST', choices: 'jarfiles/module.regtest.jar', description: 'Location of the Regression Test Runner')
        string(name: 'BRIDGE_HOST', defaultValue: 'ec2-52-74-183-0.ap-southeast-1.compute.amazonaws.com', description: 'Bridge host address')
        string(name: 'BRIDGE_USER', defaultValue: 'jprocero', description: 'Bridge username')
        password(name: 'BRIDGE_PASSWORD', defaultValue: 'jprocero', description: 'Bridge password')
        string(name: 'BRIDGE_PORT', defaultValue: '8080', description: 'Bridge port')
        string(name: 'TEST_PROJECT', defaultValue: 'BuilderUML', description: 'Project name for regression tests')
        choice(name: 'TEST_SUITE', choices: 'Build Test,QA Tests,Dev Tests,All Tests', description: 'Test suite to run')
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
                            testCommand = "java -cp ${params.REGTEST} com.scheerpas.bridge.regtest.RegTestRunner -project ${params.TEST_PROJECT} -testsuite testsuite.xml -logfile test-results.xml -host ${params.BRIDGE_HOST} -port ${params.BRIDGE_PORT} -username ${params.BRIDGE_USER} -password ${params.BRIDGE_PASSWORD}"
                        } else {
                            // Run specific test suite
                            testCommand = "java -cp ${params.REGTEST} com.scheerpas.bridge.regtest.RegTestRunner -project ${params.TEST_PROJECT} -suite \"${params.TEST_SUITE}\" -logfile test-results.xml -host ${params.BRIDGE_HOST} -port ${params.BRIDGE_PORT} -username ${params.BRIDGE_USER} -password ${params.BRIDGE_PASSWORD}"
                        }
                        
                        echo "Starting regression tests..."
                        echo "Project: ${params.TEST_PROJECT}"
                        echo "Test Suite: ${params.TEST_SUITE}"
                        echo "Bridge Host: ${params.BRIDGE_HOST}:${params.BRIDGE_PORT}"
                        echo "Test Command: ${testCommand}"
                        
                        // Check if test files exist
                        bat """
                            echo Checking for test files...
                            if exist testsuite.xml (
                                echo testsuite.xml found
                            ) else (
                                echo ERROR: testsuite.xml not found!
                                exit /b 1
                            )
                            
                            if exist ${params.REGTEST} (
                                echo Regression test jar found: ${params.REGTEST}
                                echo Inspecting JAR file contents...
                                jar tf ${params.REGTEST} | findstr -i "manifest"
                                jar tf ${params.REGTEST} | findstr -i "main"
                                jar tf ${params.REGTEST} | findstr -i "regtest"
                            ) else (
                                echo ERROR: Regression test jar not found: ${params.REGTEST}
                                exit /b 1
                            )
                        """
                        
                        // Run the test command with better error handling
                        bat """
                            echo Running regression tests...
                            ${testCommand}
                            
                            if errorlevel 1 (
                                echo Regression tests failed with error code %errorlevel%
                                echo Checking if test results file was created...
                                if exist test-results.xml (
                                    echo test-results.xml was created
                                    type test-results.xml
                                ) else (
                                    echo test-results.xml was NOT created
                                )
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
                    script {
                        if (fileExists('test-results.xml')) {
                            junit 'test-results.xml'
                            archiveArtifacts artifacts: 'test-results.xml', allowEmptyArchive: true
                        } else {
                            echo 'No test results file found, skipping JUnit publishing'
                        }
                        archiveArtifacts artifacts: 'regressiontest/**/*', allowEmptyArchive: true
                    }
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
