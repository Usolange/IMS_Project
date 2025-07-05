from flask import Flask, request, jsonify
import pandas as pd
import pickle as pkl
from flask_cors import CORS  

# Load models
randomModel = pkl.load(open('randomModel_Loan_prediction_model.pkl', 'rb'))
xgbModel = pkl.load(open('xgbModel_Loan_prediction_model.pkl', 'rb'))
linearRegrModel = pkl.load(open('LinearRegrModel_Loan_prediction_model.pkl', 'rb'))

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
CORS(app)  # Allow requests from JS frontend if needed

@app.route('/')
def index():
    return '✅ Loan Prediction API is running.'

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()

    try:
        # Input validation
        for field in ['saving_times_per_period', 'total_current_saving', 'completed_saving_cycles',
                      'user_savings_made', 'user_joined_year', 'ikimina_created_year', 'user_age']:
            if int(data[field]) < 0:
                return jsonify({"error": f"{field} must be non-negative."}), 400

        if int(data['user_joined_year']) < int(data['ikimina_created_year']):
            return jsonify({"error": "User joined year cannot be earlier than Ikimina created year."}), 400

        # Derived feature transformation
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

        df = pd.DataFrame([input_dict], columns=final_features)

        # Choose the model
        model_choice = data['model_choice']
        if model_choice == 'Random Forest':
            model = randomModel
        elif model_choice == 'XGBoost':
            model = xgbModel
        elif model_choice == 'Linear Regression':
            model = linearRegrModel
        else:
            return jsonify({"error": "Invalid model choice."}), 400

        # Make prediction
        prediction = model.predict(df)[0]
        return jsonify({
            "allowed_loan": round(prediction, 2),
            "message": f"✅ Predicted allowed loan: {prediction:,.2f} RWF"
        })

    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
