# CivicSense AI: Architectural Diagrams & Flowcharts

The following diagrams illustrate the core workflows and architecture of the CivicSense AI platform. You can use these visual models directly in your project book or presentation.

---

## 1. High-Level System Architecture
This diagram shows the relationship between the client interface, the server logic, the local database, and the external AI cloud services.

```mermaid
graph TD
    %% Define styles
    classDef client fill:#1e293b,stroke:#3b82f6,stroke-width:2px,color:#fff
    classDef server fill:#0f172a,stroke:#10b981,stroke-width:2px,color:#fff
    classDef ai fill:#312e81,stroke:#8b5cf6,stroke-width:2px,color:#fff
    classDef db fill:#3f3f46,stroke:#f59e0b,stroke-width:2px,color:#fff

    subgraph Client Layer
        UI["React SPA (Frontend)"]:::client
        Maps["Leaflet Hotspot Map"]:::client
        GPS["HTML5 Geolocation API"]:::client
    end

    subgraph Backend Layer
        FastAPI["FastAPI Server (Python)"]:::server
        Auth["JWT Authentication"]:::server
        Haversine["Haversine Clustering Engine"]:::server
    end

    subgraph External Cloud Services
        Vision["Google Cloud Vision API\n(Object Detection)"]:::ai
        Gemini["Google Gemini Pro Vision\n(Multimodal Analysis)"]:::ai
    end

    subgraph Persistence Layer
        SQLite[("SQLite Database\n(Users & Reports)")]:::db
        FileSystem[("Local Storage\n(/uploads)")]:::db
    end

    %% Connections
    UI -- "POST /api/report\n(Image + Token)" --> FastAPI
    GPS -. "Injects Lat/Lng" .-> UI
    Maps -. "Fetches /api/reports" .-> FastAPI
    
    FastAPI -- "Saves Image" --> FileSystem
    FastAPI -- "Image Bytes" --> Vision
    Vision -- "Labels Array" --> Gemini
    Gemini -- "JSON Payload\n(Severity, Priority, Authority)" --> FastAPI
    
    FastAPI -- "Checks 50m Radius" --> Haversine
    Haversine -- "Query / Update" --> SQLite
    Auth -- "Validates User" --> SQLite
```

---

## 2. Citizen Reporting Workflow
This sequence diagram tracks the lifecycle of a single issue report, from the moment a user uploads a photo to the final dashboard update.

```mermaid
sequenceDiagram
    autonumber
    actor Citizen
    participant Browser as React Frontend
    participant API as FastAPI Backend
    participant Pipeline as AI Pipeline
    participant DB as SQLite DB

    Citizen->>Browser: Uploads Issue Photo
    Browser->>Browser: Requests GPS Geolocation
    Browser->>API: POST /api/report (Image, Lat/Lng, JWT)
    API->>API: Decode JWT & Verify User
    API->>API: Save Image to /uploads
    
    API->>Pipeline: Dispatch Image Bytes
    activate Pipeline
    Pipeline->>Pipeline: Google Vision (Extract Labels)
    Pipeline->>Pipeline: Gemini Pro (Analyze Context)
    Pipeline-->>API: Return JSON (Severity, Routing)
    deactivate Pipeline
    
    API->>DB: Query Recent Reports
    alt Distance < 50m & Same Authority
        API->>DB: Increment Upvotes (Clustered)
    else New Issue
        API->>DB: Create New Report Row
    end
    
    API-->>Browser: Return Report Metadata (200 OK)
    Browser-->>Citizen: Display Result Card & Update Map
```

---

## 3. Smart Clustering (Anti-Spam) Decision Tree
This flowchart details exactly how the backend utilizes the Haversine formula to prevent municipal spam.

```mermaid
flowchart TD
    classDef startend fill:#1e293b,stroke:#cbd5e1,stroke-width:2px,color:#fff
    classDef process fill:#0f172a,stroke:#3b82f6,stroke-width:2px,color:#fff
    classDef decision fill:#312e81,stroke:#f59e0b,stroke-width:2px,color:#fff
    classDef action fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff

    Start([Start Report Creation]):::startend --> P1["AI Analysis Complete\n(Authority & Location determined)"]:::process
    P1 --> P2["Query last 100 reports from DB"]:::process
    
    P2 --> D1{"Are there reports?"}:::decision
    D1 -- No --> A1["Create NEW Report Row\n(Upvotes = 1)"]:::action
    D1 -- Yes --> Loop["Iterate through existing reports"]:::process
    
    Loop --> D2{"Calculate Haversine Distance.\nIs Distance ≤ 50 meters?"}:::decision
    
    D2 -- No --> Loop
    D2 -- Yes --> D3{"Does AI Authority Match?"}:::decision
    
    D3 -- No --> Loop
    D3 -- Yes --> A2["SPAM PREVENTED!\nIncrement existing report's\nUpvote count by 1"]:::action
    
    Loop -. "End of list\n(No matches found)" .-> A1
    
    A1 --> End([Return Report Data to UI]):::startend
    A2 --> End
```

---

## 4. Entity-Relationship (ER) Diagram
This diagram shows how the SQLite database is structured using SQLAlchemy, particularly highlighting the relationship between registered users and their reported issues.

```mermaid
erDiagram
    USERS ||--o{ REPORTS : "owns / creates"

    USERS {
        Integer id PK
        String email "UNIQUE"
        String hashed_password
    }

    REPORTS {
        Integer id PK
        Integer user_id FK "Nullable (Backward compatibility)"
        String image_path
        Float latitude
        Float longitude
        DateTime timestamp
        String labels "JSON String"
        String severity "LOW, MEDIUM, HIGH"
        String priority "NORMAL, CRITICAL"
        String authority "Routing Department"
        String explanation "AI Assessment"
        Integer upvotes "Default: 1"
    }
```
