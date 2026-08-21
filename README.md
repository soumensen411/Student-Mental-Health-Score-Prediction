# Mind Signal — Student Mental Health Score Predictor

A Flask API + vanilla HTML/CSS/JS frontend built around a scikit-learn Random
Forest pipeline. Given a student's daily habits — screen time, sleep, study
load, stress, and a few other signals — it predicts a **Mental Health Score
from 0–10**.

---

## ✨ Features

- **3-step guided form** — daily habits → context → current stress level
- **Animated semicircle gauge** that fills and colors itself based on the
  predicted score
- **Flask REST API** (`/api/predict`) that can be called independently of
  the UI — e.g. from a mobile app or another service
- Graceful handling of unseen categories (e.g. a country outside the top-10
  the model was trained on) — no crashes, just an "unknown" encoding
- Built-in disclaimer: this is an educational/statistical estimate, not a
  clinical diagnosis

---

## 🗂 Project structure

```
mental-health-predictor/
├── app.py                    # Flask app: serves the frontend + /api/predict
├── Mental_Health_Model.pkl   # trained sklearn pipeline (preprocessing + RandomForest)
├── requirements.txt
├── templates/
│   └── index.html            # multi-step form + result gauge
└── static/
    ├── css/style.css
    └── js/script.js
```

---

## 🚀 Getting started

```bash
git clone https://github.com/<your-username>/mind-signal-predictor.git
cd mind-signal-predictor

python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

pip install -r requirements.txt
python app.py
```

Open **http://127.0.0.1:5000** in your browser.

> ⚠️ Open it through the running server, not by double-clicking
> `templates/index.html`. The page relies on Flask's Jinja templating to
> inject option values into the dropdowns — opening the raw file directly
> (`file://...`) will just show `{{ }}` placeholders instead of real values.

---

## 🔌 API reference

### `POST /api/predict`

**Request body** (all fields required):

| Field | Type | Notes |
|---|---|---|
| `Study_Hours` | number | 0–24 |
| `Age` | number | 10–100 |
| `Avg_Daily_Usage_Hours` | number | 0–24, social media use |
| `Daily_Unlocks` | number | 0–1000, phone unlocks/day |
| `Physical_Activity_Hours` | number | 0–24 |
| `Sleep_Hours_Per_Night` | number | 0–24 |
| `Stress_Level` | string | `Low` \| `Medium` \| `High` \| `Very High` |
| `Gender` | string | `Female` \| `Male` |
| `Academic_Level` | string | `High School` \| `Undergraduate` \| `Graduate` |
| `Most_Used_Platform` | string | e.g. `Instagram`, `TikTok`, `YouTube`, … |
| `Purpose_Of_Use` | string | `Education` \| `Entertainment` \| `Networking` \| `News` |
| `grouped_contries` | string | one of the top-10 training countries, or `Other` |

**Example**

```bash
curl -X POST http://127.0.0.1:5000/api/predict \
  -H "Content-Type: application/json" \
  -d '{
    "Study_Hours": 3.5,
    "Age": 21,
    "Avg_Daily_Usage_Hours": 5.0,
    "Daily_Unlocks": 170,
    "Physical_Activity_Hours": 1.5,
    "Sleep_Hours_Per_Night": 7.0,
    "Stress_Level": "Medium",
    "Gender": "Male",
    "Academic_Level": "Undergraduate",
    "Most_Used_Platform": "Instagram",
    "Purpose_Of_Use": "Entertainment",
    "grouped_contries": "USA"
  }'
```

**Response**

```json
{
  "score": 6.14,
  "label": "Getting By",
  "color": "#E8B95C",
  "zone": "mid",
  "disclaimer": "This is an educational estimate from a machine learning model trained on survey data, not a clinical or diagnostic assessment. If you're struggling, please reach out to a mental health professional or a trusted person in your life."
}
```

### `GET /api/health`

Returns `{"status": "ok"}` — used by Render for health checks.

---

## 🧠 About the model

- **Pipeline:** `ColumnTransformer` (log-transform + scale `Study_Hours`,
  scale the other numeric fields, ordinal-encode `Stress_Level`, one-hot
  encode the remaining categoricals) → `RandomForestRegressor` (default
  hyperparameters — not the tuned version from the notebook's
  `RandomizedSearchCV` step).
- `scikit-learn` is pinned to `1.6.1` in `requirements.txt` because that's
  the version the `.pkl` was saved with. Loading it with a different
  version can throw unpickling errors or silently change predictions.
- `grouped_contries` accepts any of the top-10 training countries or
  `"Other"`. Anything else is safely ignored by the one-hot encoder rather
  than causing an error.

---

## ⚠️ Disclaimer

This project is for educational and portfolio purposes. The predicted score
is a statistical estimate from a model trained on survey data — **it is not
a medical or psychological diagnosis**. If you or someone you know is
struggling, please reach out to a licensed mental health professional or a
trusted person in your life.

---
