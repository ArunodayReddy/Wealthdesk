// Jenkinsfile — WealthDesk CI on Jenkins (the Kforce JD names Jenkins /
// Concourse; this repo ships Jenkins + GitHub Actions so both are real).
//
// DESIGN: every stage runs on `nx affected`, so a change to one lib only
// lints / tests / builds what it touches. Affected compares against
// origin/main, so the checkout MUST have that ref — the Checkout stage
// fetches it explicitly (a shallow single-branch clone would break
// affected with "base not found").
//
// E2E: the Playwright spec needs the API on :3333 (the dev server proxies
// /api to it). The api is started in the background and killed in `post`
// so a failed test run never leaks a process into the next build. The
// spec runs via direct `playwright test --project=chromium` (not
// `nx e2e`, whose --project flag did not filter projects in this repo).
//
// NOTE: authored, not executed — there is no Jenkins in the dev VM.
// The Jenkins NodeJS tool name ('node-24') must match your Jenkins
// NodeJS plugin configuration.
pipeline {
  agent any

  tools {
    nodejs 'node-24'
  }

  environment {
    NX_DAEMON = 'false'
    CI = 'true'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
        sh 'git fetch --no-tags origin main || true'
      }
    }

    stage('Install') {
      steps {
        // --legacy-peer-deps matches the local install quirk (the
        // @nx/webpack addition needed it).
        sh 'npm ci --legacy-peer-deps'
      }
    }

    stage('Lint (affected)') {
      steps {
        sh 'npx nx affected -t lint --base=origin/main'
      }
    }

    stage('Test (affected)') {
      steps {
        sh 'npx nx affected -t test --base=origin/main'
      }
    }

    stage('Build (affected)') {
      steps {
        sh 'npx nx affected -t build --base=origin/main'
      }
    }

    stage('Show affected') {
      steps {
        sh 'npx nx show projects --affected --base=origin/main'
        sh 'npx nx run tools:affected-report'
        archiveArtifacts artifacts: 'affected-report.md', allowEmptyArchive: true
      }
    }

    stage('E2E (chromium)') {
      steps {
        sh 'npx nx build api'
        sh 'nohup node dist/api/main.js > api.log 2>&1 & echo $! > api.pid'
        sh '''
          for i in $(seq 1 30); do
            curl -sf http://localhost:3333/api/v1/accounts && break || sleep 2
          done
        '''
        sh 'npx playwright install chromium'
        sh 'cd apps/web-e2e && npx playwright test --project=chromium'
      }
    }
  }

  post {
    always {
      sh 'kill $(cat api.pid) 2>/dev/null || true'
      archiveArtifacts artifacts: 'api.log', allowEmptyArchive: true
    }
  }
}
