#!groovy

pipeline {
	agent {
		label 'cscabbia'
	}

	options {
		buildDiscarder(logRotator(numToKeepStr: '10'))
		disableConcurrentBuilds()
	}

	tools {
		nodejs 'NodeJS 8.9.1'
	}

	stages {
		stage('clean-up') {
			steps {
				sh 'git clean -fd'
			}
		}
		stage('install') {
			steps {
				sh 'npm install'
			}
		}
		stage('test') {
			steps {
				sh 'npm run test:with-coverage -- --junitreport --filePrefix=unit-test-results'
				sh 'npm run coverage:cobertura'
				junit 'unit-test-results.xml'
				step([$class: 'CoberturaPublisher', coberturaReportFile: 'coverage/cobertura-coverage.xml'])
			}
		}
	}
}
