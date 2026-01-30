"""
Visnova 2.0 Backend - Terminal Calculator Service
Complete Indian Finance Calculators
"""
import numpy as np
from typing import Dict, List, Any


# ========== SAVINGS & INVESTMENTS ==========

def calculate_simple_interest(principal: float, rate: float, years: float) -> Dict[str, Any]:
    """Simple Interest - Linear growth"""
    interest = principal * (rate / 100) * years
    total = principal + interest
    
    yearly_data = []
    for year in range(1, int(years) + 1):
        year_interest = principal * (rate / 100) * year
        yearly_data.append({
            'year': year,
            'principal': round(principal, 2),
            'interest': round(year_interest, 2),
            'total': round(principal + year_interest, 2)
        })
    
    return {
        'principal': round(principal, 2),
        'rate': rate,
        'years': years,
        'interest': round(interest, 2),
        'total': round(total, 2),
        'yearlyBreakdown': yearly_data,
        'formula': 'SI = P × R × T / 100',
        'method': 'Linear'
    }


def calculate_compound_interest(
    principal: float, 
    rate: float, 
    years: float, 
    compounds_per_year: int = 12
) -> Dict[str, Any]:
    """Compound Interest - Exponential growth"""
    r = rate / 100
    n = compounds_per_year
    
    yearly_data = []
    for year in range(1, int(years) + 1):
        amount = principal * (1 + r/n) ** (n * year)
        interest = amount - principal
        yearly_data.append({
            'year': year,
            'principal': round(principal, 2),
            'interest': round(interest, 2),
            'total': round(amount, 2)
        })
    
    final_amount = principal * (1 + r/n) ** (n * years)
    
    return {
        'principal': round(principal, 2),
        'rate': rate,
        'years': years,
        'compoundFrequency': n,
        'finalAmount': round(final_amount, 2),
        'totalInterest': round(final_amount - principal, 2),
        'yearlyBreakdown': yearly_data,
        'formula': 'A = P(1 + r/n)^(nt)',
        'method': 'Exponential'
    }


def calculate_sip(
    monthly_invest: float,
    rate: float,
    years: int,
    step_up: float = 0,
    inflation: float = 0
) -> Dict[str, Any]:
    """SIP Calculator with Step-Up option"""
    monthly_rate = (rate / 100) / 12
    
    yearly_data = []
    total_invested = 0
    current_value = 0
    current_monthly = monthly_invest
    
    for year in range(1, years + 1):
        for month in range(12):
            total_invested += current_monthly
            current_value = (current_value + current_monthly) * (1 + monthly_rate)
        
        if step_up > 0:
            current_monthly *= (1 + step_up / 100)
        
        real_value = current_value / ((1 + inflation / 100) ** year) if inflation > 0 else current_value
        
        yearly_data.append({
            'year': year,
            'invested': round(total_invested, 2),
            'value': round(current_value, 2),
            'gains': round(current_value - total_invested, 2),
            'realValue': round(real_value, 2)
        })
    
    return {
        'monthlyInvestment': round(monthly_invest, 2),
        'rate': rate,
        'years': years,
        'stepUp': step_up,
        'inflation': inflation,
        'totalInvested': round(total_invested, 2),
        'finalValue': round(current_value, 2),
        'totalGains': round(current_value - total_invested, 2),
        'yearlyBreakdown': yearly_data,
        'formula': 'FV = P × [(1+r)^n - 1] / r × (1+r)',
        'method': 'Compounded Monthly'
    }


def calculate_lumpsum(
    principal: float,
    rate: float,
    years: int
) -> Dict[str, Any]:
    """Lumpsum Investment - One-time investment growth"""
    yearly_data = []
    
    for year in range(1, years + 1):
        value = principal * ((1 + rate/100) ** year)
        yearly_data.append({
            'year': year,
            'invested': round(principal, 2),
            'value': round(value, 2),
            'gains': round(value - principal, 2)
        })
    
    final_value = principal * ((1 + rate/100) ** years)
    
    return {
        'principal': round(principal, 2),
        'rate': rate,
        'years': years,
        'finalValue': round(final_value, 2),
        'totalGains': round(final_value - principal, 2),
        'yearlyBreakdown': yearly_data,
        'formula': 'FV = P × (1 + r)^n',
        'method': 'Annually Compounded'
    }


