from flask import Flask, request, jsonify
import pandas as pd
import pickle as pkl
from flask_cors import CORS

# Load Random Forest model only
randomModel = pkl.load(open('randomModel_Loan_prediction_model.pkl', 'rb'))

# Final features used for model training
final_features = [
    'SavingTimesPerPeriod',
    'TotalSavingCycles',
    'CompletedSavingCycles',
    'UserSavingsMade',
    'TotalCurrentSaving',
    'IkiminaCreatedYear',
    'UserJoinedYear',
    'Age',
    'HasGuardian',
    'IsEmployed',
    'SavingFrequency_daily',
    'SavingFrequency_monthly',
    'SavingFrequency_weekly',
    'RecentLoanPaymentStatus_Bad',
    'RecentLoanPaymentStatus_Better',
    'RecentLoanPaymentStatus_Excellent',
    'RecentLoanPaymentStatus_Good',
    'RecentLoanPaymentStatus_Poor'
]

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend access

@app.route('/')
def index():
    return '✅ Loan Prediction Model API is running.'

@app.route('/predict-loan', methods=['POST'])
def predict_loan():
    data = request.get_json()

    try:
        # Required fields without 'model_choice'
        required_fields = [
            'saving_times_per_period', 'completed_saving_cycles', 'user_savings_made',
            'total_current_saving', 'ikimina_created_year', 'user_joined_year',
            'user_age', 'has_guardian', 'employment_status', 'saving_frequency',
            'recent_loan_payment_status'
        ]
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing field: {field}"}), 400

        if int(data['user_joined_year']) < int(data['ikimina_created_year']):
            return jsonify({"error": "User joined year cannot be earlier than Ikimina created year."}), 400

        # Feature transformation
        input_dict = {
            'SavingTimesPerPeriod': int(data['saving_times_per_period']),
            'TotalSavingCycles': int(data['saving_times_per_period']) * (
                365 if data['saving_frequency'] == 'daily' else
                52 if data['saving_frequency'] == 'weekly' else 12
            ),
            'CompletedSavingCycles': int(data['completed_saving_cycles']),
            'UserSavingsMade': int(data['user_savings_made']),
            'TotalCurrentSaving': float(data['total_current_saving']),
            'IkiminaCreatedYear': int(data['ikimina_created_year']),
            'UserJoinedYear': int(data['user_joined_year']),
            'Age': int(data['user_age']),
            'HasGuardian': int(data['has_guardian']),
            'IsEmployed': 1 if data['employment_status'] == 'employed' else 0,
            'SavingFrequency_daily': 1 if data['saving_frequency'] == 'daily' else 0,
            'SavingFrequency_monthly': 1 if data['saving_frequency'] == 'monthly' else 0,
            'SavingFrequency_weekly': 1 if data['saving_frequency'] == 'weekly' else 0,
            'RecentLoanPaymentStatus_Excellent': 1 if data['recent_loan_payment_status'] == 'Excellent' else 0,
            'RecentLoanPaymentStatus_Better': 1 if data['recent_loan_payment_status'] == 'Better' else 0,
            'RecentLoanPaymentStatus_Good': 1 if data['recent_loan_payment_status'] == 'Good' else 0,
            'RecentLoanPaymentStatus_Bad': 1 if data['recent_loan_payment_status'] == 'Bad' else 0,
            'RecentLoanPaymentStatus_Poor': 1 if data['recent_loan_payment_status'] == 'Poor' else 0
        }

        # Create DataFrame with exact columns
        df = pd.DataFrame([input_dict], columns=final_features)

        # Use random forest model only
        prediction = float(randomModel.predict(df)[0])
        return jsonify({
            "allowed_loan": round(prediction, 2),
            "message": f"✅ Predicted allowed loan: {prediction:,.2f} RWF"
        })

    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
