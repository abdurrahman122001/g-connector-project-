#!/usr/bin/env python3
"""
Multi-Form Indicator Script
===========================

This script demonstrates how to create indicators that work with variables
from multiple forms in the G-Connector system.

Features:
- Fetch data from multiple forms via API
- Process variables from different forms
- Calculate indicators based on cross-form data
- Handle different data types and formats
- Generate comprehensive reports

Usage:
    python multi_form_indicator_script.py --form-ids "form1_id,form2_id" --variables "var1,var2,var3"
"""

import json
import pandas as pd
import numpy as np
import requests
import argparse
import logging
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
import sys
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('indicator_script.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

class MultiFormIndicatorProcessor:
    """
    A class to process indicators that require data from multiple forms.
    """
    
    def __init__(self, api_base_url: str, auth_token: str):
        """
        Initialize the processor with API configuration.
        
        Args:
            api_base_url: Base URL for the API
            auth_token: Authentication token
        """
        self.api_base_url = api_base_url.rstrip('/')
        self.auth_token = auth_token
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {auth_token}',
            'Content-Type': 'application/json'
        })
        
    def fetch_form_data(self, form_id: str) -> List[Dict[str, Any]]:
        """
        Fetch submission data from a specific form.
        
        Args:
            form_id: The ID of the form to fetch data from
            
        Returns:
            List of form submissions
        """
        try:
            url = f"{self.api_base_url}/forms/{form_id}/submissions"
            response = self.session.get(url)
            response.raise_for_status()
            
            data = response.json()
            if data.get('success'):
                return data.get('data', [])
            else:
                logger.error(f"API returned error: {data.get('message', 'Unknown error')}")
                return []
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to fetch data from form {form_id}: {e}")
            return []
    
    def fetch_form_structure(self, form_id: str) -> Dict[str, Any]:
        """
        Fetch the structure/fields of a form.
        
        Args:
            form_id: The ID of the form
            
        Returns:
            Form structure with fields and metadata
        """
        try:
            url = f"{self.api_base_url}/forms/{form_id}"
            response = self.session.get(url)
            response.raise_for_status()
            
            data = response.json()
            if data.get('success'):
                return data.get('data', {})
            else:
                logger.error(f"API returned error: {data.get('message', 'Unknown error')}")
                return {}
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to fetch form structure for {form_id}: {e}")
            return {}
    
    def normalize_data(self, form_data: List[Dict[str, Any]], form_structure: Dict[str, Any]) -> pd.DataFrame:
        """
        Normalize form data into a pandas DataFrame.
        
        Args:
            form_data: Raw form submission data
            form_structure: Form structure with field definitions
            
        Returns:
            Normalized DataFrame
        """
        if not form_data:
            return pd.DataFrame()
        
        # Extract field names from form structure
        fields = form_structure.get('fields', [])
        field_names = [field.get('name', field.get('label', '')) for field in fields]
        
        # Handle repeater fields
        repeatable_fields = form_structure.get('repeatable', [])
        for repeatable in repeatable_fields:
            repeatable_name = repeatable.get('name', '')
            sub_fields = repeatable.get('repeatable', {}).get('fields', [])
            for sub_field in sub_fields:
                field_names.append(f"{repeatable_name}_{sub_field.get('name', '')}")
        
        # Create DataFrame
        df = pd.DataFrame(form_data)
        
        # Ensure all expected columns exist
        for field_name in field_names:
            if field_name not in df.columns:
                df[field_name] = None
        
        # Add metadata columns
        df['form_id'] = form_structure.get('_id', '')
        df['form_name'] = form_structure.get('name', '')
        df['submission_date'] = pd.to_datetime(df.get('createdAt', datetime.now()))
        
        return df
    
    def calculate_cross_form_indicators(self, form_dataframes: Dict[str, pd.DataFrame], 
                                      variables: List[str]) -> Dict[str, Any]:
        """
        Calculate indicators using data from multiple forms.
        
        Args:
            form_dataframes: Dictionary of form_id -> DataFrame mappings
            variables: List of variables to use in calculations
            
        Returns:
            Dictionary containing calculated indicators
        """
        results = {
            'timestamp': datetime.now().isoformat(),
            'indicators': {},
            'metadata': {
                'forms_processed': list(form_dataframes.keys()),
                'variables_used': variables,
                'total_records': sum(len(df) for df in form_dataframes.values())
            }
        }
        
        try:
            # Example 1: Cross-form correlation analysis
            if len(form_dataframes) >= 2:
                results['indicators']['cross_form_correlation'] = self._calculate_cross_form_correlation(
                    form_dataframes, variables
                )
            
            # Example 2: Data completeness across forms
            results['indicators']['data_completeness'] = self._calculate_data_completeness(
                form_dataframes, variables
            )
            
            # Example 3: Temporal analysis
            results['indicators']['temporal_analysis'] = self._calculate_temporal_analysis(
                form_dataframes
            )
            
            # Example 4: Statistical summaries
            results['indicators']['statistical_summaries'] = self._calculate_statistical_summaries(
                form_dataframes, variables
            )
            
            # Example 5: Custom business logic indicators
            results['indicators']['business_indicators'] = self._calculate_business_indicators(
                form_dataframes, variables
            )
            
        except Exception as e:
            logger.error(f"Error calculating indicators: {e}")
            results['error'] = str(e)
        
        return results
    
    def _calculate_cross_form_correlation(self, form_dataframes: Dict[str, pd.DataFrame], 
                                        variables: List[str]) -> Dict[str, Any]:
        """Calculate correlations between variables across different forms."""
        correlations = {}
        
        try:
            # Create a combined dataset for correlation analysis
            combined_data = {}
            
            for form_id, df in form_dataframes.items():
                for var in variables:
                    if var in df.columns:
                        col_name = f"{form_id}_{var}"
                        combined_data[col_name] = df[var].dropna()
            
            if len(combined_data) >= 2:
                combined_df = pd.DataFrame(combined_data)
                correlation_matrix = combined_df.corr()
                
                correlations = {
                    'correlation_matrix': correlation_matrix.to_dict(),
                    'high_correlations': self._find_high_correlations(correlation_matrix, threshold=0.7),
                    'summary': {
                        'total_variables': len(combined_data),
                        'mean_correlation': correlation_matrix.values[np.triu_indices_from(correlation_matrix.values, k=1)].mean(),
                        'max_correlation': correlation_matrix.values[np.triu_indices_from(correlation_matrix.values, k=1)].max()
                    }
                }
        
        except Exception as e:
            logger.error(f"Error in cross-form correlation: {e}")
            correlations['error'] = str(e)
        
        return correlations
    
    def _calculate_data_completeness(self, form_dataframes: Dict[str, pd.DataFrame], 
                                   variables: List[str]) -> Dict[str, Any]:
        """Calculate data completeness metrics across forms."""
        completeness = {}
        
        try:
            for form_id, df in form_dataframes.items():
                form_completeness = {}
                for var in variables:
                    if var in df.columns:
                        non_null_count = df[var].notna().sum()
                        total_count = len(df)
                        completeness_rate = (non_null_count / total_count) * 100 if total_count > 0 else 0
                        
                        form_completeness[var] = {
                            'completeness_rate': round(completeness_rate, 2),
                            'non_null_count': int(non_null_count),
                            'total_count': int(total_count),
                            'missing_count': int(total_count - non_null_count)
                        }
                
                completeness[form_id] = form_completeness
            
            # Overall completeness
            overall_completeness = {}
            for var in variables:
                var_completeness = []
                for form_id, form_data in completeness.items():
                    if var in form_data:
                        var_completeness.append(form_data[var]['completeness_rate'])
                
                if var_completeness:
                    overall_completeness[var] = {
                        'mean_completeness': round(np.mean(var_completeness), 2),
                        'min_completeness': round(min(var_completeness), 2),
                        'max_completeness': round(max(var_completeness), 2),
                        'std_completeness': round(np.std(var_completeness), 2)
                    }
            
            completeness['overall'] = overall_completeness
            
        except Exception as e:
            logger.error(f"Error in data completeness calculation: {e}")
            completeness['error'] = str(e)
        
        return completeness
    
    def _calculate_temporal_analysis(self, form_dataframes: Dict[str, pd.DataFrame]) -> Dict[str, Any]:
        """Perform temporal analysis on form data."""
        temporal = {}
        
        try:
            for form_id, df in form_dataframes.items():
                if 'submission_date' in df.columns:
                    df['submission_date'] = pd.to_datetime(df['submission_date'])
                    
                    # Daily submission counts
                    daily_counts = df.groupby(df['submission_date'].dt.date).size()
                    
                    # Weekly trends
                    df['week'] = df['submission_date'].dt.isocalendar().week
                    weekly_counts = df.groupby(['submission_date'].dt.year, 'week').size()
                    
                    # Monthly trends
                    df['month'] = df['submission_date'].dt.month
                    monthly_counts = df.groupby(['submission_date'].dt.year, 'month').size()
                    
                    temporal[form_id] = {
                        'daily_submissions': daily_counts.to_dict(),
                        'weekly_trends': weekly_counts.to_dict(),
                        'monthly_trends': monthly_counts.to_dict(),
                        'submission_stats': {
                            'total_submissions': len(df),
                            'date_range': {
                                'start': df['submission_date'].min().isoformat(),
                                'end': df['submission_date'].max().isoformat()
                            },
                            'avg_daily_submissions': round(daily_counts.mean(), 2),
                            'peak_day': daily_counts.idxmax().isoformat() if not daily_counts.empty else None
                        }
                    }
        
        except Exception as e:
            logger.error(f"Error in temporal analysis: {e}")
            temporal['error'] = str(e)
        
        return temporal
    
    def _calculate_statistical_summaries(self, form_dataframes: Dict[str, pd.DataFrame], 
                                       variables: List[str]) -> Dict[str, Any]:
        """Calculate statistical summaries for numeric variables."""
        summaries = {}
        
        try:
            for form_id, df in form_dataframes.items():
                form_summaries = {}
                
                for var in variables:
                    if var in df.columns:
                        # Check if variable is numeric
                        if pd.api.types.is_numeric_dtype(df[var]):
                            stats = df[var].describe()
                            form_summaries[var] = {
                                'count': int(stats['count']),
                                'mean': round(stats['mean'], 2),
                                'std': round(stats['std'], 2),
                                'min': round(stats['min'], 2),
                                '25%': round(stats['25%'], 2),
                                '50%': round(stats['50%'], 2),
                                '75%': round(stats['75%'], 2),
                                'max': round(stats['max'], 2),
                                'skewness': round(df[var].skew(), 3),
                                'kurtosis': round(df[var].kurtosis(), 3)
                            }
                        else:
                            # For non-numeric variables, provide frequency analysis
                            value_counts = df[var].value_counts()
                            form_summaries[var] = {
                                'type': 'categorical',
                                'unique_values': int(value_counts.count()),
                                'most_common': value_counts.head(5).to_dict(),
                                'missing_count': int(df[var].isna().sum())
                            }
                
                summaries[form_id] = form_summaries
        
        except Exception as e:
            logger.error(f"Error in statistical summaries: {e}")
            summaries['error'] = str(e)
        
        return summaries
    
    def _calculate_business_indicators(self, form_dataframes: Dict[str, pd.DataFrame], 
                                     variables: List[str]) -> Dict[str, Any]:
        """Calculate custom business logic indicators."""
        business_indicators = {}
        
        try:
            # Example: Calculate response time between forms
            if len(form_dataframes) >= 2:
                business_indicators['response_time_analysis'] = self._calculate_response_times(form_dataframes)
            
            # Example: Calculate data quality scores
            business_indicators['data_quality_scores'] = self._calculate_data_quality_scores(form_dataframes, variables)
            
            # Example: Calculate trend indicators
            business_indicators['trend_indicators'] = self._calculate_trend_indicators(form_dataframes, variables)
            
            # Example: Calculate anomaly detection
            business_indicators['anomaly_detection'] = self._detect_anomalies(form_dataframes, variables)
        
        except Exception as e:
            logger.error(f"Error in business indicators: {e}")
            business_indicators['error'] = str(e)
        
        return business_indicators
    
    def _find_high_correlations(self, correlation_matrix: pd.DataFrame, threshold: float = 0.7) -> List[Dict[str, Any]]:
        """Find variables with high correlations."""
        high_correlations = []
        
        for i in range(len(correlation_matrix.columns)):
            for j in range(i+1, len(correlation_matrix.columns)):
                corr_value = correlation_matrix.iloc[i, j]
                if abs(corr_value) >= threshold:
                    high_correlations.append({
                        'variable1': correlation_matrix.columns[i],
                        'variable2': correlation_matrix.columns[j],
                        'correlation': round(corr_value, 3),
                        'strength': 'strong' if abs(corr_value) >= 0.8 else 'moderate'
                    })
        
        return sorted(high_correlations, key=lambda x: abs(x['correlation']), reverse=True)
    
    def _calculate_response_times(self, form_dataframes: Dict[str, pd.DataFrame]) -> Dict[str, Any]:
        """Calculate response times between form submissions."""
        response_times = {}
        
        try:
            form_ids = list(form_dataframes.keys())
            if len(form_ids) >= 2:
                for i, form1_id in enumerate(form_ids):
                    for form2_id in form_ids[i+1:]:
                        df1 = form_dataframes[form1_id]
                        df2 = form_dataframes[form2_id]
                        
                        if 'submission_date' in df1.columns and 'submission_date' in df2.columns:
                            df1['submission_date'] = pd.to_datetime(df1['submission_date'])
                            df2['submission_date'] = pd.to_datetime(df2['submission_date'])
                            
                            # Calculate time differences
                            time_diffs = []
                            for date1 in df1['submission_date']:
                                for date2 in df2['submission_date']:
                                    diff = abs((date2 - date1).total_seconds() / 3600)  # hours
                                    if diff <= 24:  # Within 24 hours
                                        time_diffs.append(diff)
                            
                            if time_diffs:
                                response_times[f"{form1_id}_to_{form2_id}"] = {
                                    'mean_response_time_hours': round(np.mean(time_diffs), 2),
                                    'median_response_time_hours': round(np.median(time_diffs), 2),
                                    'min_response_time_hours': round(min(time_diffs), 2),
                                    'max_response_time_hours': round(max(time_diffs), 2),
                                    'total_pairs_within_24h': len(time_diffs)
                                }
        
        except Exception as e:
            logger.error(f"Error calculating response times: {e}")
            response_times['error'] = str(e)
        
        return response_times
    
    def _calculate_data_quality_scores(self, form_dataframes: Dict[str, pd.DataFrame], 
                                     variables: List[str]) -> Dict[str, Any]:
        """Calculate data quality scores for each form."""
        quality_scores = {}
        
        try:
            for form_id, df in form_dataframes.items():
                form_score = 0
                total_checks = 0
                
                for var in variables:
                    if var in df.columns:
                        total_checks += 1
                        var_score = 0
                        
                        # Completeness check
                        completeness = df[var].notna().sum() / len(df)
                        var_score += completeness * 0.4
                        
                        # Consistency check (for numeric variables)
                        if pd.api.types.is_numeric_dtype(df[var]):
                            # Check for outliers using IQR method
                            Q1 = df[var].quantile(0.25)
                            Q3 = df[var].quantile(0.75)
                            IQR = Q3 - Q1
                            outliers = ((df[var] < (Q1 - 1.5 * IQR)) | (df[var] > (Q3 + 1.5 * IQR))).sum()
                            consistency = 1 - (outliers / len(df))
                            var_score += consistency * 0.3
                        
                        # Validity check (basic range checks)
                        if pd.api.types.is_numeric_dtype(df[var]):
                            # Check if values are within reasonable bounds
                            if df[var].min() >= 0 and df[var].max() < 1e6:  # Example bounds
                                var_score += 0.3
                        
                        form_score += var_score
                
                if total_checks > 0:
                    quality_scores[form_id] = {
                        'overall_score': round(form_score / total_checks, 3),
                        'checks_performed': total_checks,
                        'score_breakdown': {
                            'completeness_weight': 0.4,
                            'consistency_weight': 0.3,
                            'validity_weight': 0.3
                        }
                    }
        
        except Exception as e:
            logger.error(f"Error calculating data quality scores: {e}")
            quality_scores['error'] = str(e)
        
        return quality_scores
    
    def _calculate_trend_indicators(self, form_dataframes: Dict[str, pd.DataFrame], 
                                  variables: List[str]) -> Dict[str, Any]:
        """Calculate trend indicators for time series data."""
        trend_indicators = {}
        
        try:
            for form_id, df in form_dataframes.items():
                if 'submission_date' in df.columns:
                    df['submission_date'] = pd.to_datetime(df['submission_date'])
                    df = df.sort_values('submission_date')
                    
                    form_trends = {}
                    for var in variables:
                        if var in df.columns and pd.api.types.is_numeric_dtype(df[var]):
                            # Calculate moving averages
                            df[f'{var}_ma7'] = df[var].rolling(window=7, min_periods=1).mean()
                            df[f'{var}_ma30'] = df[var].rolling(window=30, min_periods=1).mean()
                            
                            # Calculate trend direction
                            recent_values = df[var].tail(10)
                            if len(recent_values) >= 2:
                                trend_slope = np.polyfit(range(len(recent_values)), recent_values, 1)[0]
                                
                                form_trends[var] = {
                                    'trend_direction': 'increasing' if trend_slope > 0 else 'decreasing' if trend_slope < 0 else 'stable',
                                    'trend_strength': abs(trend_slope),
                                    'recent_avg': round(recent_values.mean(), 2),
                                    'overall_avg': round(df[var].mean(), 2),
                                    'volatility': round(df[var].std(), 2)
                                }
                    
                    trend_indicators[form_id] = form_trends
        
        except Exception as e:
            logger.error(f"Error calculating trend indicators: {e}")
            trend_indicators['error'] = str(e)
        
        return trend_indicators
    
    def _detect_anomalies(self, form_dataframes: Dict[str, pd.DataFrame], 
                         variables: List[str]) -> Dict[str, Any]:
        """Detect anomalies in the data."""
        anomalies = {}
        
        try:
            for form_id, df in form_dataframes.items():
                form_anomalies = {}
                
                for var in variables:
                    if var in df.columns and pd.api.types.is_numeric_dtype(df[var]):
                        # Use IQR method for anomaly detection
                        Q1 = df[var].quantile(0.25)
                        Q3 = df[var].quantile(0.75)
                        IQR = Q3 - Q1
                        
                        lower_bound = Q1 - 1.5 * IQR
                        upper_bound = Q3 + 1.5 * IQR
                        
                        outliers = df[(df[var] < lower_bound) | (df[var] > upper_bound)]
                        
                        if len(outliers) > 0:
                            form_anomalies[var] = {
                                'anomaly_count': len(outliers),
                                'anomaly_percentage': round((len(outliers) / len(df)) * 100, 2),
                                'lower_bound': round(lower_bound, 2),
                                'upper_bound': round(upper_bound, 2),
                                'anomaly_values': outliers[var].tolist()[:10]  # First 10 anomalies
                            }
                
                if form_anomalies:
                    anomalies[form_id] = form_anomalies
        
        except Exception as e:
            logger.error(f"Error detecting anomalies: {e}")
            anomalies['error'] = str(e)
        
        return anomalies
    
    def generate_report(self, results: Dict[str, Any], output_file: str = None) -> str:
        """
        Generate a comprehensive report from the indicator results.
        
        Args:
            results: The results from calculate_cross_form_indicators
            output_file: Optional file path to save the report
            
        Returns:
            The report as a string
        """
        report = []
        report.append("=" * 80)
        report.append("MULTI-FORM INDICATOR ANALYSIS REPORT")
        report.append("=" * 80)
        report.append(f"Generated: {results.get('timestamp', 'Unknown')}")
        report.append("")
        
        # Metadata
        metadata = results.get('metadata', {})
        report.append("EXECUTION SUMMARY")
        report.append("-" * 40)
        report.append(f"Forms Processed: {', '.join(metadata.get('forms_processed', []))}")
        report.append(f"Variables Used: {', '.join(metadata.get('variables_used', []))}")
        report.append(f"Total Records: {metadata.get('total_records', 0):,}")
        report.append("")
        
        # Indicators
        indicators = results.get('indicators', {})
        
        # Cross-form correlation
        if 'cross_form_correlation' in indicators:
            report.append("CROSS-FORM CORRELATION ANALYSIS")
            report.append("-" * 40)
            corr_data = indicators['cross_form_correlation']
            if 'summary' in corr_data:
                summary = corr_data['summary']
                report.append(f"Total Variables: {summary.get('total_variables', 0)}")
                report.append(f"Mean Correlation: {summary.get('mean_correlation', 0):.3f}")
                report.append(f"Max Correlation: {summary.get('max_correlation', 0):.3f}")
            
            if 'high_correlations' in corr_data:
                report.append("\nHigh Correlations (|r| >= 0.7):")
                for corr in corr_data['high_correlations'][:5]:  # Top 5
                    report.append(f"  {corr['variable1']} ↔ {corr['variable2']}: {corr['correlation']} ({corr['strength']})")
            report.append("")
        
        # Data completeness
        if 'data_completeness' in indicators:
            report.append("DATA COMPLETENESS ANALYSIS")
            report.append("-" * 40)
            completeness = indicators['data_completeness']
            for form_id, form_data in completeness.items():
                if form_id != 'overall':
                    report.append(f"\nForm: {form_id}")
                    for var, stats in form_data.items():
                        report.append(f"  {var}: {stats['completeness_rate']}% complete ({stats['non_null_count']}/{stats['total_count']})")
            report.append("")
        
        # Statistical summaries
        if 'statistical_summaries' in indicators:
            report.append("STATISTICAL SUMMARIES")
            report.append("-" * 40)
            summaries = indicators['statistical_summaries']
            for form_id, form_data in summaries.items():
                report.append(f"\nForm: {form_id}")
                for var, stats in form_data.items():
                    if 'mean' in stats:  # Numeric variable
                        report.append(f"  {var}: mean={stats['mean']}, std={stats['std']}, range=[{stats['min']}, {stats['max']}]")
                    else:  # Categorical variable
                        report.append(f"  {var}: {stats['unique_values']} unique values, {stats['missing_count']} missing")
            report.append("")
        
        # Business indicators
        if 'business_indicators' in indicators:
            report.append("BUSINESS INDICATORS")
            report.append("-" * 40)
            business = indicators['business_indicators']
            
            if 'data_quality_scores' in business:
                report.append("\nData Quality Scores:")
                for form_id, score_data in business['data_quality_scores'].items():
                    report.append(f"  {form_id}: {score_data['overall_score']:.3f}")
            
            if 'trend_indicators' in business:
                report.append("\nTrend Analysis:")
                for form_id, trends in business['trend_indicators'].items():
                    for var, trend_data in trends.items():
                        report.append(f"  {form_id}.{var}: {trend_data['trend_direction']} trend")
            report.append("")
        
        # Error handling
        if 'error' in results:
            report.append("ERRORS ENCOUNTERED")
            report.append("-" * 40)
            report.append(f"Error: {results['error']}")
            report.append("")
        
        report.append("=" * 80)
        report.append("END OF REPORT")
        report.append("=" * 80)
        
        report_text = "\n".join(report)
        
        if output_file:
            try:
                with open(output_file, 'w') as f:
                    f.write(report_text)
                logger.info(f"Report saved to {output_file}")
            except Exception as e:
                logger.error(f"Failed to save report to {output_file}: {e}")
        
        return report_text

