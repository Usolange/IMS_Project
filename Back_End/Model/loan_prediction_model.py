from flask import Flask, request, jsonify
import pandas as pd
import pickle as pkl
from flask_cors import CORS

# Load the trained model
randomModel = pkl.load(open("randomModel_Loan_prediction_model.pkl", "rb"))

# Match these exactly to what you used during training
final_features = [
    "SavingFrequency",
    "SavingTimesPerPeriod",
    "TotalCurrentSaving",
    "CompletedSavingCycles",
    "UserSavingsMade",
    "HasGuardian",
    "RecentLoanPaymentStatus",
    "UserJoinedYear",
    "IkiminaCreatedYear"
]

app = Flask(__name__)
CORS(app)

@app.route('/predict-loan', methods=['POST'])
def predict_loan():
    data = request.get_json()

    try:
        required_fields = [
            'saving_frequency', 'saving_times_per_period',
            'total_current_saving', 'completed_saving_cycles',
            'user_savings_made', 'has_guardian',
            'recent_loan_payment_status', 'user_joined_year',
            'ikimina_created_year'
        ]
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing field: {field}"}), 400

        if int(data['user_joined_year']) < int(data['ikimina_created_year']):
            return jsonify({"error": "User joined year cannot be earlier than Ikimina created year."}), 400

        input_dict = {
            "SavingFrequency": int(data['saving_frequency']),
            "SavingTimesPerPeriod": int(data['saving_times_per_period']),
            "TotalCurrentSaving": float(data['total_current_saving']),
            "CompletedSavingCycles": int(data['completed_saving_cycles']),
            "UserSavingsMade": int(data['user_savings_made']),
            "HasGuardian": int(data['has_guardian']),
            "RecentLoanPaymentStatus": int(data['recent_loan_payment_status']),
            "UserJoinedYear": int(data['user_joined_year']),
            "IkiminaCreatedYear": int(data['ikimina_created_year']),
        }

        df = pd.DataFrame([input_dict], columns=final_features)
        prediction = float(randomModel.predict(df)[0])

        return jsonify({
            "allowed_loan": round(prediction, 2),
            "message": f"✅ Predicted allowed loan: {prediction:,.2f} RWF"
        })

    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
