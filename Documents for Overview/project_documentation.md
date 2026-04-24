# CivicSense AI: Comprehensive Project Report & Research Documentation

## 1. Abstract
CivicSense AI is a next-generation municipal issue reporting platform designed to streamline the interaction between citizens and local government authorities. Traditional civic reporting systems suffer from data redundancy (spam), misrouting of issues, and a lack of real-time prioritization. CivicSense AI solves these challenges by integrating advanced computer vision (Google Vision AI), Large Language Models (Google Gemini Pro Vision), and geospatial clustering algorithms (Haversine formula). This report outlines the architecture, methodologies, and technical implementation of the platform, demonstrating a highly scalable, autonomous solution for modern urban management.

---

## 2. Problem Statement
Urban infrastructure management relies heavily on citizen reporting to identify issues such as structural damage, illegal dumping, or hazardous road conditions. However, current systems face three critical bottlenecks:
1. **Misrouting and Triage Delays:** Citizens often do not know which department is responsible for a specific issue, leading to misrouted reports that delay resolution.
2. **Redundancy and Spam:** High-visibility issues (e.g., a massive pothole on a busy street) generate duplicate reports from hundreds of citizens, overwhelming municipal databases and dispatchers.
3. **Subjective Prioritization:** Reports are often prioritized chronologically rather than by actual severity or risk to public safety.

---

## 3. Proposed Solution
CivicSense AI introduces a "Mission Control" paradigm that entirely removes the cognitive load from the citizen while automating the triage process for the municipality.
- **Spot & Snap:** The citizen simply takes a photo. The system automatically captures their GPS coordinates.
- **Autonomous AI Analysis:** The image is analyzed in real-time. The system detects the issue, determines the risk severity, and intelligently routes it to the exact municipal authority responsible.
- **Smart Clustering:** To prevent spam, the system calculates the spherical distance between the new report and existing reports. If the issue is identical and geographically collocated, the system deduplicates the entry and instead awards an "Upvote" (🔥) to the original issue, transforming redundant spam into a valuable metric of community urgency.

---

## 4. System Architecture
The platform is built on a decoupled, modern web architecture ensuring high performance and scalability.

### 4.1. Frontend Architecture (Client Layer)
- **Framework:** React.js combined with TypeScript and Vite for rapid compilation and strict type safety.
- **User Interface:** Engineered using TailwindCSS and `shadcn/ui` to create a dark-mode, glassmorphic aesthetic that mimics professional dispatch software.
- **State Management:** React Context API handles global states, specifically the `AuthContext` which manages JWT (JSON Web Token) persistence in browser `localStorage`.
- **Geospatial Mapping:** `react-leaflet` layered over OpenStreetMap tiles provides a dynamic, interactive map plotting real-time civic issues using customized HTML/CSS pulsing markers.

### 4.2. Backend Architecture (Application Layer)
- **Framework:** FastAPI (Python), chosen for its asynchronous capabilities and automatic OpenAPI (Swagger) documentation generation.
- **Authentication:** Stateless authentication flow using `PyJWT` for token generation and `passlib[bcrypt]` for secure password hashing.
- **File Handling:** Multipart form data parsing allows the backend to intercept raw image bytes, save them to a local `/uploads` directory, and simultaneously stream them to the AI models.

### 4.3. Data Persistence (Database Layer)
- **Database:** SQLite managed via SQLAlchemy ORM (Object-Relational Mapping).
- **Schema Design:** A relational structure featuring a `User` table (handling credentials) and a `Report` table with a One-to-Many relationship (one User can have many Reports). The `Report` table stores metadata, AI labels, severity scores, and geospatial coordinates.

---

## 5. Methodology & Algorithms