def calculate_ppf(
    yearly_invest: float,
    years: int = 15
) -> Dict[str, Any]:
    """PPF Calculator - 15 year lock-in, govt rate 7.1%"""
    rate = 7.1  # Current PPF rate
    yearly_rate = rate / 100
    
    yearly_data = []
    total_invested = 0
    current_value = 0
    
    for year in range(1, years + 1):
        total_invested += yearly_invest
        current_value = (current_value + yearly_invest) * (1 + yearly_rate)
        
        yearly_data.append({
            'year': year,
            'invested': round(total_invested, 2),
            'value': round(current_value, 2),
            'interest': round(current_value - total_invested, 2)
        })
    
    return {
        'yearlyInvestment': round(yearly_invest, 2),
        'rate': rate,
        'years': years,
        'totalInvested': round(total_invested, 2),
        'finalValue': round(current_value, 2),
        'totalInterest': round(current_value - total_invested, 2),
        'taxBenefit': round(min(yearly_invest, 150000), 2),  # 80C limit
        'yearlyBreakdown': yearly_data,
        'note': 'PPF rate: 7.1% (Q1 FY2025-26)',
        'method': 'Annually Compounded'
    }


def calculate_nps(
    monthly_invest: float,
    years: int,
    equity_percent: float = 50,
    expected_equity_return: float = 12,
    expected_debt_return: float = 8
) -> Dict[str, Any]:
    """NPS Calculator - Retirement corpus"""
    equity_return = expected_equity_return / 100
    debt_return = expected_debt_return / 100
    
    weighted_return = (equity_percent/100 * equity_return) + ((100-equity_percent)/100 * debt_return)
    monthly_rate = weighted_return / 12
    
    yearly_data = []
    total_invested = 0
    current_value = 0
    
    for year in range(1, years + 1):
        for _ in range(12):
            total_invested += monthly_invest
            current_value = (current_value + monthly_invest) * (1 + monthly_rate)
        
        yearly_data.append({
            'year': year,
            'invested': round(total_invested, 2),
            'corpus': round(current_value, 2),
            'gains': round(current_value - total_invested, 2)
        })
    
    # At retirement: 60% can be withdrawn, 40% must buy annuity
    lumpsum_60 = current_value * 0.6
    annuity_40 = current_value * 0.4
    monthly_pension = annuity_40 * 0.06 / 12  # Assuming 6% annuity rate
    
    return {
        'monthlyInvestment': round(monthly_invest, 2),
        'years': years,
        'equityPercent': equity_percent,
        'totalInvested': round(total_invested, 2),
        'corpusValue': round(current_value, 2),
        'lumpsum60Percent': round(lumpsum_60, 2),
        'annuity40Percent': round(annuity_40, 2),
        'estimatedMonthlyPension': round(monthly_pension, 2),
        'yearlyBreakdown': yearly_data,
        'method': 'Monthly Compounded'
    }


# ========== LOANS & EMI ==========

