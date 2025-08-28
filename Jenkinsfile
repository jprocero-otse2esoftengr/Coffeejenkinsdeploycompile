#!groovy

pipeline {
    agent any

    options {
        buildDiscarder(logRotator(numToKeepStr: '10', artifactNumToKeepStr: '1'))
        disableConcurrentBuilds()
    }
    
    parameters {
        choice(name: 'XUMLC', choices: ['jarfiles/xumlc-7.20.0.jar'], description: 'Location of the xUML Compiler')
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
                        
                        echo Attempting to stop any existing bridge processes...
                        taskkill /f /im node.exe 2>nul || echo No existing node processes found
                        
                        echo Waiting for processes to fully terminate...
                        timeout /t 5 /nobreak >nul
                        
                        echo Starting deployment with retry logic...
                        set MAX_RETRIES=3
                        set RETRY_COUNT=0
                        
                        :retry_deploy
                        npx e2e-bridge-cli deploy repository/BuilderUML/JenkinsCoffeeSoap.rep -h ${BRIDGE_HOST} -u ${BRIDGE_USER} -P ${BRIDGE_PASSWORD} -o overwrite
                        if errorlevel 1 (
                            set /a RETRY_COUNT+=1
                            if !RETRY_COUNT! lss !MAX_RETRIES! (
                                echo Deployment failed, retrying in 10 seconds... (Attempt !RETRY_COUNT! of !MAX_RETRIES!)
                                timeout /t 10 /nobreak >nul
                                goto retry_deploy
                            ) else (
                                echo ERROR: Deployment failed after !MAX_RETRIES! attempts
                                exit /b 1
                            )
                        ) else (
                            echo Deployment completed successfully
                        )
                        
                    """
                }
            }
        }

    }
}
