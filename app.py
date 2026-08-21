import os
import warnings

import joblib
import pandas as pd
from flask import Flask, jsonify, render_template, request

warnings.filterwarnings("ignore")  # silence sklearn version-mismatch chatter in logs

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "Mental_Health_Model.pkl")

app = Flask(__name__)
# Load the model once at startup
model = joblib.load(MODEL_PATH)

REQUIRED_FIELDS = [
    "Study_Hours",
    "Age",
    "Avg_Daily_Usage_Hours",
    "Daily_Unlocks",
    "Physical_Activity_Hours",
    "Sleep_Hours_Per_Night",
    "Stress_Level",
    "Gender",
    "Academic_Level",
    "Most_Used_Platform",
    "Purpose_Of_Use",
    "grouped_contries",
]

NUMERIC_FIELDS = {
    "Study_Hours": (0, 24),
    "Age": (10, 100),
    "Avg_Daily_Usage_Hours": (0, 24),
    "Daily_Unlocks": (0, 1000),
    "Physical_Activity_Hours": (0, 24),
    "Sleep_Hours_Per_Night": (0, 24),
}

VALID_STRESS_LEVELS = ["Low", "Medium", "High", "Very High"]

KNOWN_CATEGORIES = {
    "Gender": ["Female", "Male"],
    "Academic_Level": ["Graduate", "High School", "Undergraduate"],
    "Most_Used_Platform": [
        "Facebook", "Instagram", "KakaoTalk", "LINE", "LinkedIn",
        "Snapchat", "TikTok", "Twitter", "VKontakte", "WeChat",
        "WhatsApp", "YouTube",
    ],
    "Purpose_Of_Use": ["Education", "Entertainment", "Networking", "News"],
    "grouped_contries": [
        "Australia", "Canada", "France", "Germany", "India",
        "Mexico", "Turkey", "UK", "USA", "Other",
    ],
}


def score_to_band(score: float) -> dict:
    if score < 5.0:
        return {"label": "Needs Attention", "color": "#E8845C", "zone": "low"}
    if score < 6.5:
        return {"label": "Getting By", "color": "#E8B95C", "zone": "mid"}
    if score < 8.0:
        return {"label": "Doing Well", "color": "#6FCF97", "zone": "good"}
    return {"label": "Thriving", "color": "#4FD1AE", "zone": "great"}


@app.route("/")
def index():
    return render_template(
        "index.html",
        stress_levels=VALID_STRESS_LEVELS,
        categories=KNOWN_CATEGORIES,
    )


@app.route("/api/predict", methods=["POST"])
def predict():
    payload = request.get_json(silent=True) or {}

    missing = [f for f in REQUIRED_FIELDS if f not in payload or payload[f] in (None, "")]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400


    row = {}
    for field, (lo, hi) in NUMERIC_FIELDS.items():
        try:
            value = float(payload[field])
        except (TypeError, ValueError):
            return jsonify({"error": f"'{field}' must be a number"}), 400
        if not (lo <= value <= hi):
            return jsonify({"error": f"'{field}' should be between {lo} and {hi}"}), 400
        row[field] = value

    stress = payload["Stress_Level"]
    if stress not in VALID_STRESS_LEVELS:
        return jsonify({"error": f"'Stress_Level' must be one of {VALID_STRESS_LEVELS}"}), 400
    row["Stress_Level"] = stress

    for field in ["Gender", "Academic_Level", "Most_Used_Platform", "Purpose_Of_Use", "grouped_contries"]:
        row[field] = str(payload[field])

    try:
        X = pd.DataFrame([row], columns=REQUIRED_FIELDS)
        raw_score = float(model.predict(X)[0])
    except Exception as exc:  # noqa: BLE001
        return jsonify({"error": f"Prediction failed: {exc}"}), 500

    raw_score = max(0.0, min(10.0, raw_score))
    band = score_to_band(raw_score)

    return jsonify(
        {
            "score": round(raw_score, 2),
            "label": band["label"],
            "color": band["color"],
            "zone": band["zone"],
            "disclaimer": (
                "This is an educational estimate from a machine learning model trained on "
                "survey data, not a clinical or diagnostic assessment. If you're struggling, "
                "please reach out to a mental health professional or a trusted person in your life."
            ),
        }
    )


@app.route("/api/health")
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