def calculate_emi(
    principal: float,
    rate: float,
    years: float
) -> Dict[str, Any]:
    """EMI Calculator - Reducing Balance Method"""
    months = int(years * 12)
    monthly_rate = (rate / 100) / 12
    
    emi = principal * monthly_rate * (1 + monthly_rate) ** months / ((1 + monthly_rate) ** months - 1)
    
    total_payment = emi * months
    total_interest = total_payment - principal
    
    yearly_data = []
    remaining = principal
    total_interest_paid = 0
    total_principal_paid = 0
    
    for year in range(1, int(years) + 1):
        year_interest = 0
        year_principal = 0
        
        for _ in range(12):
            if remaining <= 0:
                break
            interest_part = remaining * monthly_rate
            principal_part = emi - interest_part
            
            year_interest += interest_part
            year_principal += principal_part
            remaining -= principal_part
        
        total_interest_paid += year_interest
        total_principal_paid += year_principal
        
        yearly_data.append({
            'year': year,
            'emiPaid': round(emi * 12, 2),
            'principalPaid': round(year_principal, 2),
            'interestPaid': round(year_interest, 2),
            'remainingPrincipal': round(max(0, remaining), 2)
        })
    
    return {
        'principal': round(principal, 2),
        'rate': rate,
        'years': years,
        'emi': round(emi, 2),
        'totalPayment': round(total_payment, 2),
        'totalInterest': round(total_interest, 2),
        'yearlyBreakdown': yearly_data,
        'formula': 'EMI = P × r × (1+r)^n / [(1+r)^n - 1]',
        'method': 'Reducing Balance'
    }


def calculate_home_loan(
    principal: float,
    rate: float,
    years: float,
    processing_fee_percent: float = 0.5
) -> Dict[str, Any]:
    """Home Loan EMI with processing fee"""
    result = calculate_emi(principal, rate, years)
    processing_fee = principal * processing_fee_percent / 100
    
    result['loanType'] = 'Home Loan'
    result['processingFee'] = round(processing_fee, 2)
    result['totalCost'] = round(result['totalPayment'] + processing_fee, 2)
    
    return result


def calculate_car_loan(
    principal: float,
    rate: float,
    years: float,
    down_payment_percent: float = 20
) -> Dict[str, Any]:
    """Car Loan EMI with down payment"""
    down_payment = principal * down_payment_percent / 100
    loan_amount = principal - down_payment
    
    result = calculate_emi(loan_amount, rate, years)
    
    result['vehiclePrice'] = round(principal, 2)
    result['downPayment'] = round(down_payment, 2)
    result['loanAmount'] = round(loan_amount, 2)
    result['loanType'] = 'Car Loan'
    
    return result


def calculate_personal_loan(
    principal: float,
    rate: float,
    years: float
) -> Dict[str, Any]:
    """Personal Loan EMI - Higher interest rates"""
    result = calculate_emi(principal, rate, years)
    result['loanType'] = 'Personal Loan'
    result['note'] = 'Personal loans typically have higher rates (10-24%)'
    return result


def calculate_gold_loan(
    gold_value: float,
    ltv_percent: float = 75,
    rate: float = 7.5,
    months: int = 12
) -> Dict[str, Any]:
    """Gold Loan Calculator - LTV based"""
    loan_amount = gold_value * ltv_percent / 100
    monthly_rate = rate / 100 / 12
    
    # Gold loans can be bullet payment or EMI
    total_interest = loan_amount * monthly_rate * months
    total_payable = loan_amount + total_interest
    
    return {
        'goldValue': round(gold_value, 2),
        'ltvPercent': ltv_percent,
        'loanAmount': round(loan_amount, 2),
        'rate': rate,
        'months': months,
        'totalInterest': round(total_interest, 2),
        'totalPayable': round(total_payable, 2),
        'monthlyInterest': round(total_interest / months, 2),
        'method': 'Simple Interest / Bullet'
    }


# ========== FIXED INCOME ==========

