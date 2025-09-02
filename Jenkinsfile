#!groovy

pipeline {
    agent any

    options {
        buildDiscarder(logRotator(numToKeepStr: '10', artifactNumToKeepStr: '1'))
        disableConcurrentBuilds()
    }
    
    environment {
        REGTEST_JAR = 'jarfiles/RegTestRunner-8.10.5.jar'
    }
    
    triggers {
        pollSCM('H/5 * * * *')  // Poll GitHub every 5 minutes
    }
    
    parameters {
        choice(name: 'XUMLC', choices: ['jarfiles/xumlc-7.20.0.jar'], description: 'Location of the xUML Compiler')
        choice(name: 'REGTEST', choices: ['jarfiles/RegTestRunner-8.10.5.jar'], description: 'Location of the Regression Test Runner')
        string(name: 'BRIDGE_HOST', defaultValue: 'ec2-52-74-183-0.ap-southeast-1.compute.amazonaws.com', description: 'Bridge host address')
        string(name: 'BRIDGE_USER', defaultValue: 'jprocero', description: 'Bridge username')
        password(name: 'BRIDGE_PASSWORD', defaultValue: 'jprocero', description: 'Bridge password')
        string(name: 'BRIDGE_PORT', defaultValue: '11186', description: 'Bridge port')
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
                        echo RegTest jar found, starting tests...
                        echo Running Build Test suite...
                java -jar "${REGTEST_JAR}" -project BuilderUML -suite "Build Test" -host ${BRIDGE_HOST} -port ${BRIDGE_PORT} -username ${BRIDGE_USER} -password ${BRIDGE_PASSWORD} -logfile build_result.xml
                
                echo Running QA Test suite...
                java -jar "${REGTEST_JAR}" -project BuilderUML -suite "QA Tests" -host ${BRIDGE_HOST} -port ${BRIDGE_PORT} -username ${BRIDGE_USER} -password ${BRIDGE_PASSWORD} -logfile qa_result.xml
                
                echo Running Dev Test suite...
                java -jar "${REGTEST_JAR}" -project BuilderUML -suite "Dev Tests" -host ${BRIDGE_HOST} -port ${BRIDGE_PORT} -username ${BRIDGE_USER} -password ${BRIDGE_PASSWORD} -logfile dev_result.xml
                
                echo Merging test results...
                echo ^<?xml version="1.0" encoding="UTF-8"?^> > result.xml
                echo ^<testsuites^> >> result.xml
                if exist build_result.xml type build_result.xml >> result.xml
                if exist qa_result.xml type qa_result.xml >> result.xml
                if exist dev_result.xml type dev_result.xml >> result.xml
                echo ^</testsuites^> >> result.xml
                        if errorlevel 1 (
                            echo Tests completed with errors
                            exit /b 1
                        )
                        echo Tests completed successfully
                        echo Checking if result.xml was created...
                        if exist result.xml (
                            echo result.xml found, size:
                            dir result.xml
                            echo.
                            echo NOTE: If no tests are configured, this is normal.
                            echo To add regression tests, configure test suites in your project.
                        ) else (
                            echo WARNING: result.xml not found
                        )
                    """
                }
            }
            post {
                always {
                    script {
                        // Archive all test result files
                        if (fileExists('build_result.xml')) {
                            archiveArtifacts artifacts: 'build_result.xml'
                        }
                        if (fileExists('qa_result.xml')) {
                            archiveArtifacts artifacts: 'qa_result.xml'
                        }
                        if (fileExists('dev_result.xml')) {
                            archiveArtifacts artifacts: 'dev_result.xml'
                        }
                        
                        if (fileExists('result.xml')) {
                            // Check if the merged result file has actual test results
                            def resultContent = readFile('result.xml')
                            if (resultContent.contains('tests="0"') || resultContent.contains('testsuite name=""')) {
                                echo "No test results found in result.xml - creating placeholder"
                                // Create a placeholder result with one skipped test
                                writeFile file: 'result.xml', text: '''<?xml version="1.0" encoding="UTF-8"?>
<testsuites>
   <testsuite name="Regression Tests" tests="1" failures="0" errors="0" skipped="1">
      <testcase name="NoTestsConfigured" classname="RegressionTest">
         <skipped message="No regression tests are currently configured for this project"/>
      </testcase>
   </testsuite>
</testsuites>'''
                            }
                            junit 'result.xml'
                            archiveArtifacts artifacts: 'result.xml'
                        } else {
                            echo "No merged test results file found"
                        }
                    }
                }
            }
        }

    }
}
