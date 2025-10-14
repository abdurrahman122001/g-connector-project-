# Multi-Form Indicator Script Documentation

## Overview

This Python script enables you to create indicators that work with variables from multiple forms in your G-Connector system. It can fetch data from different forms, process variables across forms, and calculate comprehensive indicators and analytics.

## Features

- **Multi-Form Data Integration**: Fetch and combine data from multiple forms
- **Cross-Form Analysis**: Calculate correlations and relationships between variables from different forms
- **Data Quality Assessment**: Evaluate completeness, consistency, and validity of data
- **Temporal Analysis**: Analyze trends and patterns over time
- **Statistical Summaries**: Generate comprehensive statistical reports
- **Anomaly Detection**: Identify outliers and unusual patterns
- **Custom Business Logic**: Implement domain-specific indicators
- **Comprehensive Reporting**: Generate detailed reports in multiple formats

## Installation

### Prerequisites

```bash
pip install pandas numpy requests
```

### Files

1. `multi_form_indicator_script.py` - Main script with the MultiFormIndicatorProcessor class
2. `example_usage.py` - Example usage patterns
3. `README_MultiForm_Indicators.md` - This documentation

## Quick Start

### 1. Basic Usage

```python
from multi_form_indicator_script import MultiFormIndicatorProcessor

# Initialize processor
processor = MultiFormIndicatorProcessor(
    api_base_url="http://localhost:8000/api",
    auth_token="your_auth_token"
)

# Define forms and variables
form_ids = ["form1_id", "form2_id"]
variables = ["patient_age", "blood_pressure", "temperature"]

# Fetch and process data
form_dataframes = {}
for form_id in form_ids:
    form_structure = processor.fetch_form_structure(form_id)
    form_data = processor.fetch_form_data(form_id)
    df = processor.normalize_data(form_data, form_structure)
    form_dataframes[form_id] = df

# Calculate indicators
results = processor.calculate_cross_form_indicators(form_dataframes, variables)

# Generate report
processor.generate_report(results, "my_report.txt")
```

### 2. Command Line Usage

```bash
python multi_form_indicator_script.py \
    --form-ids "form1_id,form2_id,form3_id" \
    --variables "var1,var2,var3" \
    --api-url "http://localhost:8000/api" \
    --auth-token "your_auth_token" \
    --output "report.txt"
```

## API Integration

### Authentication

The script uses Bearer token authentication:

```python
processor = MultiFormIndicatorProcessor(
    api_base_url="http://localhost:8000/api",
    auth_token="your_jwt_token_here"
)
```

### API Endpoints Used

1. **Form Structure**: `GET /api/forms/{form_id}`
2. **Form Submissions**: `GET /api/forms/{form_id}/submissions`

### Expected API Response Format

```json
{
  "success": true,
  "data": [
    {
      "_id": "submission_id",
      "form_id": "form_id",
      "createdAt": "2024-01-01T00:00:00Z",
      "field1": "value1",
      "field2": "value2"
    }
  ]
}
```

## Indicator Types

### 1. Cross-Form Correlation Analysis

Analyzes relationships between variables across different forms:

```python
# Automatically calculated when you have 2+ forms
results['indicators']['cross_form_correlation']
```

**Output includes:**
- Correlation matrix between variables
- High correlation pairs (|r| ≥ 0.7)
- Summary statistics

### 2. Data Completeness Analysis

Evaluates data quality across forms:

```python
results['indicators']['data_completeness']
```

**Metrics:**
- Completeness rate per variable
- Missing data counts
- Overall completeness scores

### 3. Temporal Analysis

Analyzes time-based patterns:

```python
results['indicators']['temporal_analysis']
```

**Features:**
- Daily/weekly/monthly submission trends
- Peak activity periods
- Time-based patterns

### 4. Statistical Summaries

Comprehensive statistical analysis:

```python
results['indicators']['statistical_summaries']
```

**For numeric variables:**
- Mean, median, standard deviation
- Quartiles, min/max values
- Skewness and kurtosis

**For categorical variables:**
- Frequency distributions
- Unique value counts
- Missing data analysis

### 5. Business Indicators

Custom business logic indicators:

```python
results['indicators']['business_indicators']
```

**Includes:**
- Response time analysis between forms
- Data quality scores
- Trend indicators
- Anomaly detection

## Real-World Examples

### Healthcare Indicators

```python
# Healthcare forms and variables
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

# Calculate healthcare indicators
results = processor.calculate_cross_form_indicators(form_dataframes, HEALTHCARE_VARIABLES)
```

### Education Assessment Indicators

```python
# Education forms and variables
EDUCATION_FORMS = {
    "student_profile": "form_id_1",
    "academic_performance": "form_id_2",
    "attendance": "form_id_3",
    "behavioral_assessment": "form_id_4"
}

EDUCATION_VARIABLES = [
    "student_age", "grade_level", "attendance_rate",
    "math_score", "reading_score", "science_score",
    "behavior_rating", "participation_level"
]

# Calculate education indicators
results = processor.calculate_cross_form_indicators(form_dataframes, EDUCATION_VARIABLES)
```

### Business Performance Indicators

```python
# Business forms and variables
BUSINESS_FORMS = {
    "sales_data": "form_id_1",
    "customer_feedback": "form_id_2",
    "inventory": "form_id_3",
    "employee_performance": "form_id_4"
}

BUSINESS_VARIABLES = [
    "sales_amount", "customer_satisfaction", "product_rating",
    "inventory_level", "employee_productivity", "response_time"
]

# Calculate business indicators
results = processor.calculate_cross_form_indicators(form_dataframes, BUSINESS_VARIABLES)
```

## Custom Indicator Development

### Creating Custom Calculations

