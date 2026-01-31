
import sys
import os

# Ensure backend directory is in path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.fraud_service import analyze_transaction, get_defense_engine_stats
import json

def test_fraud_scenarios():
    print("🛡️  Testing Fraud Detection Model...")
    
    # Scene 1: Normal Transaction (Low Risk)
    normal_tx = {
        "amount": 500,
        "hour": 14,  # 2 PM
        "is_international": False,
        "is_new_device": False,
        "distance_from_home": 5,
        "transaction_type": "UPI"
    }
    
    print("\n1️⃣  Testing NORMAL Transaction:")
    print(f"   Input: {json.dumps(normal_tx, indent=2)}")
    result = analyze_transaction(normal_tx)
    print(f"   Result: {'❌ FRAUD' if result['is_fraud'] else '✅ LEGIT'}")
    print(f"   Risk Score: {result['risk_score']}/100")
    print(f"   Model: {result.get('model', 'Unknown')}")

    # Scene 2: Fraud Transaction (High Risk)
    # High amount + Night time + New Device + International
    fraud_tx = {
        "amount": 85000,
        "hour": 3,   # 3 AM (Night)
        "is_international": 1,
        "is_new_device": 1,
        "distance_from_home": 5000,
        "transaction_type": "Credit Card"
    }
    
    print("\n2️⃣  Testing FRAUD Transaction:")
    print(f"   Input: {json.dumps(fraud_tx, indent=2)}")
    result = analyze_transaction(fraud_tx)
    print(f"   Result: {'❌ FRAUD' if result['is_fraud'] else '✅ BLOCK'}")
    print(f"   Risk Score: {result['risk_score']}/100")
    print(f"   Risk Level: {result['risk_level']}")
    
    if 'top_factors' in result:
        print("   🔍 SHAP Explainability (Why was this blocked?):")
        for f in result['top_factors']:
            print(f"     - {f['feature']}: {f['direction']} risk (Impact: {f['impact']:.2f})")

    # Stats
    print("\n📊 Defense Engine Stats:")
    stats = get_defense_engine_stats()
    print(f"   Model Version: {stats.get('modelVersion')}")
    print(f"   ROC-AUC: {stats.get('rocAuc', 'N/A')}")
    print(f"   Recall: {stats.get('recall', 'N/A')}%")

if __name__ == "__main__":
    test_fraud_scenarios()