def calculate_fd(
    principal: float,
    rate: float,
    years: float,
    compounding: str = 'quarterly'
) -> Dict[str, Any]:
    """Fixed Deposit Calculator - Compounded"""
    compound_freq = {
        'monthly': 12,
        'quarterly': 4,
        'half_yearly': 2,
        'yearly': 1
    }
    n = compound_freq.get(compounding, 4)
    r = rate / 100
    
    maturity = principal * (1 + r/n) ** (n * years)
    interest = maturity - principal
    
    yearly_data = []
    for year in range(1, int(years) + 1):
        value = principal * (1 + r/n) ** (n * year)
        yearly_data.append({
            'year': year,
            'principal': round(principal, 2),
            'value': round(value, 2),
            'interest': round(value - principal, 2)
        })
    
    return {
        'principal': round(principal, 2),
        'rate': rate,
        'years': years,
        'compounding': compounding,
        'maturityAmount': round(maturity, 2),
        'totalInterest': round(interest, 2),
        'yearlyBreakdown': yearly_data,
        'method': f'Compounded {compounding.replace("_", " ").title()}'
    }


def calculate_rd(
    monthly_deposit: float,
    rate: float,
    months: int
) -> Dict[str, Any]:
    """Recurring Deposit Calculator"""
    r = rate / 100 / 4  # Quarterly compounding
    n = months
    
    # RD maturity formula
    maturity = 0
    total_deposited = 0
    
    quarterly_data = []
    for month in range(1, months + 1):
        total_deposited += monthly_deposit
        remaining_quarters = (months - month + 1) / 3
        contribution = monthly_deposit * (1 + r) ** remaining_quarters
        maturity += contribution
        
        if month % 3 == 0:  # Quarterly snapshot
            quarterly_data.append({
                'quarter': month // 3,
                'deposited': round(total_deposited, 2),
                'value': round(maturity, 2)
            })
    
    return {
        'monthlyDeposit': round(monthly_deposit, 2),
        'rate': rate,
        'months': months,
        'totalDeposited': round(total_deposited, 2),
        'maturityAmount': round(maturity, 2),
        'totalInterest': round(maturity - total_deposited, 2),
        'yearlyBreakdown': quarterly_data,
        'method': 'Quarterly Compounded'
    }


def calculate_ssy(
    yearly_invest: float,
    years: int = 21
) -> Dict[str, Any]:
    """Sukanya Samriddhi Yojana - Girl Child Savings"""
    rate = 8.2  # Current SSY rate
    yearly_rate = rate / 100
    
    # SSY rules: Deposit for 15 years, matures at 21 years
    deposit_years = min(years, 15)
    
    yearly_data = []
    total_invested = 0
    current_value = 0
    
    for year in range(1, years + 1):
        if year <= deposit_years:
            total_invested += yearly_invest
            current_value = (current_value + yearly_invest) * (1 + yearly_rate)
        else:
            current_value = current_value * (1 + yearly_rate)
        
        yearly_data.append({
            'year': year,
            'invested': round(total_invested, 2),
            'value': round(current_value, 2),
            'interest': round(current_value - total_invested, 2)
        })
    
    return {
        'yearlyInvestment': round(yearly_invest, 2),
        'rate': rate,
        'depositYears': deposit_years,
        'maturityYears': years,
        'totalInvested': round(total_invested, 2),
        'maturityAmount': round(current_value, 2),
        'totalInterest': round(current_value - total_invested, 2),
        'taxBenefit': round(min(yearly_invest, 150000), 2),
        'yearlyBreakdown': yearly_data,
        'note': 'SSY rate: 8.2% (Q1 FY2025-26). Max ₹1.5L/year.',
        'method': 'Annually Compounded'
    }


# ========== DEBT & CREDIT ==========