```python
def custom_indicator_calculation(form_dataframes, variables):
    """Example custom indicator calculation."""
    
    custom_results = {}
    
    # Example: Calculate improvement rate between forms
    if len(form_dataframes) >= 2:
        form1_df = list(form_dataframes.values())[0]
        form2_df = list(form_dataframes.values())[1]
        
        if 'score' in form1_df.columns and 'score' in form2_df.columns:
            improvement = ((form2_df['score'].mean() - form1_df['score'].mean()) / 
                          form1_df['score'].mean()) * 100
            
            custom_results['improvement_rate'] = round(improvement, 2)
    
    return custom_results

# Use in your analysis
processor = MultiFormIndicatorProcessor(api_url, auth_token)
# ... fetch data ...
custom_indicators = custom_indicator_calculation(form_dataframes, variables)
```

### Extending the Processor

```python
class CustomIndicatorProcessor(MultiFormIndicatorProcessor):
    def calculate_domain_specific_indicators(self, form_dataframes, variables):
        """Add your domain-specific indicator calculations."""
        
        results = {}
        
        # Your custom logic here
        results['custom_metric'] = self._calculate_custom_metric(form_dataframes, variables)
        
        return results
    
    def _calculate_custom_metric(self, form_dataframes, variables):
        """Implement your custom metric calculation."""
        # Your implementation here
        pass
```

## Output Formats

### 1. Text Report

```python
# Generate human-readable report
report = processor.generate_report(results, "indicator_report.txt")
```

**Sample output:**
```
MULTI-FORM INDICATOR ANALYSIS REPORT
================================================================================
Generated: 2024-01-01T12:00:00

EXECUTION SUMMARY
----------------------------------------
Forms Processed: form1_id, form2_id, form3_id
Variables Used: patient_age, blood_pressure, temperature
Total Records: 1,250

CROSS-FORM CORRELATION ANALYSIS
----------------------------------------
Total Variables: 12
Mean Correlation: 0.234
Max Correlation: 0.856

High Correlations (|r| >= 0.7):
  form1_patient_age ↔ form2_blood_pressure: 0.856 (strong)
  form2_temperature ↔ form3_symptoms: 0.723 (moderate)
```

### 2. JSON Output

```python
# Save detailed results as JSON
import json
with open("results.json", "w") as f:
    json.dump(results, f, indent=2, default=str)
```

**Structure:**
```json
{
  "timestamp": "2024-01-01T12:00:00",
  "metadata": {
    "forms_processed": ["form1_id", "form2_id"],
    "variables_used": ["var1", "var2"],
    "total_records": 1250
  },
  "indicators": {
    "cross_form_correlation": { ... },
    "data_completeness": { ... },
    "temporal_analysis": { ... },
    "statistical_summaries": { ... },
    "business_indicators": { ... }
  }
}
```

## Error Handling

The script includes comprehensive error handling:

```python
try:
    results = processor.calculate_cross_form_indicators(form_dataframes, variables)
except Exception as e:
    logger.error(f"Error calculating indicators: {e}")
    # Handle error appropriately
```

### Common Issues and Solutions

1. **Authentication Errors**
   ```python
   # Ensure your token is valid and not expired
   processor = MultiFormIndicatorProcessor(api_url, "valid_token")
   ```

2. **Form Not Found**
   ```python
   # Check form IDs are correct
   form_structure = processor.fetch_form_structure("correct_form_id")
   ```

3. **No Data Available**
   ```python
   # Handle empty datasets gracefully
   if not form_data:
       print(f"No data available for form {form_id}")
       continue
   ```

## Performance Considerations

### Large Datasets

For large datasets, consider:

```python
# Process forms in batches
BATCH_SIZE = 1000
for form_id in form_ids:
    # Fetch data in batches
    offset = 0
    while True:
        batch_data = processor.fetch_form_data_batch(form_id, offset, BATCH_SIZE)
        if not batch_data:
            break
        # Process batch
        offset += BATCH_SIZE
```

### Memory Management

```python
# Clear dataframes when no longer needed
del form_dataframes[form_id]
import gc
gc.collect()
```

## Integration with G-Connector

### Frontend Integration

You can integrate this script with your G-Connector frontend:

```javascript
// Frontend code to trigger indicator calculation
const triggerIndicatorCalculation = async (formIds, variables) => {
  const response = await fetch('/api/indicators/calculate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      form_ids: formIds,
      variables: variables
    })
  });
  
  const results = await response.json();
  return results;
};
```

### Backend Integration

```python
# Backend endpoint to handle indicator requests
@app.route('/api/indicators/calculate', methods=['POST'])
def calculate_indicators():
    data = request.json
    form_ids = data.get('form_ids', [])
    variables = data.get('variables', [])
    
    processor = MultiFormIndicatorProcessor(API_URL, get_auth_token())
    # ... process indicators ...
    
    return jsonify(results)
```

## Best Practices

1. **Variable Naming**: Use consistent, descriptive variable names across forms
2. **Data Validation**: Validate data quality before processing
3. **Error Logging**: Implement comprehensive logging for debugging
4. **Performance Monitoring**: Monitor script performance with large datasets
5. **Security**: Secure API tokens and implement proper authentication
6. **Documentation**: Document custom indicators and business logic

## Troubleshooting

### Common Issues

1. **Import Errors**: Ensure all required packages are installed
2. **API Connection**: Verify API URL and network connectivity
3. **Authentication**: Check token validity and permissions
4. **Data Format**: Ensure form data matches expected format
5. **Memory Issues**: Monitor memory usage with large datasets

### Debug Mode

Enable debug logging:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## Support

For issues and questions:

1. Check the error logs in `indicator_script.log`
2. Verify API endpoints and authentication
3. Test with smaller datasets first
4. Review the example usage patterns

## License

This script is provided as-is for use with the G-Connector system. 