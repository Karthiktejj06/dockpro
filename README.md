# DockQuiz - Dockerized Online Quiz System Microservices Application

An extremely modern, responsive, and secure **Microservices-based Online Quiz System** built using Node.js, Express, MongoDB, NGINX API Gateway, and Docker. 

This repository implements the full operational scope of the DevOps architecture outlined in the synopsis file `devops_synopsis_ca2_kart1.docx`.

## Project Information
* **Student Name:** Thota Mohan Karthik Tej
* **Registration Number:** 12300587
* **Course / Program:** B.Tech Computer Science and Engineering
* **Institution Name:** Lovely Professional University
* **Supervisor:** Manpreet Kaur
* **Date:** May 20, 2026
* **Section:** 20M59 (Roll No: 07)

---

## 🛠️ Technology Stack & Architecture

The application has been decomposed into decoupled microservices, each running in its own containerized environment with independent databases:

```
                            ┌────────────────────────┐
                            │      Web Browser       │
                            └───────────┬────────────┘
                                        │ (Port 80)
                                        ▼
                            ┌────────────────────────┐
                            │   NGINX API Gateway    │
                            └─────┬───┬────────┬───┬─┘
                                  │   │        │   │
        ┌─────────────────────────┘   │        │   └─────────────────────────┐
        │ /                           │ /api/users                           │ /api/quizzes
        ▼                             ▼                                      ▼
┌──────────────┐              ┌──────────────┐                       ┌──────────────┐
│   Frontend   │              │ User Service │                       │ Quiz Service │
│ (Port 80)    │              │ (Port 5001)  │                       │ (Port 5002)  │
└──────────────┘              └──────┬───────┘                       └──────┬───────┘
                                     │                                      │
                                     │        ┌─────────────────────────────┘
                                     │        │ /api/results
                                     │        ▼
                                     │ ┌──────────────┐
                                     │ │Result Service│
                                     │ │ (Port 5003)  │
                                     │ └──────┬───────┘
                                     │        │
                                     ▼        ▼
                               ┌─────────────────┐
                               │   MongoDB Cluster  (Separate Databases)
                               └─────────────────┘
```

1. **Gateway (`gateway`)**: NGINX reverse proxy acting as the single point of entry to coordinate requests between the frontend and the three backend microservices.
2. **User Service (`user-service`)**: Node.js/Express service managing user registration, secure bcrypt hashing, profiles, and JWT token issuance. Connects to `users_db`.
3. **Quiz Service (`quiz-service`)**: Node.js/Express service managing quiz metadata and questions. Omits correct answers for participant endpoints to prevent client-side cheating, while exposing a secured `/answers` endpoint for internal service evaluations. Connects to `quizzes_db`.
4. **Result Service (`result-service`)**: Node.js/Express service that processes quiz submissions, connects internally to the Quiz Service to securely calculate scores, saves attempts, and runs aggregations for global/quiz-specific leaderboards. Connects to `results_db`.
5. **Frontend SPA (`frontend`)**: A visually stunning premium Single Page Application styled with Vanilla CSS (neon gradients, glassmorphism, responsive grids, custom timers, and interactive views).

---

## 🚀 Running the Project Locally

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.
- [Node.js](https://nodejs.org/) (optional, only for running local tests without Docker).

### Step 1: Spin up the Microservices
In your terminal, navigate to the root directory `dockpro` and run:
```bash
docker compose up --build -d
```
This single command will:
1. Download official Node and MongoDB base images.
2. Build custom Dockerfiles for the `user-service`, `quiz-service`, `result-service`, `frontend`, and NGINX `gateway`.
3. Start a shared MongoDB container and configure dedicated logical databases.
4. Launch all microservices inside a secure bridge network (`quiz-network`).
5. Open up port `80` on your host.

### Step 2: Open the Application
Once the containers are running (you can verify using `docker compose ps`), open your web browser and navigate to:
```
http://localhost
```

### Step 3: Stop the Application
To shut down and clean up the container resources:
```bash
docker compose down -v
```

---

## 🧪 Running Automated Tests

Each backend service contains Jest and Supertest integration tests verifying its respective Express routers and health checks.

To run tests locally:

1. **User Service**:
   ```bash
   cd user-service
   npm install
   npm run test
   ```
2. **Quiz Service**:
   ```bash
   cd quiz-service
   npm install
   npm run test
   ```
3. **Result Service**:
   ```bash
   cd result-service
   npm install
   npm run test
   ```

---

## 📝 Continuous Integration (CI/CD)

A GitHub Actions workflow configuration is defined under `.github/workflows/ci-cd.yml`. When code is pushed or a pull request is submitted:
1. Spins up a runner environment.
2. Checks out code and prepares Node.js.
3. Automatically runs all test suites for all microservices in parallel.
4. Executes test builds for all 5 custom Dockerfiles (`gateway`, `user-service`, `quiz-service`, `result-service`, `frontend`) to guarantee build safety and eliminate deployment failures.