def calculate_credit_card_interest(
    outstanding: float,
    apr: float = 42,
    minimum_payment_percent: float = 5,
    monthly_payment: float = 0
) -> Dict[str, Any]:
    """Credit Card Interest - Daily Compounding"""
    daily_rate = apr / 100 / 365
    monthly_rate = apr / 100 / 12
    
    # If only paying minimum
    min_payment = max(outstanding * minimum_payment_percent / 100, 100)
    payment = monthly_payment if monthly_payment > 0 else min_payment
    
    monthly_data = []
    balance = outstanding
    total_interest = 0
    total_paid = 0
    month = 0
    
    while balance > 0 and month < 120:  # Max 10 years
        month += 1
        interest = balance * monthly_rate
        total_interest += interest
        balance += interest
        
        actual_payment = min(payment, balance)
        balance -= actual_payment
        total_paid += actual_payment
        
        if month <= 24:  # Show first 24 months
            monthly_data.append({
                'month': month,
                'payment': round(actual_payment, 2),
                'interest': round(interest, 2),
                'principal': round(actual_payment - interest, 2),
                'balance': round(max(0, balance), 2)
            })
    
    return {
        'outstanding': round(outstanding, 2),
        'apr': apr,
        'dailyRate': round(daily_rate * 100, 4),
        'monthlyPayment': round(payment, 2),
        'monthsToPayoff': month,
        'totalInterest': round(total_interest, 2),
        'totalPaid': round(total_paid, 2),
        'yearlyBreakdown': monthly_data,
        'warning': '⚠️ Credit cards have very high interest (36-48% APR)',
        'method': 'Daily Compounding'
    }


def calculate_debt_payoff(
    debts: List[Dict[str, float]],
    extra_payment: float = 0,
    strategy: str = 'avalanche'
) -> Dict[str, Any]:
    """Debt Payoff Calculator - Snowball vs Avalanche"""
    # debts = [{'name': 'CC1', 'balance': 50000, 'rate': 42, 'min_payment': 2500}, ...]
    
    if not debts:
        debts = [
            {'name': 'Credit Card', 'balance': 100000, 'rate': 42, 'min_payment': 5000},
            {'name': 'Personal Loan', 'balance': 200000, 'rate': 15, 'min_payment': 8000},
            {'name': 'Car Loan', 'balance': 300000, 'rate': 9, 'min_payment': 10000}
        ]
    
    # Sort based on strategy
    if strategy == 'avalanche':
        sorted_debts = sorted(debts, key=lambda x: x['rate'], reverse=True)
    else:  # snowball
        sorted_debts = sorted(debts, key=lambda x: x['balance'])
    
    total_min_payment = sum(d['min_payment'] for d in debts)
    total_monthly = total_min_payment + extra_payment
    
    # Simulate payoff
    balances = {d['name']: d['balance'] for d in debts}
    rates = {d['name']: d['rate'] / 100 / 12 for d in debts}
    min_payments = {d['name']: d['min_payment'] for d in debts}
    
    months = 0
    total_interest = 0
    payoff_order = []
    
    while any(b > 0 for b in balances.values()) and months < 360:
        months += 1
        extra = extra_payment
        
        for debt in sorted_debts:
            name = debt['name']
            if balances[name] <= 0:
                extra += min_payments[name]
                continue
            
            interest = balances[name] * rates[name]
            total_interest += interest
            balances[name] += interest
            
            payment = min_payments[name] + (extra if debt == [d for d in sorted_debts if balances[d['name']] > 0][0] else 0)
            payment = min(payment, balances[name])
            balances[name] -= payment
            
            if balances[name] <= 0 and name not in payoff_order:
                payoff_order.append({'name': name, 'month': months})
    
    return {
        'strategy': strategy.title(),
        'totalDebt': round(sum(d['balance'] for d in debts), 2),
        'monthlyPayment': round(total_monthly, 2),
        'monthsToDebtFree': months,
        'yearsToDebtFree': round(months / 12, 1),
        'totalInterest': round(total_interest, 2),
        'payoffOrder': payoff_order,
        'recommendation': 'Avalanche saves more interest, Snowball gives quick wins'
    }


# ========== TAX & GOALS ==========

