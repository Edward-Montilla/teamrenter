> **Companion Document** — Slice 50 dependency graph and project status visualization.
> **Related**: `slices/50-slice-new-fe-integration-plan.md` (integration plan), `proj_docs/obstaclesV2.md` (obstacles).

```mermaid
graph TB
    subgraph legend["Legend"]
        direction LR
        done_l["✅ Done"]:::done
        partial_l["🔶 Partial"]:::partial
        todo_l["⬜ To Do"]:::todo
        s50_l["🔷 Slice 50"]:::s50
    end

    %% ============ COMPLETED FOUNDATION ============
    subgraph foundation["Foundation (Complete)"]
        direction TB
        S01["S01: Public Browse/Search"]:::done
        S02["S02: Property Detail"]:::done
        S03["S03: Review Form"]:::done
        S04["S04: DB Foundation"]:::done
        S05["S05: RLS + Roles + Security"]:::done
    end

    S01 --> S02 --> S03
    S03 --> S04 --> S05

    %% ============ COMPLETED INTEGRATION ============
    subgraph integration["Integration & Admin (Complete)"]
        direction TB
        S06["S06: Public Reads (Supabase)"]:::done
        S07["S07: Review Submission"]:::done
        S08["S08: Admin Properties CRUD"]:::done
        S09["S09: Admin Moderation + Audit"]:::done
        S10["S10: Distilled Insights"]:::done
        S11["S11: Photos via R2"]:::partial
        S12["S12: Authentication"]:::done
    end

    S05 --> S06
    S05 --> S07
    S05 --> S08
    S05 --> S09
    S07 --> S10
    S09 --> S10
    S05 --> S11
    S08 --> S11
    S05 --> S12

    %% ============ COMPLETED POLISH ============
    subgraph polish["UX & Admin Polish (Complete)"]
        direction TB
        S13["S13: UI/UX Polish"]:::done
        S14["S14: Admin Access Request"]:::done
        S15["S15: Gestalt UI System (spec)"]:::done
        S16["S16: Mobile-First UX (spec)"]:::done
        S17["S17: Admin Command Center"]:::done
    end

    S06 --> S13
    S12 --> S13
    S05 --> S14
    S09 --> S14
    S12 --> S14
    S08 --> S17
    S09 --> S17
    S12 --> S17
    S14 --> S17

    %% ============ OUTSTANDING SLICES ============
    subgraph outstanding["Outstanding Slices"]
        direction TB
        S18["S18: UI Design Improvements\n(headers, breadcrumbs, profile)"]:::todo
        S19["S19: Mobile Hamburger Menu\n& Nav Drawer"]:::todo
        S20["S20: NLP Semantic\nRenter Feedback"]:::todo
    end

    S13 --> S18
    S13 --> S19
    S07 --> S20
    S09 --> S20
    S10 --> S20

    %% ============ SLICE 50 ============
    subgraph slice50["Slice 50: New FE Integration"]
        direction TB

        subgraph p1["Phase 1: Documentation"]
            P1["Update PRD, SRS, Tech Spec,\nSchema & ERD, themes.md\n• Add landlord persona\n• Confirm 5-metric model\n• Confirm Next.js-only"]:::s50
        end

        subgraph p2["Phase 2: Design System"]
            P2["Unify Design Tokens\n• Resolve palette conflict\n  (navy/amber vs purple/teal)\n• Typography decision\n  (Geist vs Playfair vs Lora)\n• Inline hex → token map\n• Component inventory"]:::s50
        end

        subgraph p3["Phase 3: Schema & Types"]
            P3["DB Migrations + Types\n• 7 new tables\n  (neighbourhoods, shortlists,\n   portfolio, team, benchmarks…)\n• Add 'landlord' role\n• New RLS policies\n• 10+ new API contracts\n• Validation schemas"]:::s50
        end

        subgraph p4["Phase 4: Consumer UX"]
            P4A["/neighbourhoods\nbrowsing"]:::s50
            P4B["/comparison\nside-by-side"]:::s50
            P4C["Enhanced Search\nfilters + sort"]:::s50
            P4D["TrustScoreBadge +\nCategoryScoreBar"]:::s50
            P4E["Review Wizard\nmotion transitions"]:::s50
            P4F["/dashboard\nreviews + shortlist"]:::s50
            P4G["Shortlist\nheart/bookmark"]:::s50
        end

        subgraph p5["Phase 5: Business Portal"]
            P5A["/portal layout\n+ landlord auth gate"]:::s50
            P5B["/portal dashboard\nportfolio overview"]:::s50
            P5C["/portal/reviews\nfeed + responses"]:::s50
            P5D["/portal/performance\ncategory analytics"]:::s50
            P5E["/portal/benchmarks\ncity comparisons"]:::s50
            P5F["/portal/signals\nsentiment trends"]:::s50
            P5G["/portal/alerts\nreview gap monitoring"]:::s50
            P5H["/portal/team\nrole-based access"]:::s50
            P5I["/portal/profile\n+ /portal/settings"]:::s50
        end

        subgraph p6["Phase 6: Shared Infrastructure"]
            P6["Cross-Cutting Concerns\n• Portal API client\n• State mgmt (Zustand?)\n• WCAG 2.1 AA audit\n• Mobile responsive portal\n• Error boundaries\n• Loading skeletons"]:::s50
        end

        subgraph p7["Phase 7: Cleanup"]
            P7["Deprecation & Removal\n• Delete New FE/ directory\n• Delete root SPA stub\n• Dependency audit\n• Lint + typecheck pass\n• Update ARCHITECTURE.md"]:::s50
        end
    end

    %% ============ SLICE 50 INTERNAL DEPS ============
    P1 --> P2 --> P3
    P3 --> P4A
    P3 --> P4B
    P3 --> P4C
    P3 --> P4D
    P3 --> P4E
    P3 --> P4F
    P3 --> P4G
    P3 --> P5A
    P5A --> P5B
    P5A --> P5C
    P5A --> P5D
    P5A --> P5E
    P5A --> P5F
    P5A --> P5G
    P5A --> P5H
    P5A --> P5I
    P4A --> P6
    P4F --> P6
    P5B --> P6
    P5H --> P6
    P6 --> P7

    %% ============ EXTERNAL DEPS INTO SLICE 50 ============
    S17 -.->|"depends on\nslices 01-17"| P1
    S11 -.->|"photo system\nneeded"| P4D
    S19 -.->|"hamburger pattern\nneeded for portal"| P6

    %% ============ PROTOTYPE SOURCES ============
    subgraph prototypes["New FE Prototypes (Vite + React Router)"]
        direction LR
        FL["Facelift\n• 10 pages\n• 7-category model ✗\n• Mock data only\n• Lora + DM Sans"]:::proto
        BP["Business Portal\n• 10 portal screens\n• Mock data only\n• Playfair + Inter"]:::proto
    end

    FL -.->|"UX patterns\ninspire"| p4
    BP -.->|"UX patterns\ninspire"| p5

    %% ============ TECH STACK ============
    subgraph stack["Production Stack"]
        direction LR
        NX["Next.js 16\nApp Router"]:::stack
        RE["React 19"]:::stack
        SB["Supabase\nPostgres + RLS"]:::stack
        TW["Tailwind 4"]:::stack
        TS["TypeScript 5"]:::stack
    end

    %% ============ STYLES ============
    classDef done fill:#22c55e,stroke:#16a34a,color:#fff,rx:8
    classDef partial fill:#f59e0b,stroke:#d97706,color:#fff,rx:8
    classDef todo fill:#e5e7eb,stroke:#9ca3af,color:#374151,rx:8
    classDef s50 fill:#3b82f6,stroke:#2563eb,color:#fff,rx:8
    classDef proto fill:#a78bfa,stroke:#7c3aed,color:#fff,rx:8
    classDef stack fill:#1e293b,stroke:#0f172a,color:#fff,rx:8

    style foundation fill:#f0fdf4,stroke:#86efac,rx:12
    style integration fill:#f0fdf4,stroke:#86efac,rx:12
    style polish fill:#f0fdf4,stroke:#86efac,rx:12
    style outstanding fill:#fef9c3,stroke:#fde047,rx:12
    style slice50 fill:#eff6ff,stroke:#93c5fd,rx:12
    style p1 fill:#dbeafe,stroke:#93c5fd,rx:8
    style p2 fill:#dbeafe,stroke:#93c5fd,rx:8
    style p3 fill:#dbeafe,stroke:#93c5fd,rx:8
    style p4 fill:#dbeafe,stroke:#93c5fd,rx:8
    style p5 fill:#dbeafe,stroke:#93c5fd,rx:8
    style p6 fill:#dbeafe,stroke:#93c5fd,rx:8
    style p7 fill:#dbeafe,stroke:#93c5fd,rx:8
    style prototypes fill:#f5f3ff,stroke:#c4b5fd,rx:12
    style stack fill:#f8fafc,stroke:#cbd5e1,rx:12
    style legend fill:#fff,stroke:#e5e7eb,rx:8
```
