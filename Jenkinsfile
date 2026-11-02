
pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                echo 'Starting Smart Warranty Manager CI/CD'
                checkout scm
            }
        }

        stage('Build Backend') {
            steps {
                echo 'Building Spring Boot backend'
                sh 'cd backend && chmod +x mvnw && ./mvnw clean package -DskipTests'
            }
        }

        stage('Build Frontend') {
            steps {
                echo 'Building React frontend'
                sh 'cd frontend && npm ci && npm run build'
            }
        }

        stage('Build Docker Images') {
            steps {
                echo 'Building Docker images'
                sh 'docker build -t smart-warranty-backend:latest ./backend'
                sh 'docker build -t smart-warranty-frontend:latest ./frontend'
            }
        }
                stage('Push Images to Docker Hub') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-credentials',
                    usernameVariable: 'DOCKERHUB_USER',
                    passwordVariable: 'DOCKERHUB_TOKEN'
                )]) {
                    sh '''
                        echo "$DOCKERHUB_TOKEN" | docker login -u "$DOCKERHUB_USER" --password-stdin

                        docker tag smart-warranty-backend:latest "$DOCKERHUB_USER/smart-warranty-backend:latest"
                        docker tag smart-warranty-frontend:latest "$DOCKERHUB_USER/smart-warranty-frontend:latest"

                        docker push "$DOCKERHUB_USER/smart-warranty-backend:latest"
                        docker push "$DOCKERHUB_USER/smart-warranty-frontend:latest"

                        docker logout
                    '''
                }
            }
        }
    }
}
