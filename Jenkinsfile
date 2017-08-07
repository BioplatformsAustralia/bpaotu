#!groovy

node {
    env.DOCKER_USE_HUB = 1
    def deployable_branches = ["master", "next_release"]
    def testResults = []
    def artifacts = []

    stage('Checkout') {
        checkout scm
    }

    dockerStage('Dev build') {
        echo "Branch is: ${env.BRANCH_NAME}"
        echo "Build is: ${env.BUILD_NUMBER}"
        sh('''
            ./develop.sh build base
            ./develop.sh build builder
            ./develop.sh build dev
        ''')
    }

    if (deployable_branches.contains(env.BRANCH_NAME)) {

        dockerStage('Prod build') {
            sh('''
                ./develop.sh run-builder
                ./develop.sh build prod
            ''')
        }

        dockerStage('Publish docker image') {
            withCredentials([[$class: 'UsernamePasswordMultiBinding', credentialsId: 'dockerbot',
                              usernameVariable: 'DOCKER_USERNAME',
                              passwordVariable: 'DOCKER_PASSWORD']]) {
                sh("""
                    docker login -u "${env.DOCKER_USERNAME}" --password="${env.DOCKER_PASSWORD}"
                    ./develop.sh push prod
                """)
            }
        }
    }
}


/*
 * dockerStage
 *
 * Custom stage that wraps the stage in timestamps and AnsiColorBuildWrapper
 * Prior to exit wrfy is used to kill all running containers and cleanup.
 */
def dockerStage(String label,
                List<String> artifacts=[],
                List<String> testResults=[],
                Closure body) {

    stage(label) {
        try {
            timestamps {
                wrap([$class: 'AnsiColorBuildWrapper', 'colorMapName':    'XTerm']) {
                    body.call()
                }
            }
        } catch (Exception e) {
            currentBuild.result = 'FAILURE'
            throw e
        } finally {
            for (artifact in artifacts) {
                step([$class: 'ArtifactArchiver', artifacts: artifact, fingerprint: false, excludes: null])
            }
            for (testResult in testResults) {
                step([$class: 'JUnitResultArchiver', testResults: testResult])
            }
            sh('''
                /env/bin/wrfy kill-all --force
                /env/bin/wrfy scrub --force
            ''')
        }
    }

}