def calculate_tax(
    income: float,
    deductions: float = 0,
    regime: str = 'new'
) -> Dict[str, Any]:
    """Income Tax Calculator - Old vs New Regime"""
    # New Tax Regime 2024-25
    new_regime_slabs = [
        (300000, 0), (600000, 5), (900000, 10),
        (1200000, 15), (1500000, 20), (float('inf'), 30)
    ]
    
    # Old Tax Regime
    old_regime_slabs = [
        (250000, 0), (500000, 5), (1000000, 20), (float('inf'), 30)
    ]
    
    def calc_tax(taxable, slabs):
        tax = 0
        prev = 0
        breakdown = []
        for limit, rate in slabs:
            if taxable <= prev:
                break
            slab_income = min(taxable, limit) - prev
            slab_tax = slab_income * rate / 100
            tax += slab_tax
            if slab_income > 0:
                breakdown.append({
                    'slab': f'₹{prev:,} - ₹{limit:,}' if limit != float('inf') else f'Above ₹{prev:,}',
                    'rate': f'{rate}%',
                    'taxableAmount': round(slab_income, 2),
                    'tax': round(slab_tax, 2)
                })
            prev = limit
        return tax, breakdown
    
    # Calculate for both regimes
    new_taxable = income  # No deductions in new regime
    old_taxable = max(0, income - deductions)
    
    new_tax, new_breakdown = calc_tax(new_taxable, new_regime_slabs)
    old_tax, old_breakdown = calc_tax(old_taxable, old_regime_slabs)
    
    # Add 4% cess
    new_tax_with_cess = new_tax * 1.04
    old_tax_with_cess = old_tax * 1.04
    
    better_regime = 'new' if new_tax_with_cess <= old_tax_with_cess else 'old'
    savings = abs(new_tax_with_cess - old_tax_with_cess)
    
    return {
        'grossIncome': round(income, 2),
        'deductions': round(deductions, 2),
        'newRegimeTax': round(new_tax_with_cess, 2),
        'oldRegimeTax': round(old_tax_with_cess, 2),
        'betterRegime': better_regime.upper(),
        'savings': round(savings, 2),
        'breakdown': new_breakdown if regime == 'new' else old_breakdown,
        'recommendation': f'{better_regime.upper()} regime saves ₹{savings:,.0f}'
    }


def calculate_hra(
    basic_salary: float,
    hra_received: float,
    rent_paid: float,
    metro_city: bool = True
) -> Dict[str, Any]:
    """HRA Exemption Calculator"""
    # HRA exemption is minimum of:
    # 1. Actual HRA received
    # 2. 50% of basic (metro) or 40% of basic (non-metro)
    # 3. Rent paid - 10% of basic
    
    city_percent = 50 if metro_city else 40
    
    option1 = hra_received
    option2 = basic_salary * city_percent / 100
    option3 = max(0, rent_paid - basic_salary * 0.1)
    
    exemption = min(option1, option2, option3)
    taxable_hra = hra_received - exemption
    
    return {
        'basicSalary': round(basic_salary, 2),
        'hraReceived': round(hra_received, 2),
        'rentPaid': round(rent_paid, 2),
        'metroCity': metro_city,
        'actualHRA': round(option1, 2),
        'percentOfBasic': round(option2, 2),
        'rentMinus10Percent': round(option3, 2),
        'hraExemption': round(exemption, 2),
        'taxableHRA': round(taxable_hra, 2),
        'annualTaxSaved': round(exemption * 0.30, 2)  # Assuming 30% bracket
    }


def calculate_savings_goal(
    target: float,
    years: float,
    rate: float
) -> Dict[str, Any]:
    """Goal Planner - How much to save monthly"""
    months = int(years * 12)
    monthly_rate = (rate / 100) / 12
    
    if monthly_rate > 0:
        monthly_savings = target * monthly_rate / ((1 + monthly_rate) ** months - 1)
    else:
        monthly_savings = target / months
    
    total_savings = monthly_savings * months
    interest_earned = target - total_savings
    
    return {
        'targetAmount': round(target, 2),
        'years': years,
        'rate': rate,
        'monthlySavings': round(monthly_savings, 2),
        'totalSavings': round(total_savings, 2),
        'interestEarned': round(interest_earned, 2),
        'formula': 'PMT = FV × r / [(1+r)^n - 1]'
    }