def main():
    """Main function to run the multi-form indicator script."""
    parser = argparse.ArgumentParser(description='Multi-Form Indicator Script')
    parser.add_argument('--form-ids', required=True, help='Comma-separated list of form IDs')
    parser.add_argument('--variables', required=True, help='Comma-separated list of variables to analyze')
    parser.add_argument('--api-url', required=True, help='Base URL for the API')
    parser.add_argument('--auth-token', required=True, help='Authentication token')
    parser.add_argument('--output', help='Output file for the report')
    
    args = parser.parse_args()
    
    # Parse arguments
    form_ids = [fid.strip() for fid in args.form_ids.split(',')]
    variables = [var.strip() for var in args.variables.split(',')]
    
    logger.info(f"Starting multi-form indicator analysis")
    logger.info(f"Forms: {form_ids}")
    logger.info(f"Variables: {variables}")
    
    # Initialize processor
    processor = MultiFormIndicatorProcessor(args.api_url, args.auth_token)
    
    # Fetch and process data from all forms
    form_dataframes = {}
    for form_id in form_ids:
        logger.info(f"Fetching data from form {form_id}")
        
        # Fetch form structure
        form_structure = processor.fetch_form_structure(form_id)
        if not form_structure:
            logger.warning(f"Could not fetch structure for form {form_id}")
            continue
        
        # Fetch form data
        form_data = processor.fetch_form_data(form_id)
        if not form_data:
            logger.warning(f"No data found for form {form_id}")
            continue
        
        # Normalize data
        df = processor.normalize_data(form_data, form_structure)
        if not df.empty:
            form_dataframes[form_id] = df
            logger.info(f"Processed {len(df)} records from form {form_id}")
        else:
            logger.warning(f"No valid data processed for form {form_id}")
    
    if not form_dataframes:
        logger.error("No data could be processed from any forms")
        return 1
    
    # Calculate indicators
    logger.info("Calculating cross-form indicators")
    results = processor.calculate_cross_form_indicators(form_dataframes, variables)
    
    # Generate report
    logger.info("Generating report")
    report = processor.generate_report(results, args.output)
    
    # Print summary
    print("\n" + "="*60)
    print("ANALYSIS COMPLETE")
    print("="*60)
    print(f"Forms processed: {len(form_dataframes)}")
    print(f"Total records: {results.get('metadata', {}).get('total_records', 0):,}")
    print(f"Variables analyzed: {len(variables)}")
    
    if args.output:
        print(f"Report saved to: {args.output}")
    else:
        print("\nReport:")
        print(report)
    
    return 0

if __name__ == "__main__":
    sys.exit(main()) 