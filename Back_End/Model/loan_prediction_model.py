from flask import Flask, request, jsonify
import pandas as pd
import pickle as pkl
from flask_cors import CORS

# Load model
randomModel = pkl.load(open("randomModel_Loan_prediction_model.pkl", "rb"))

# Final features used during training (must match order exactly)
final_features = [
    'SavingTimesPerPeriod',
    'TotalSavingCycles',
    'CompletedSavingCycles',
    'UserSavingsMade',
    'TotalCurrentSaving',
    'IkiminaCreatedYear',
    'UserJoinedYear',
    'HasGuardian',
    'SavingFrequency_daily',
    'SavingFrequency_weekly',
    'SavingFrequency_monthly',
    'RecentLoanPaymentStatus_Excellent',
    'RecentLoanPaymentStatus_Better',
    'RecentLoanPaymentStatus_Good',
    'RecentLoanPaymentStatus_Bad',
    'RecentLoanPaymentStatus_Poor'
]

app = Flask(__name__)
CORS(app)

def map_backend_status_to_model(status_code):
    # Map backend codes (0 to 5) to model codes (0 to 4)
    mapping = {
        0: 0,  # NoLoans or Poor -> Poor
        1: 0,  # Poor -> Poor
        2: 1,  # Bad -> Bad
        3: 2,  # Good -> Good
        4: 3,  # Better -> Better
        5: 4   # Excellent -> Excellent
    }
    return mapping.get(status_code, 0)  # Default to Poor if unknown

@app.route('/predict-loan', methods=['POST'])
def predict_loan():
    data = request.get_json()

    try:
        required_fields = [
            'saving_times_per_period',
            'total_saving_cycles',
            'completed_saving_cycles',
            'user_savings_made',
            'total_current_saving',
            'ikimina_created_year',
            'user_joined_year',
            'has_guardian',
            'saving_frequency',          # expected as int: 1=daily, 2=weekly, 3=monthly
            'recent_loan_payment_status' # expected as int code: 0 to 5 backend codes
        ]
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing field: {field}"}), 400

        if int(data['user_joined_year']) < int(data['ikimina_created_year']):
            return jsonify({"error": "User joined year cannot be earlier than Ikimina created year."}), 400

        # One-hot encoding for SavingFrequency
        saving_frequency = int(data['saving_frequency'])
        saving_freq_onehot = {
            'SavingFrequency_daily': 1 if saving_frequency == 1 else 0,
            'SavingFrequency_weekly': 1 if saving_frequency == 2 else 0,
            'SavingFrequency_monthly': 1 if saving_frequency == 3 else 0,
        }

        # Map backend recent loan payment status to model status
        backend_status = int(data['recent_loan_payment_status'])
        recent_status = map_backend_status_to_model(backend_status)

        # One-hot encoding for RecentLoanPaymentStatus (0=Poor ... 4=Excellent)
        recent_status_onehot = {
            'RecentLoanPaymentStatus_Poor': 1 if recent_status == 0 else 0,
            'RecentLoanPaymentStatus_Bad': 1 if recent_status == 1 else 0,
            'RecentLoanPaymentStatus_Good': 1 if recent_status == 2 else 0,
            'RecentLoanPaymentStatus_Better': 1 if recent_status == 3 else 0,
            'RecentLoanPaymentStatus_Excellent': 1 if recent_status == 4 else 0,
        }

        # Prepare full feature dict
        input_dict = {
            'SavingTimesPerPeriod': int(data['saving_times_per_period']),
            'TotalSavingCycles': int(data['total_saving_cycles']),
            'CompletedSavingCycles': int(data['completed_saving_cycles']),
            'UserSavingsMade': int(data['user_savings_made']),
            'TotalCurrentSaving': float(data['total_current_saving']),
            'IkiminaCreatedYear': int(data['ikimina_created_year']),
            'UserJoinedYear': int(data['user_joined_year']),
            'HasGuardian': int(data['has_guardian']),
            **saving_freq_onehot,
            **recent_status_onehot
        }

        # Make DataFrame with correct column order
        df = pd.DataFrame([input_dict], columns=final_features)

        # Predict
        prediction = float(randomModel.predict(df)[0])

        return jsonify({
            "allowed_loan": round(prediction, 2),
            "message": f"✅ Predicted allowed loan: {prediction:,.2f} RWF"
        })

    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
