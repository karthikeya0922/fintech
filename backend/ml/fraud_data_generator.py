"""
Finova - Synthetic Fraud Transaction Data Generator
Generates 500K+ realistic Indian financial transactions for ML training
"""
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
import random
import hashlib
import json

# ============================================================
# CONFIGURATION
# ============================================================

# Indian cities with approximate coordinates
INDIAN_CITIES = [
    {'name': 'Mumbai', 'lat': 19.0760, 'lon': 72.8777, 'tier': 1, 'weight': 0.20},
    {'name': 'Delhi', 'lat': 28.6139, 'lon': 77.2090, 'tier': 1, 'weight': 0.18},
    {'name': 'Bangalore', 'lat': 12.9716, 'lon': 77.5946, 'tier': 1, 'weight': 0.15},
    {'name': 'Chennai', 'lat': 13.0827, 'lon': 80.2707, 'tier': 1, 'weight': 0.10},
    {'name': 'Hyderabad', 'lat': 17.3850, 'lon': 78.4867, 'tier': 1, 'weight': 0.10},
    {'name': 'Kolkata', 'lat': 22.5726, 'lon': 88.3639, 'tier': 1, 'weight': 0.08},
    {'name': 'Pune', 'lat': 18.5204, 'lon': 73.8567, 'tier': 1, 'weight': 0.06},
    {'name': 'Ahmedabad', 'lat': 23.0225, 'lon': 72.5714, 'tier': 2, 'weight': 0.04},
    {'name': 'Jaipur', 'lat': 26.9124, 'lon': 75.7873, 'tier': 2, 'weight': 0.03},
    {'name': 'Lucknow', 'lat': 26.8467, 'lon': 80.9462, 'tier': 2, 'weight': 0.02},
    {'name': 'Chandigarh', 'lat': 30.7333, 'lon': 76.7794, 'tier': 2, 'weight': 0.02},
    {'name': 'Kochi', 'lat': 9.9312, 'lon': 76.2673, 'tier': 2, 'weight': 0.02},
]

# Transaction types with weights
TRANSACTION_TYPES = [
    {'type': 'UPI', 'weight': 0.45, 'avg_amount': 1500, 'max_amount': 100000},
    {'type': 'IMPS', 'weight': 0.20, 'avg_amount': 8000, 'max_amount': 200000},
    {'type': 'NEFT', 'weight': 0.10, 'avg_amount': 25000, 'max_amount': 1000000},
    {'type': 'Card', 'weight': 0.15, 'avg_amount': 3500, 'max_amount': 500000},
    {'type': 'Wallet', 'weight': 0.08, 'avg_amount': 500, 'max_amount': 20000},
    {'type': 'ATM', 'weight': 0.02, 'avg_amount': 5000, 'max_amount': 25000},
]

# Merchant categories
MERCHANT_CATEGORIES = [
    {'category': 'E-commerce', 'weight': 0.25, 'fraud_risk': 0.04},
    {'category': 'P2P Transfer', 'weight': 0.20, 'fraud_risk': 0.03},
    {'category': 'Utilities', 'weight': 0.15, 'fraud_risk': 0.01},
    {'category': 'Groceries', 'weight': 0.12, 'fraud_risk': 0.01},
    {'category': 'Travel', 'weight': 0.08, 'fraud_risk': 0.05},
    {'category': 'Entertainment', 'weight': 0.06, 'fraud_risk': 0.03},
    {'category': 'Healthcare', 'weight': 0.05, 'fraud_risk': 0.02},
    {'category': 'Education', 'weight': 0.04, 'fraud_risk': 0.01},
    {'category': 'ATM Withdrawal', 'weight': 0.03, 'fraud_risk': 0.06},
    {'category': 'Forex/Crypto', 'weight': 0.02, 'fraud_risk': 0.10},
]


def _weighted_choice(items: List[Dict], weight_key: str = 'weight') -> Dict:
    """Select item based on weights"""
    weights = [item[weight_key] for item in items]
    return random.choices(items, weights=weights, k=1)[0]


