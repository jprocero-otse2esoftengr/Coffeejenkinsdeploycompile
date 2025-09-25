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
        string(name: 'BRIDGE_HOST', defaultValue: 'ec2-52-74-183-0.ap-southeast-1.compute.amazonaws.com', description: 'Bridge host address')
        string(name: 'BRIDGE_USER', defaultValue: 'jprocero', description: 'Bridge username')
        password(name: 'BRIDGE_PASSWORD', defaultValue: 'jprocero', description: 'Bridge password')
        string(name: 'BRIDGE_PORT', defaultValue: '8080', description: 'Bridge port')
        string(name: 'CONTROL_PORT', defaultValue: '21190', description: 'Control port')
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
<<<<<<< HEAD
                        echo Deployment configuration:
=======
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
                        echo Using RegTest jar: ${REGTEST_JAR}
                        
                        echo Checking if regtest jar exists...
                        if not exist "${REGTEST_JAR}" (
                            echo ERROR: RegTest jar not found at ${REGTEST_JAR}
                            exit /b 1
                        )
                        
                        echo Checking if test cases exist...
                        if not exist "testcase\\coffee_service_tests.xml" (
                            echo ERROR: Test cases not found in testcase directory
                            echo Please ensure testcase/coffee_service_tests.xml exists
                            exit /b 1
                        )
                        
                        echo Starting regression tests...
                        echo Test configuration:
                        echo - Project: BuilderUML
>>>>>>> df92f896f4cd1cccef803f5947efc291ec51ca7d
                        echo - Host: ${BRIDGE_HOST}
                        echo - Port: ${BRIDGE_PORT}
                        echo - Control Port: ${CONTROL_PORT}
                        echo - Username: ${BRIDGE_USER}
<<<<<<< HEAD
                        
                        npx e2e-bridge-cli deploy repository/BuilderUML/JenkinsCoffeeSoap.rep -h ${BRIDGE_HOST} -p ${BRIDGE_PORT} -c ${CONTROL_PORT} -u ${BRIDGE_USER} -P ${BRIDGE_PASSWORD} -o overwrite
=======
                        echo - Note: RegTestRunner will run all available test suites in the project
                        
                        echo.
                        echo Checking available test suites...
                        java -jar "${REGTEST_JAR}" -project BuilderUML -host ${BRIDGE_HOST} -port ${BRIDGE_PORT} -username ${BRIDGE_USER} -password ${BRIDGE_PASSWORD} -list
                        
                        echo.
                        echo Running all available regression tests...
                        java -jar "${REGTEST_JAR}" -project BuilderUML -host ${BRIDGE_HOST} -port ${BRIDGE_PORT} -username ${BRIDGE_USER} -password ${BRIDGE_PASSWORD} -logfile result.xml
>>>>>>> df92f896f4cd1cccef803f5947efc291ec51ca7d
                        
                        if errorlevel 1 (
                            echo Deployment failed
                            exit /b 1
                        )
                        
                        echo Deployment completed successfully
                    """
                }
            }
        }

    }
}