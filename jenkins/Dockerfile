
FROM jenkins/jenkins:lts-jdk21

USER root

# Install Docker CLI, Maven and required utilities
RUN apt-get update && \
    apt-get install -y docker.io maven curl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Install Node.js 22 and npm
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

USER jenkins
