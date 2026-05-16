# PULSE — REAL-TIME DAO INTELLIGENCE ENGINE

PULSE is a production-grade backend system that provides real-time health monitoring for Web3 communities by integrating directly with the Zero Authority DAO API.

## 🛑 STRICT OPERATIONAL RULES

1. **NO MOCK DATA**: The system only returns verified truth from live APIs or MongoDB history.
2. **NO FABRICATION**: If data is missing or APIs are down, the system returns explicit error states.
3. **REAL-TIME COMPUTATION**: Health scores are computed on-the-fly using live metrics.
4. **SNAPSHOT INTEGRITY**: Every snapshot stores the raw API response for auditability.

## Architecture

- `server.js`: Entry point with global error handling.
- `services/apiService.js`: Zero Authority API integration with retries.
- `services/healthService.js`: Deterministic health computation engine.
- `controllers/apiController.js`: Orchestrates the Fetch -> Compute -> Store -> Return flow.
- `models/Snapshot.js`: Persistence layer for live snapshots.
- `middlewares/errorMiddleware.js`: Unified production error responses.

## API Endpoints

- `GET /api/health/:daoId`: Fetch live metrics and compute health score.
- `GET /api/contributors/:daoId`: Live contributor list from Zero Authority.
- `GET /api/bounties/:daoId`: Live bounty lifecycle data.
- `GET /api/snapshots/:daoId`: Historical snapshots from MongoDB.
- `GET /api/insights/:daoId`: Intelligence insights based on real data.

## Setup

1. **Environment**: Copy `.env.example` to `.env` and provide your `ZERO_AUTH_API_KEY`.
2. **Install**: `npm install`
3. **Run**: `npm start`

## Error Codes

- `API_FAILURE`: External API returned an error or timed out.
- `INSUFFICIENT_DATA`: API response lacked metrics for health computation.
- `DB_ERROR`: MongoDB persistence failure.
- `AI_DISABLED`: Groq insights requested but no `GROQ_API_KEY` configured.

---
*PULSE: Verified Truth for Decentralized Civilizations.*