def calculate_inflation(
    amount: float,
    years: int,
    inflation_rate: float = 6
) -> Dict[str, Any]:
    """Inflation Calculator - Future value of money"""
    yearly_data = []
    
    for year in range(1, years + 1):
        future_cost = amount * ((1 + inflation_rate/100) ** year)
        purchasing_power = amount / ((1 + inflation_rate/100) ** year)
        
        yearly_data.append({
            'year': year,
            'futureCost': round(future_cost, 2),
            'purchasingPower': round(purchasing_power, 2)
        })
    
    final_cost = amount * ((1 + inflation_rate/100) ** years)
    
    return {
        'currentAmount': round(amount, 2),
        'inflationRate': inflation_rate,
        'years': years,
        'futureEquivalent': round(final_cost, 2),
        'purchasingPowerLoss': round(amount - (amount / ((1 + inflation_rate/100) ** years)), 2),
        'yearlyBreakdown': yearly_data,
        'insight': f'₹{amount:,.0f} today = ₹{final_cost:,.0f} in {years} years'
    }


def monte_carlo_simulation(
    initial_investment: float,
    monthly_contribution: float,
    years: int,
    expected_return: float = 12,
    volatility: float = 15,
    simulations: int = 1000
) -> Dict[str, Any]:
    """Monte Carlo Simulation for Investment"""
    monthly_return = expected_return / 100 / 12
    monthly_vol = volatility / 100 / np.sqrt(12)
    months = years * 12
    
    final_values = []
    for _ in range(simulations):
        value = initial_investment
        for _ in range(months):
            ret = np.random.normal(monthly_return, monthly_vol)
            value = value * (1 + ret) + monthly_contribution
        final_values.append(value)
    
    final_values = np.array(final_values)
    
    return {
        'initialInvestment': round(initial_investment, 2),
        'monthlyContribution': round(monthly_contribution, 2),
        'years': years,
        'expectedReturn': expected_return,
        'volatility': volatility,
        'simulations': simulations,
        'worst5Percent': round(np.percentile(final_values, 5), 2),
        'percentile25': round(np.percentile(final_values, 25), 2),
        'median': round(np.percentile(final_values, 50), 2),
        'percentile75': round(np.percentile(final_values, 75), 2),
        'best5Percent': round(np.percentile(final_values, 95), 2),
        'mean': round(np.mean(final_values), 2),
        'method': 'Monte Carlo (1000 simulations)'
    }


# Calculator registry
CALCULATORS = {
    # Savings & Investments
    'simple_interest': calculate_simple_interest,
    'compound_interest': calculate_compound_interest,
    'sip': calculate_sip,
    'lumpsum': calculate_lumpsum,
    'ppf': calculate_ppf,
    'nps': calculate_nps,
    
    # Loans & EMI
    'emi': calculate_emi,
    'home_loan': calculate_home_loan,
    'car_loan': calculate_car_loan,
    'personal_loan': calculate_personal_loan,
    'gold_loan': calculate_gold_loan,
    
    # Fixed Income
    'fd': calculate_fd,
    'rd': calculate_rd,
    'ssy': calculate_ssy,
    
    # Debt & Credit
    'credit_card': calculate_credit_card_interest,
    'debt_payoff': calculate_debt_payoff,
    
    # Tax & Goals
    'tax': calculate_tax,
    'hra': calculate_hra,
    'savings_goal': calculate_savings_goal,
    'inflation': calculate_inflation,
    'monte_carlo': monte_carlo_simulation
}


def run_calculation(calc_type: str, params: Dict[str, Any]) -> Dict[str, Any]:
    """Run a calculation by type"""
    calculator = CALCULATORS.get(calc_type)
    
    if not calculator:
        return {'error': f'Unknown calculator: {calc_type}. Available: {list(CALCULATORS.keys())}'}
    
    try:
        return calculator(**params)
    except Exception as e:
        return {'error': str(e)}