### 5.1. The Dual-AI Processing Pipeline
To ensure high accuracy and mitigate AI hallucinations, CivicSense utilizes a two-step verification pipeline:
1. **Objective Extraction (Google Vision AI):** The image is first scanned by standard computer vision models to extract objective labels (e.g., `["Asphalt", "Crack", "Water"]`).
2. **Contextual Reasoning (Google Gemini Pro Vision):** The image, along with the extracted labels, is fed into a multimodal LLM. The LLM is instructed via a strict system prompt to act as a City Inspector. It must output a rigidly formatted JSON payload containing:
   - `severity`: (LOW, MEDIUM, HIGH)
   - `priority`: (NORMAL, CRITICAL)
   - `authority`: (e.g., "Department of Transportation")
   - `explanation`: A localized justification of the assessment.

### 5.2. Geospatial Clustering (Haversine Formula)
To combat duplicate reporting, the system employs the **Haversine Formula**, which determines the great-circle distance between two points on a sphere given their longitudes and latitudes.

**Mathematical Implementation:**
```python
a = sin²(Δφ/2) + cos φ1 ⋅ cos φ2 ⋅ sin²(Δλ/2)
c = 2 ⋅ atan2( √a, √(1−a) )
d = R ⋅ c
```
*Where `φ` is latitude, `λ` is longitude, and `R` is the Earth's radius (6,371 km).*

**The Clustering Algorithm Workflow:**
1. Retrieve `Latitude (Lat1)` and `Longitude (Lon1)` from the incoming citizen report via HTML5 Geolocation.
2. Query the database for the 100 most recent reports.
3. For each existing report (`Lat2`, `Lon2`), calculate the Haversine distance `d`.
4. **The Rule:** If `d ≤ 50 meters` **AND** the `authority` matches the incoming report, a duplicate is flagged.
5. **Resolution:** The incoming report is discarded from database creation. Instead, the matching existing report's `upvotes` integer is incremented by `1`.

---

## 6. Implementation Workflows

### 6.1. The Authentication Flow
1. Citizen accesses `/api/register` or `/api/login` with email/password.
2. FastAPI hashes the password using `bcrypt` and stores/verifies it in SQLite.
3. A JWT (JSON Web Token) is generated and returned to the React frontend.
4. The React `AuthContext` saves the token. Subsequent image uploads attach the token in the `Authorization: Bearer <token>` HTTP header.
5. The backend decodes the token, extracting the `user_id`, and permanently links the newly generated `Report` row to that specific citizen.

### 6.2. The Map Layer Integration
1. Upon clicking "Upload", the browser natively prompts for Location Permissions.
2. If granted, exact coordinates are captured. If denied, a programmatic mathematical "jitter" is applied to a default coordinate to ensure map pins do not stack perfectly on top of one another.
3. The `MapDashboard.tsx` component parses the database array and plots `react-leaflet` `<Marker>` nodes.
4. Custom CSS animations (`@keyframes pulse`) dynamically style the markers based on the `severity` string retrieved from the database.

---

## 7. Future Scope and Extensibility
While highly functional, the architecture is designed for future enterprise scaling:
- **Cloud Migration:** Transitioning the SQLite database to a distributed PostgreSQL instance (e.g., AWS RDS) and migrating local image storage to Amazon S3.
- **n8n Webhook Dispatching:** Integrating the `POST /api/report` response with an n8n automation layer to automatically trigger generic SMTP emails, SMS messages (Twilio), or Slack alerts directly to the designated municipal authorities based on `HIGH` severity triggers.
- **Predictive Maintenance:** Utilizing historical hotspot data to predict infrastructural decay before it becomes a public hazard.

---

## 8. Conclusion
CivicSense AI successfully demonstrates how modern web technologies can be orchestrated to solve complex civic challenges. By decentralizing the reporting process while simultaneously centralizing and automating the triage process, municipalities can save thousands of human-hours. Furthermore, the implementation of spatial clustering algorithms ensures that high citizen engagement results in clearer data signals (upvotes) rather than database noise (spam). CivicSense represents a robust blueprint for the "Smart Cities" of the future.
