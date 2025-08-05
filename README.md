# zentry-challenge-backend
# Bacefook Analytics Platform

## 📝 Overview

This project is a full-stack social network data analytics platform for "Bacefook", consisting of:

-   **Frontend:** Built with **Next.js (React)** and **Tailwind CSS**, serving as the user interface for viewing data and interacting with the system. It features data visualizations in the form of graphs, tables, and leaderboards.
-   **Backend:** Built with **NestJS** and uses the **Neo4j** graph database. It is responsible for processing event data generated in the system, storing it in the database, and providing an API for the frontend to consume.

The entire project is managed with **Turborepo** and can be easily run together using **Docker Compose**.

---

## 🛠️ Tech Stack

| Component           | Technology                                                              |
| :------------------ | :---------------------------------------------------------------------- |
| **Monorepo** | [Turborepo](https://turbo.build/repo)                                   |
| **Container** | [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/) (for database only) |
| **Frontend** | [Next.js](https://nextjs.org/), [React](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/) |
| **Backend** | [NestJS](https://nestjs.com/)                                           |
| **Database** | [Neo4j](https://neo4j.com/) (Graph Database)                            |
| **OGM** | [@neo4j/graphql-ogm](https://neo4j.com/docs/graphql-manual/current/ogm/) |
| **Language** | TypeScript                                                              |
| **Graph Visualization** | `react-force-graph-2d`, `recharts`                                      |

---

## 🚀 Setup and Running

### Prerequisites

-   [Node.js](https://nodejs.org/) (v20 or later)
-   [Yarn](https://yarnpkg.com/) (v1.22.22)
-   [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/)

### Installation Steps

1.  **Clone a Repository (if applicable):**
    ```bash
    git clone git@github.com:Nontakon/zentry-backend.git
    cd zentry-backend
    ```

2.  **Start the Database:**
    Run the following command from the project root to start the Neo4j database:
    ```bash
    docker-compose up -d
    ```

3.  **Install Dependencies:**
    Run `yarn install` from the project root. Turborepo will install all necessary dependencies for both the frontend and backend.
    ```bash
    yarn install
    ```

4.  **Create Environment Variables File for the Backend:**
    Create a `.env` file at `apps/backend/.env` and add the following values. Note that `NEO4J_URI` now points to `localhost`.
    ```env
    # Neo4j Connection
    NEO4J_URI=neo4j://localhost:7687
    NEO4J_USERNAME=neo4j
    NEO4J_PASSWORD=s3cr3tP@ssw0rd
    STREAM_USER_COUNT=30
    ```

5.  **Run the Development Servers:**
    Run `yarn dev` from the project root. Turborepo will start both the Next.js frontend and the NestJS backend in development mode with hot-reloading.
    ```bash
    yarn dev
    ```
    -   **Frontend App** will be available at: `http://localhost:3000`
    -   **Backend API** will be available at: `http://localhost:4000`
    -   **Neo4j Browser** (for viewing database data) will be available at: `http://localhost:7474`

6. **Run Integration Test:**
    Run `turbo run test --filter=backend` from the project root. Turborepo will start run test backend. These tests connect to the actual database configured in your environment.
    **Warning:** Running these tests will **permanently delete all data** in the database and repopulate it with test data. Please ensure you are not running this command against a production database.
    ```bash
    turbo run test --filter=backend
    ```
---

## 📡 API Endpoints (Backend)

The backend provides an API for fetching various analytics data, with the following main endpoints:

-[Postman](https://nontakon-charoen-7812575.postman.co/workspace/My-Team's-Workspace~99e23455-4d80-43fc-8b02-a3a13db3d432/collection/47324752-c17facf8-40b0-4c14-81fd-94ce4509cb50?action=share&creator=47324752)

### Analytics (`/analyics`)
-   **`GET /analyics/network/:username`**: Fetches the user's network relationship data.
-   **`GET /analyics/leaderboard/:type`**: Fetches the leaderboard by `type` (`strength` or `referral`).


### Profile (`/profile`)
-   **`GET /profile/:username`**: Fetches the user's profile, and time-series data of friend and referral.
-   **`GET /profile/:username/influential-friends`**: Fetches a list of influential friends.
-   **`GET /profile/:username/friends`**: Fetches a paginated list of friends.


### Admin (`/admin`)
-   **`POST /admin/stream-data`**: Manually triggers the event data streaming process.
-   **`DELETE /admin/all-data`**: Deletes all data from the database.
-   **`GET /admin/circular-referrals`**: Finds circular referrals example : A referral by B and B refferral by A.
-   **`GET /admin/multi-referrers`**: Finds who have multi referrers.
-   **`POST /admin/users`**: Create user based on payload sent in the Body.
-   **`DELETE /admin/users`**: Deletes users based on a list of names sent in the Body.
-   **`POST /admin/users/relationship/referral`**: Create referral relationship of user based on payload sent in the Body.
-   **`POST /admin/users/relationship/friend`**: Create friend relationship of user based on payload sent in the Body.
-   **`DELETE /admin/users/relationship/friend`**: Delete friend relationship of user based on payload sent in the Body.

### Health Check
-   **`GET /health`**: Checks the server's status.
