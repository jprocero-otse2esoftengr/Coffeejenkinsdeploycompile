pipeline {
    agent any

    triggers {
        // Poll SCM every 1 minute
        pollSCM('* * * * *')
    }

    environment {
        BRIDGE_HOST = "ec2-52-74-183-0.ap-southeast-1.compute.amazonaws.com"
        BRIDGE_PORT = "21176"   // ✅ fixed control port
        BRIDGE_USER = "jprocero"
        BRIDGE_PASSWORD = credentials('bridge-password') // store in Jenkins credentials
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scmGit(
                    branches: [[name: '*/master']],
                    extensions: [],
                    userRemoteConfigs: [[
                        credentialsId: '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',
                        url: 'https://github.com/jprocero-otse2esoftengr/CI-CD-DELIVERY-BRIDGE.git'
                    ]]
                )
            }
        }

        stage('Build') {
            steps {
                dir('.') {
                    bat '''
                        echo Compiling UML...
                        java -jar jarfiles/xumlc-7.20.0.jar -uml uml/BuilderUML.xml
                        if errorlevel 1 exit /b 1
                        echo Build completed successfully
                        dir repository\\BuilderUML\\*.rep
                    '''
                }
                archiveArtifacts artifacts: 'repository/BuilderUML/*.rep', allowEmptyArchive: false
            }
        }

        stage('Deploy') {
            steps {
                dir('.') {
                    bat """
                        echo Checking for repository files...
                        if not exist repository\\BuilderUML\\regtestlatest.rep (
                            echo ERROR: regtestlatest.rep not found!
                            exit /b 1
                        )
                        echo All repository files found, starting deployment...
                        npx e2e-bridge-cli deploy repository/BuilderUML/regtestlatest.rep -h %BRIDGE_HOST% -u %BRIDGE_USER% -P %BRIDGE_PASSWORD% -p %BRIDGE_PORT% -o overwrite
                    """
                }
            }
        }

        stage('Test') {
            steps {
                dir('.') {
                    bat """
                        echo Starting regression tests...
                        if not exist "jarfiles/RegTestRunner-8.10.5.jar" (
                            echo ERROR: RegTest jar not found!
                            exit /b 1
                        )
                        if not exist "regressiontest\\testsuite\\testsuite.xml" (
                            echo ERROR: Test cases not found in regressiontest directory
                            exit /b 1
                        )

                        java -jar "jarfiles/RegTestRunner-8.10.5.jar" ^
                            -project . ^
                            -host %BRIDGE_HOST% ^
                            -port %BRIDGE_PORT% ^
                            -username %BRIDGE_USER% ^
                            -password %BRIDGE_PASSWORD% ^
                            -logfile regressiontest/result.xml
                    """
                }
            }
        }
    }

    post {
        always {
            script {
                echo "Processing test results..."
                if (fileExists('regressiontest/result.xml')) {
                    echo "Result content:"
                    echo readFile('regressiontest/result.xml')
                    junit 'regressiontest/result.xml'
                    archiveArtifacts artifacts: 'regressiontest/result.xml', allowEmptyArchive: true
                } else {
                    echo "No result.xml found!"
                }
            }
        }
    }
}
