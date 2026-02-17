# RiskLens Dashboard v2 - Enterprise Risk Management System

RiskLens Dashboard is a next-generation Enterprise Risk Management (ERM) application powered by AI. It is designed to help organizations identify, assess, visualize, and mitigate risks using advanced analytics, generative AI, and correlation mapping.

## 🚀 Key Features

### 1. 📊 Intelligent Dashboard
The central hub for risk monitoring and analysis.
- **Dynamic KPI Cards**: Real-time tracking of Financial Exposure, Critical Risks count, Mitigation Costs, and Compliance Rates. Interactive filtering allows users to drill down by clicking on specific KPIs.
- **Interactive Risk Heat Map**: A classic 5x5 matrix (Likelihood x Impact) visualization. Clicking cells filters the risk registry to show specific risk clusters.
- **Risk Trend Analysis**: Stacked bar charts showing the velocity of new risks versus critical escalations over time.
- **Advanced Filtering**: Search by keyword, filter by Business Unit (Sales, IT, Finance, Ops, HR), and Risk Type (Risk vs Issue).

### 2. 🤖 AI Co-Pilot (Powered by Google Gemini)
Integrated directly into the "Add Risk" workflow to improve data quality.
- **Smart Classification**: Automatically detects if input text describes a future "Risk" or a past "Issue" and warns the user of mismatches.
- **Content Refinement**: Generates professional, concise titles and descriptions based on raw user input.
- **Auto-Scoring**: Suggests Likelihood (1-5) and Impact (1-5) scores based on the severity of the description.
- **Duplicate Detection**: Uses Jaccard similarity algorithms (supporting Thai & English) to detect and warn about similar existing risks to prevent duplicates.

### 3. 🕸️ Risk Correlation Network
A visual graph engine that reveals hidden connections between risks.
- **Force-Directed Graph**: Visualizes risks as nodes and relationships as links using HTML5 Canvas.
- **Correlation Engine**: Calculates link strength based on:
  - **Text Similarity**: Keyword overlap.
  - **Shared Business Units**: Organizational dependencies.
  - **Score Proximity**: Similar severity levels.
  - **Temporal Correlation**: Risks occurring around the same dates.
- **Cascade Analysis**: Identifies "Critical Nodes" that, if triggered, could cause a chain reaction of other risks.

### 4. 🎯 Command Center
An executive-focused view optimized for rapid decision-making.
- **Decision Queue**: Prioritizes risks requiring immediate attention (Approve/Reject/Escalate mitigation plans).
- **AI Executive Brief**: A live, AI-generated summary of the most critical threats and financial exposure, condensing complex data into actionable insights (e.g., "Decide now to save $2M").
- **10-Second Decisions**: UI optimized to present only essential info: Urgency, Financial Impact, and AI Recommendations.

### 5. 📑 Weekly Summary & Reporting
Automated reporting tools for management reviews.
- **Automated Insights**: AI-generated highlights for specific departments (e.g., "Sales risks surged 40% due to contract expirations").
- **Distribution Charts**: Visual breakdown of risks by Business Unit.
- **Top Critical Alerts**: A focused list of the top 5 risks requiring immediate board attention.

### 6. 🌍 Bilingual Support
- **Full Localization**: Seamless switching between **English** and **Thai**.
- **Context-Aware**: Date formatting and currency display adapt to the selected locale.

---

## 🛠️ Technology Stack

- **Frontend Framework**: React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS + clsx + tailwind-merge
- **Icons**: Lucide React
- **AI Integration**: Google GenAI SDK (`@google/genai`) - Gemini 2.5 Flash Model
- **Visualization**: HTML5 Canvas (Custom implementation for Network Graph)
- **State Management**: React Context API (Language) + Local State

---

## 📂 Project Structure

```
src/
├── components/          # React Components
│   ├── ui/              # Reusable UI elements (Card, Button, Input, etc.)
│   ├── Dashboard.tsx    # Main dashboard view
│   ├── AddRiskForm.tsx  # Form with AI integration
│   ├── RiskNetwork.tsx  # Canvas-based network graph
│   ├── CommandCenter.tsx# Executive decision view
│   └── ...
├── lib/                 # Utilities and Logic
│   ├── ai.ts            # Google Gemini API integration
│   ├── correlation.ts   # Network graph math & similarity algorithms
│   ├── translations.ts  # EN/TH dictionary
│   └── utils.ts         # Helper functions
├── contexts/            # React Contexts (LanguageProvider)
├── types/               # TypeScript interfaces
└── data/                # Mock data for demonstration
```

## 🧠 AI Integration Details

The application uses `analyzeRiskWithGemini` in `src/lib/ai.ts`.

1.  **Input**: User types a raw title/description.
2.  **Prompting**: A structured prompt is sent to Gemini asking it to:
    *   Classify as Risk vs Issue.
    *   Rewrite for clarity.
    *   Estimate scores.
    *   Provide reasoning in the requested language.
3.  **Output**: Returns a JSON object structured strictly to TypeScript interfaces (`AIAnalysisResult`).
4.  **Fallback**: Includes a robust mock fallback mechanism if the API key is missing or calls fail.

## 🔗 Correlation Logic

The `src/lib/correlation.ts` file implements a weighted scoring algorithm:
*   **Same BU**: +0.3
*   **Text Similarity (Jaccard)**: +0.3 (Tokenizes text into shingles)
*   **Score Similarity**: +0.2
*   **Time Proximity**: +0.2

Links are drawn in the Network View if the total correlation score exceeds a threshold (0.4).

---

## 📝 License

This project is a technical showcase/MVP.