def _generate_amount(tx_type: Dict, is_fraud: bool = False) -> float:
    """Generate realistic transaction amount"""
    avg = tx_type['avg_amount']
    max_amt = tx_type['max_amount']
    
    if is_fraud:
        # Fraud transactions tend to be higher value
        amount = np.random.lognormal(mean=np.log(avg * 3), sigma=1.2)
    else:
        # Normal transactions follow lognormal distribution
        amount = np.random.lognormal(mean=np.log(avg), sigma=0.8)
    
    # Round and cap
    amount = round(min(amount, max_amt), 2)
    return max(10, amount)  # Minimum ₹10


def _generate_device_id(user_id: str, device_num: int = 0) -> str:
    """Generate consistent device ID for user"""
    hash_input = f"{user_id}_device_{device_num}"
    return f"DEV-{hashlib.md5(hash_input.encode()).hexdigest()[:8].upper()}"


def _generate_ip_address(is_suspicious: bool = False) -> str:
    """Generate IP address"""
    if is_suspicious:
        # Suspicious IPs from known VPN/proxy ranges
        prefixes = ['45.227', '185.220', '192.42', '104.244']
        prefix = random.choice(prefixes)
        return f"{prefix}.{random.randint(1, 254)}.{random.randint(1, 254)}"
    else:
        # Normal Indian ISP ranges
        prefixes = ['103.', '49.', '122.', '106.', '59.', '27.']
        prefix = random.choice(prefixes)
        return f"{prefix}{random.randint(1, 254)}.{random.randint(1, 254)}.{random.randint(1, 254)}"


