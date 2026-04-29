# A2A Trip Planner — Industry Ready Checklist

## Phase 1 — Stability First
- [x] Fix currency source-of-truth across navbar, booking panel, result panel, and catalog cards
- [x] Fix product category bar overlap / spacing on all screen sizes
- [x] Fix budget input behavior without reset button
- [x] Remove all fake-looking labels like "estimated" where possible
- [x] Add consistent loading, empty, success, and error states

## Phase 2 — Product Intelligence
- [x] Add Trip Intelligence Score
- [x] Add Budget Health Score
- [x] Add Route Feasibility Score
- [x] Add Price Confidence Score
- [x] Add Weather Risk Score
- [x] Add Plan Quality Score

## Phase 3 — Backend Hardening
- [ ] Add request validation
- [ ] Add structured API response schema
- [x] Add backend error codes
- [ ] Add fallback strategy for failed providers
- [ ] Add caching for repeated route searches
- [x] Add request IDs for debugging
- [x] Add backend health endpoint
- [x] Upgrade health endpoint with timestamp + request ID

## Phase 4 — Real Product Features
- [ ] Save trips with login
- [ ] My Trips page
- [ ] Export trip as PDF
- [ ] Copy itinerary
- [ ] Recheck live prices
- [ ] Optimize budget button
- [ ] Compare cheapest / balanced / comfort / fastest modes

## Phase 5 — Testing
- [ ] Add backend unit tests
- [ ] Add frontend component tests
- [ ] Add Playwright end-to-end tests
- [ ] Test currency switching
- [ ] Test budget update without reset
- [ ] Test route swap
- [ ] Test one-way / round-trip / multi-city flow

## Phase 6 — Deployment Quality
- [ ] Add `.env.example`
- [ ] Add Docker setup
- [ ] Add production README
- [ ] Add architecture diagram
- [ ] Add API documentation
- [ ] Add demo video script
- [ ] Add known limitations section