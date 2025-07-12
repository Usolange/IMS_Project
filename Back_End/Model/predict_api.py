from flask import Flask, request, jsonify
import pandas as pd
import pickle as pkl

app = Flask(__name__)

# Load model once
randomModel = pkl.load(open('randomModel_Loan_prediction_model.pkl', 'rb'))

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

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    try:
        # Prepare input dict from JSON body
        input_dict = {
            'SavingTimesPerPeriod': data['SavingTimesPerPeriod'],
            'TotalSavingCycles': data['TotalSavingCycles'],
            'CompletedSavingCycles': data['CompletedSavingCycles'],
            'UserSavingsMade': data['UserSavingsMade'],
            'TotalCurrentSaving': float(data['TotalCurrentSaving']),
            'IkiminaCreatedYear': data['IkiminaCreatedYear'],
            'UserJoinedYear': data['UserJoinedYear'],
            'Age': data['Age'],
            'HasGuardian': data['HasGuardian'],
            'IsEmployed': data['IsEmployed'],
            'SavingFrequency_daily': data['SavingFrequency_daily'],
            'SavingFrequency_monthly': data['SavingFrequency_monthly'],
            'SavingFrequency_weekly': data['SavingFrequency_weekly'],
            'RecentLoanPaymentStatus_Bad': data['RecentLoanPaymentStatus_Bad'],
            'RecentLoanPaymentStatus_Better': data['RecentLoanPaymentStatus_Better'],
            'RecentLoanPaymentStatus_Excellent': data['RecentLoanPaymentStatus_Excellent'],
            'RecentLoanPaymentStatus_Good': data['RecentLoanPaymentStatus_Good'],
            'RecentLoanPaymentStatus_Poor': data['RecentLoanPaymentStatus_Poor'],
        }
        df = pd.DataFrame([input_dict], columns=final_features)
        pred = randomModel.predict(df)[0]
        return jsonify({'prediction': round(pred, 2)})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(port=5001)