def _haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two coordinates in km"""
    R = 6371  # Earth's radius in km
    
    lat1, lon1, lat2, lon2 = map(np.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    
    a = np.sin(dlat/2)**2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon/2)**2
    c = 2 * np.arcsin(np.sqrt(a))
    
    return R * c


class TransactionGenerator:
    """Generate synthetic transaction data with fraud patterns"""
    
    def __init__(self, num_users: int = 10000, fraud_rate: float = 0.04):
        self.num_users = num_users
        self.fraud_rate = fraud_rate
        self.users = self._create_users()
        
    def _create_users(self) -> List[Dict]:
        """Create user profiles with home location and typical behavior"""
        users = []
        for i in range(self.num_users):
            home_city = _weighted_choice(INDIAN_CITIES)
            
            user = {
                'user_id': f"USR-{i+1:06d}",
                'home_city': home_city['name'],
                'home_lat': home_city['lat'],
                'home_lon': home_city['lon'],
                'primary_device': _generate_device_id(f"USR-{i+1:06d}", 0),
                'secondary_device': _generate_device_id(f"USR-{i+1:06d}", 1) if random.random() < 0.3 else None,
                'avg_tx_per_day': np.random.lognormal(mean=1.0, sigma=0.5),
                'avg_amount': np.random.lognormal(mean=7.5, sigma=0.8),  # ~₹1800 avg
                'created_days_ago': random.randint(30, 1000),
            }
            users.append(user)
        return users
    
    def _generate_normal_transaction(self, user: Dict, timestamp: datetime) -> Dict:
        """Generate a normal (non-fraudulent) transaction"""
        tx_type = _weighted_choice(TRANSACTION_TYPES)
        merchant = _weighted_choice(MERCHANT_CATEGORIES)
        
        # Location - usually near home, occasionally travel
        if random.random() < 0.9:
            # Near home
            lat = user['home_lat'] + np.random.normal(0, 0.05)
            lon = user['home_lon'] + np.random.normal(0, 0.05)
            city = user['home_city']
        else:
            # Travel to another city
            travel_city = _weighted_choice(INDIAN_CITIES)
            lat = travel_city['lat'] + np.random.normal(0, 0.02)
            lon = travel_city['lon'] + np.random.normal(0, 0.02)
            city = travel_city['name']
        
        distance_from_home = _haversine_distance(
            user['home_lat'], user['home_lon'], lat, lon
        )
        
        # Device - usually primary
        if user['secondary_device'] and random.random() < 0.15:
            device_id = user['secondary_device']
            is_new_device = False
        else:
            device_id = user['primary_device']
            is_new_device = False
        
        return {
            'user_id': user['user_id'],
            'amount': _generate_amount(tx_type, is_fraud=False),
            'transaction_type': tx_type['type'],
            'merchant_category': merchant['category'],
            'timestamp': timestamp,
            'hour': timestamp.hour,
            'day_of_week': timestamp.weekday(),
            'is_weekend': timestamp.weekday() >= 5,
            'device_id': device_id,
            'ip_address': _generate_ip_address(is_suspicious=False),
            'latitude': round(lat, 4),
            'longitude': round(lon, 4),
            'city': city,
            'distance_from_home': round(distance_from_home, 2),
            'is_new_device': is_new_device,
            'is_new_location': distance_from_home > 500,
            'is_international': False,
            'failed_attempts': 0 if random.random() < 0.95 else random.randint(1, 2),
            'is_fraud': 0
        }
    
    def _inject_velocity_fraud(self, user: Dict, base_timestamp: datetime) -> List[Dict]:
        """Inject velocity abuse pattern - multiple rapid transactions"""
        transactions = []
        num_txs = random.randint(5, 12)
        
        for i in range(num_txs):
            timestamp = base_timestamp + timedelta(minutes=random.randint(1, 8))
            base_timestamp = timestamp
            
            tx_type = _weighted_choice(TRANSACTION_TYPES)
            tx = {
                'user_id': user['user_id'],
                'amount': _generate_amount(tx_type, is_fraud=True),
                'transaction_type': tx_type['type'],
                'merchant_category': random.choice(['E-commerce', 'P2P Transfer', 'Forex/Crypto']),
                'timestamp': timestamp,
                'hour': timestamp.hour,
                'day_of_week': timestamp.weekday(),
                'is_weekend': timestamp.weekday() >= 5,
                'device_id': _generate_device_id(user['user_id'], random.randint(5, 10)),
                'ip_address': _generate_ip_address(is_suspicious=True),
                'latitude': user['home_lat'],
                'longitude': user['home_lon'],
                'city': user['home_city'],
                'distance_from_home': 0,
                'is_new_device': True,
                'is_new_location': False,
                'is_international': False,
                'failed_attempts': random.randint(0, 3),
                'is_fraud': 1
            }
            transactions.append(tx)
        
        return transactions
    
    def _inject_night_fraud(self, user: Dict, base_date: datetime) -> Dict:
        """Inject night fraud - high value transaction at odd hours"""
        hour = random.randint(1, 5)
        timestamp = base_date.replace(hour=hour, minute=random.randint(0, 59))
        
        tx_type = random.choice([t for t in TRANSACTION_TYPES if t['type'] in ['IMPS', 'NEFT', 'Card']])
        
        return {
            'user_id': user['user_id'],
            'amount': random.uniform(25000, 200000),
            'transaction_type': tx_type['type'],
            'merchant_category': random.choice(['Forex/Crypto', 'E-commerce', 'P2P Transfer']),
            'timestamp': timestamp,
            'hour': hour,
            'day_of_week': timestamp.weekday(),
            'is_weekend': timestamp.weekday() >= 5,
            'device_id': _generate_device_id(user['user_id'], random.randint(5, 10)),
            'ip_address': _generate_ip_address(is_suspicious=True),
            'latitude': user['home_lat'] + np.random.normal(0, 0.1),
            'longitude': user['home_lon'] + np.random.normal(0, 0.1),
            'city': user['home_city'],
            'distance_from_home': random.uniform(0, 50),
            'is_new_device': True,
            'is_new_location': random.random() < 0.5,
            'is_international': False,
            'failed_attempts': random.randint(1, 4),
            'is_fraud': 1
        }
    
    def _inject_geo_fraud(self, user: Dict, base_timestamp: datetime) -> List[Dict]:
        """Inject impossible travel fraud - transactions from distant locations"""
        transactions = []
        
        # First transaction at home
        tx1 = self._generate_normal_transaction(user, base_timestamp)
        tx1['is_fraud'] = 1
        transactions.append(tx1)
        
        # Second transaction 30 mins later from 1000+ km away
        far_city = random.choice([c for c in INDIAN_CITIES if c['name'] != user['home_city']])
        timestamp2 = base_timestamp + timedelta(minutes=random.randint(20, 40))
        
        tx_type = _weighted_choice(TRANSACTION_TYPES)
        tx2 = {
            'user_id': user['user_id'],
            'amount': _generate_amount(tx_type, is_fraud=True),
            'transaction_type': tx_type['type'],
            'merchant_category': random.choice(['ATM Withdrawal', 'E-commerce']),
            'timestamp': timestamp2,
            'hour': timestamp2.hour,
            'day_of_week': timestamp2.weekday(),
            'is_weekend': timestamp2.weekday() >= 5,
            'device_id': _generate_device_id(user['user_id'], random.randint(5, 10)),
            'ip_address': _generate_ip_address(is_suspicious=True),
            'latitude': far_city['lat'],
            'longitude': far_city['lon'],
            'city': far_city['name'],
            'distance_from_home': _haversine_distance(
                user['home_lat'], user['home_lon'],
                far_city['lat'], far_city['lon']
            ),
            'is_new_device': True,
            'is_new_location': True,
            'is_international': False,
            'failed_attempts': random.randint(1, 3),
            'is_fraud': 1
        }
        transactions.append(tx2)
        
        return transactions
    
    def _inject_high_value_fraud(self, user: Dict, base_timestamp: datetime) -> Dict:
        """Inject high value first transaction fraud"""
        tx_type = random.choice([t for t in TRANSACTION_TYPES if t['type'] in ['NEFT', 'IMPS']])
        
        return {
            'user_id': user['user_id'],
            'amount': random.uniform(100000, 500000),
            'transaction_type': tx_type['type'],
            'merchant_category': random.choice(['P2P Transfer', 'Forex/Crypto']),
            'timestamp': base_timestamp,
            'hour': base_timestamp.hour,
            'day_of_week': base_timestamp.weekday(),
            'is_weekend': base_timestamp.weekday() >= 5,
            'device_id': _generate_device_id(user['user_id'], random.randint(5, 10)),
            'ip_address': _generate_ip_address(is_suspicious=True),
            'latitude': user['home_lat'],
            'longitude': user['home_lon'],
            'city': user['home_city'],
            'distance_from_home': 0,
            'is_new_device': True,
            'is_new_location': False,
            'is_international': random.random() < 0.3,
            'failed_attempts': random.randint(2, 5),
            'is_fraud': 1
        }
    
    def generate(self, num_transactions: int = 500000) -> pd.DataFrame:
        """Generate synthetic transaction dataset"""
        print(f"🚀 Generating {num_transactions:,} synthetic transactions...")
        
        transactions = []
        fraud_count = 0
        target_fraud = int(num_transactions * self.fraud_rate)
        
        # Generate normal transactions
        start_date = datetime.now() - timedelta(days=180)
        
        normal_count = num_transactions - target_fraud
        for i in range(normal_count):
            user = random.choice(self.users)
            
            # Random timestamp in last 180 days
            days_offset = random.randint(0, 180)
            # Hour distribution weighted toward daytime
            hour_weights = [1, 1, 1, 1, 2, 2, 4, 5, 6, 7, 8, 8, 7, 7, 6, 6, 5, 5, 5, 5, 4, 3, 2, 2]
            hour_probs = [w / sum(hour_weights) for w in hour_weights]
            hour = np.random.choice(range(24), p=hour_probs)
            timestamp = start_date + timedelta(
                days=days_offset,
                hours=int(hour),
                minutes=random.randint(0, 59)
            )
            
            tx = self._generate_normal_transaction(user, timestamp)
            transactions.append(tx)
            
            if (i + 1) % 100000 == 0:
                print(f"  ✅ Generated {i+1:,} normal transactions")
        
        print(f"  ✅ Generated {normal_count:,} normal transactions")
        
        # Inject fraud patterns
        print(f"💀 Injecting {target_fraud:,} fraud transactions...")
        
        fraud_types = ['velocity', 'night', 'geo', 'high_value']
        
        while fraud_count < target_fraud:
            user = random.choice(self.users)
            fraud_type = random.choice(fraud_types)
            
            days_offset = random.randint(0, 180)
            base_timestamp = start_date + timedelta(
                days=days_offset,
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59)
            )
            
            if fraud_type == 'velocity':
                fraud_txs = self._inject_velocity_fraud(user, base_timestamp)
                transactions.extend(fraud_txs)
                fraud_count += len(fraud_txs)
            elif fraud_type == 'night':
                fraud_tx = self._inject_night_fraud(user, base_timestamp)
                transactions.append(fraud_tx)
                fraud_count += 1
            elif fraud_type == 'geo':
                fraud_txs = self._inject_geo_fraud(user, base_timestamp)
                transactions.extend(fraud_txs)
                fraud_count += len(fraud_txs)
            elif fraud_type == 'high_value':
                fraud_tx = self._inject_high_value_fraud(user, base_timestamp)
                transactions.append(fraud_tx)
                fraud_count += 1
        
        print(f"  ✅ Injected {fraud_count:,} fraud transactions")
        
        # Convert to DataFrame
        df = pd.DataFrame(transactions)
        
        # Sort by timestamp
        df = df.sort_values('timestamp').reset_index(drop=True)
        
        # Add transaction ID
        df['transaction_id'] = [f"TXN-{i+1:08d}" for i in range(len(df))]
        
        print(f"\n📊 Dataset Summary:")
        print(f"   Total transactions: {len(df):,}")
        print(f"   Fraud rate: {df['is_fraud'].mean():.2%}")
        print(f"   Date range: {df['timestamp'].min()} to {df['timestamp'].max()}")
        print(f"   Unique users: {df['user_id'].nunique():,}")
        
        return df


def generate_dataset(num_transactions: int = 500000, fraud_rate: float = 0.04) -> pd.DataFrame:
    """Main function to generate fraud detection dataset"""
    generator = TransactionGenerator(
        num_users=max(1000, num_transactions // 50),
        fraud_rate=fraud_rate
    )
    return generator.generate(num_transactions)


def add_velocity_features(df: pd.DataFrame) -> pd.DataFrame:
    """Add velocity-based features for ML"""
    print("⚡ Computing velocity features...")
    
    df = df.sort_values(['user_id', 'timestamp']).copy()
    
    # Initialize velocity columns
    df['tx_count_1h'] = 1
    df['tx_count_24h'] = 1
    df['tx_count_7d'] = 1
    df['amount_sum_1h'] = df['amount']
    df['amount_sum_24h'] = df['amount']
    df['unique_merchants_24h'] = 1
    df['unique_devices_24h'] = 1
    df['time_since_last_tx'] = 86400  # Default 1 day in seconds
    
    # Group by user for efficiency
    for user_id, group in df.groupby('user_id'):
        group = group.sort_values('timestamp')
        indices = group.index.tolist()
        timestamps = group['timestamp'].tolist()
        amounts = group['amount'].tolist()
        merchants = group['merchant_category'].tolist()
        devices = group['device_id'].tolist()
        
        for i, idx in enumerate(indices):
            current_time = timestamps[i]
            
            # Look back windows
            tx_1h = 0
            tx_24h = 0
            tx_7d = 0
            amt_1h = 0
            amt_24h = 0
            merchants_24h = set()
            devices_24h = set()
            
            for j in range(i-1, -1, -1):
                time_diff = (current_time - timestamps[j]).total_seconds()
                
                if time_diff <= 3600:  # 1 hour
                    tx_1h += 1
                    amt_1h += amounts[j]
                    
                if time_diff <= 86400:  # 24 hours
                    tx_24h += 1
                    amt_24h += amounts[j]
                    merchants_24h.add(merchants[j])
                    devices_24h.add(devices[j])
                    
                if time_diff <= 604800:  # 7 days
                    tx_7d += 1
                else:
                    break  # Beyond 7 days
            
            df.at[idx, 'tx_count_1h'] = tx_1h + 1
            df.at[idx, 'tx_count_24h'] = tx_24h + 1
            df.at[idx, 'tx_count_7d'] = tx_7d + 1
            df.at[idx, 'amount_sum_1h'] = amt_1h + amounts[i]
            df.at[idx, 'amount_sum_24h'] = amt_24h + amounts[i]
            df.at[idx, 'unique_merchants_24h'] = len(merchants_24h) + 1
            df.at[idx, 'unique_devices_24h'] = len(devices_24h) + 1
            
            if i > 0:
                df.at[idx, 'time_since_last_tx'] = (current_time - timestamps[i-1]).total_seconds()
    
    print("  ✅ Velocity features computed")
    return df


if __name__ == '__main__':
    # Generate dataset
    df = generate_dataset(num_transactions=500000, fraud_rate=0.04)
    
    # Add velocity features
    df = add_velocity_features(df)
    
    # Save to CSV
    output_path = 'ml/models/fraud_transactions.csv'
    df.to_csv(output_path, index=False)
    print(f"\n💾 Dataset saved to {output_path}")
    
    # Print feature summary
    print("\n📋 Feature Summary:")
    print(df.describe())
