#!/usr/bin/env python3
"""
Example Usage of Multi-Form Indicator Script
============================================

This example shows how to use the MultiFormIndicatorProcessor with your G-Connector system.
"""

from multi_form_indicator_script import MultiFormIndicatorProcessor
import json

def example_basic_usage():
    """Basic example of using the multi-form indicator processor."""
    
    # Configuration - replace with your actual values
    API_BASE_URL = "http://localhost:8000/api"  # Your API base URL
    AUTH_TOKEN = "your_auth_token_here"  # Your authentication token
    
    # Form IDs and variables to analyze
    FORM_IDS = ["form1_id", "form2_id", "form3_id"]  # Replace with actual form IDs
    VARIABLES = ["patient_age", "blood_pressure", "temperature", "symptoms"]  # Replace with actual variables
    
    # Initialize the processor
    processor = MultiFormIndicatorProcessor(API_BASE_URL, AUTH_TOKEN)
    
    # Fetch and process data from all forms
    form_dataframes = {}
    for form_id in FORM_IDS:
        print(f"Fetching data from form {form_id}")
        
        # Fetch form structure
        form_structure = processor.fetch_form_structure(form_id)
        if not form_structure:
            print(f"Could not fetch structure for form {form_id}")
            continue
        
        # Fetch form data
        form_data = processor.fetch_form_data(form_id)
        if not form_data:
            print(f"No data found for form {form_id}")
            continue
        
        # Normalize data
        df = processor.normalize_data(form_data, form_structure)
        if not df.empty:
            form_dataframes[form_id] = df
            print(f"Processed {len(df)} records from form {form_id}")
    
    # Calculate indicators
    print("Calculating cross-form indicators...")
    results = processor.calculate_cross_form_indicators(form_dataframes, VARIABLES)
    
    # Generate and save report
    report = processor.generate_report(results, "indicator_report.txt")
    
    # Save detailed results as JSON
    with open("indicator_results.json", "w") as f:
        json.dump(results, f, indent=2, default=str)
    
    print("Analysis complete! Check indicator_report.txt and indicator_results.json")

def example_healthcare_indicators():
    """Example specifically for healthcare indicators across multiple forms."""
    
    API_BASE_URL = "http://localhost:8000/api"
    AUTH_TOKEN = "your_auth_token_here"
    
    # Healthcare-specific forms and variables
    HEALTHCARE_FORMS = {
        "patient_registration": "form_id_1",
        "vital_signs": "form_id_2", 
        "lab_results": "form_id_3",
        "medication_history": "form_id_4"
    }
    
    HEALTHCARE_VARIABLES = [
        "patient_age", "gender", "weight", "height",
        "blood_pressure_systolic", "blood_pressure_diastolic",
        "temperature", "heart_rate", "oxygen_saturation",
        "glucose_level", "cholesterol_total", "medication_name"
    ]
    
    processor = MultiFormIndicatorProcessor(API_BASE_URL, AUTH_TOKEN)
    
    # Fetch data from healthcare forms
    form_dataframes = {}
    for form_name, form_id in HEALTHCARE_FORMS.items():
        print(f"Fetching {form_name} data...")
        
        form_structure = processor.fetch_form_structure(form_id)
        form_data = processor.fetch_form_data(form_id)
        
        if form_structure and form_data:
            df = processor.normalize_data(form_data, form_structure)
            if not df.empty:
                form_dataframes[form_name] = df
                print(f"  - {len(df)} records processed")
    
    # Calculate healthcare-specific indicators
    results = processor.calculate_cross_form_indicators(form_dataframes, HEALTHCARE_VARIABLES)
    
    # Generate healthcare report
    processor.generate_report(results, "healthcare_indicators_report.txt")
    
    print("Healthcare indicators analysis complete!")

def example_custom_indicator():
    """Example of creating a custom indicator calculation."""
    
    API_BASE_URL = "http://localhost:8000/api"
    AUTH_TOKEN = "your_auth_token_here"
    
    processor = MultiFormIndicatorProcessor(API_BASE_URL, AUTH_TOKEN)
    
    # Fetch data from forms
    form_ids = ["form1", "form2"]
    variables = ["score", "rating", "completion_time"]
    
    form_dataframes = {}
    for form_id in form_ids:
        form_structure = processor.fetch_form_structure(form_id)
        form_data = processor.fetch_form_data(form_id)
        
        if form_structure and form_data:
            df = processor.normalize_data(form_data, form_structure)
            if not df.empty:
                form_dataframes[form_id] = df
    
    # Custom indicator calculation
    custom_results = {
        'timestamp': processor.calculate_cross_form_indicators(form_dataframes, variables),
        'custom_metrics': {}
    }
    
    # Example: Calculate average score improvement over time
    if len(form_dataframes) >= 2:
        form1_df = list(form_dataframes.values())[0]
        form2_df = list(form_dataframes.values())[1]
        
        if 'score' in form1_df.columns and 'score' in form2_df.columns:
            avg_score_form1 = form1_df['score'].mean()
            avg_score_form2 = form2_df['score'].mean()
            improvement = ((avg_score_form2 - avg_score_form1) / avg_score_form1) * 100
            
            custom_results['custom_metrics']['score_improvement'] = {
                'form1_avg_score': round(avg_score_form1, 2),
                'form2_avg_score': round(avg_score_form2, 2),
                'improvement_percentage': round(improvement, 2)
            }
    
    # Save custom results
    with open("custom_indicator_results.json", "w") as f:
        json.dump(custom_results, f, indent=2, default=str)
    
    print("Custom indicator calculation complete!")

if __name__ == "__main__":
    print("Multi-Form Indicator Examples")
    print("=" * 40)
    
    # Uncomment the example you want to run:
    
    # example_basic_usage()
    # example_healthcare_indicators()
    # example_custom_indicator()
    
    print("Please uncomment an example function to run it.")
    print("Make sure to update the API_BASE_URL and AUTH_TOKEN with your actual values.") 