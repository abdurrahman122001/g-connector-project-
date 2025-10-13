#!/usr/bin/env python3
"""
Comprehensive Indicator Script Template
Supports all output types: Numerical, Chart-based, and Geospatial outputs
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
from typing import List, Dict, Any, Optional

def generate_outputs(data: pd.DataFrame, parameters: Optional[Dict] = None) -> List[Dict]:
    """
    Generate comprehensive indicator outputs including numerical, chart-based, and geospatial data.
    
    Args:
        data: Input DataFrame containing the data to analyze
        parameters: Optional parameters for customization
    
    Returns:
        List of output dictionaries in the standardized format
    """
    outputs = []
    
    # 🔢 1. NUMERICAL OUTPUTS
    outputs.extend(generate_numerical_outputs(data, parameters))
    
    # 📊 2. CHART-BASED OUTPUTS
    outputs.extend(generate_chart_outputs(data, parameters))
    
    # 🗺️ 3. GEOSPATIAL OUTPUTS
    outputs.extend(generate_geospatial_outputs(data, parameters))
    
    return outputs

def generate_numerical_outputs(data: pd.DataFrame, parameters: Optional[Dict] = None) -> List[Dict]:
    """Generate numerical outputs including single values, percentages, ratios, and trends."""
    outputs = []
    
    # Single Value Output
    total_cases = len(data)
    outputs.append({
        "id": "total_cases",
        "name": "Total Cases",
        "type": "numeric_value",
        "description": "Total number of cases analyzed",
        "data": {
            "value": total_cases,
            "unit": "cases",
            "format": "number",
            "precision": 0
        }
    })
    
    # Percentage Output
    if 'status' in data.columns:
        positive_cases = len(data[data['status'] == 'positive'])
        positive_percentage = (positive_cases / total_cases) * 100 if total_cases > 0 else 0
        
        outputs.append({
            "id": "positive_percentage",
            "name": "Positive Cases Percentage",
            "type": "numeric_value",
            "description": "Percentage of positive cases",
            "data": {
                "value": round(positive_percentage, 1),
                "unit": "%",
                "format": "percentage",
                "precision": 1
            }
        })
    
    # Ratio Output
    if 'gender' in data.columns:
        male_count = len(data[data['gender'] == 'male'])
        female_count = len(data[data['gender'] == 'female'])
        
        if female_count > 0:
            ratio = male_count / female_count
            outputs.append({
                "id": "gender_ratio",
                "name": "Male:Female Ratio",
                "type": "numeric_value",
                "description": "Ratio of male to female cases",
                "data": {
                    "value": round(ratio, 2),
                    "unit": "",
                    "format": "ratio",
                    "precision": 2
                }
            })
    
    # Trend Value Output
    if 'date' in data.columns:
        trend_data = calculate_trend(data)
        outputs.append({
            "id": "monthly_trend",
            "name": "Monthly Trend",
            "type": "numeric_value",
            "description": "Change from last month",
            "data": {
                "value": trend_data['change_percentage'],
                "unit": "%",
                "format": "trend",
                "precision": 1,
                "trendDirection": trend_data['direction'],
                "previousValue": trend_data['previous_value'],
                "currentValue": trend_data['current_value']
            }
        })
    
    return outputs

def generate_chart_outputs(data: pd.DataFrame, parameters: Optional[Dict] = None) -> List[Dict]:
    """Generate various chart-based outputs."""
    outputs = []
    
    # Bar Chart - Vertical
    if 'category' in data.columns:
        category_counts = data['category'].value_counts()
        outputs.append({
            "id": "category_bar_chart",
            "name": "Category Distribution",
            "type": "bar_chart",
            "description": "Distribution of cases by category",
            "data": {
                "categories": category_counts.index.tolist(),
                "values": category_counts.values.tolist(),
                "orientation": "vertical",
                "colors": ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"],
                "xAxisLabel": "Category",
                "yAxisLabel": "Count"
            }
        })
    
    # Bar Chart - Horizontal
    outputs.append({
        "id": "category_horizontal_bar",
        "name": "Category Distribution (Horizontal)",
        "type": "bar_chart",
        "description": "Horizontal bar chart of category distribution",
        "data": {
            "categories": category_counts.index.tolist(),
            "values": category_counts.values.tolist(),
            "orientation": "horizontal",
            "colors": ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"],
            "xAxisLabel": "Count",
            "yAxisLabel": "Category"
        }
    })
    
    # Line Chart for Trends
    if 'date' in data.columns:
        time_series_data = generate_time_series_data(data)
        outputs.append({
            "id": "trend_line_chart",
            "name": "Trend Over Time",
            "type": "line_chart",
            "description": "Case count trend over time",
            "data": {
                "labels": time_series_data['labels'],
                "datasets": [
                    {
                        "label": "Cases",
                        "data": time_series_data['values'],
                        "borderColor": "#0088FE",
                        "backgroundColor": "rgba(0, 136, 254, 0.1)",
                        "fill": True
                    }
                ],
                "xAxisLabel": "Date",
                "yAxisLabel": "Count"
            }
        })
    
    # Pie Chart
    if 'status' in data.columns:
        status_counts = data['status'].value_counts()
        outputs.append({
            "id": "status_pie_chart",
            "name": "Status Distribution",
            "type": "pie_chart",
            "description": "Distribution of cases by status",
            "data": {
                "labels": status_counts.index.tolist(),
                "values": status_counts.values.tolist(),
                "colors": ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7"],
                "showPercentage": True
            }
        })
    
    # Donut Chart
    outputs.append({
        "id": "status_donut_chart",
        "name": "Status Distribution (Donut)",
        "type": "donut_chart",
        "description": "Donut chart showing status distribution",
        "data": {
            "labels": status_counts.index.tolist(),
            "values": status_counts.values.tolist(),
            "colors": ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7"],
            "showPercentage": True,
            "innerRadius": 60
        }
    })
    
    # Area Chart
    if 'date' in data.columns:
        outputs.append({
            "id": "area_chart",
            "name": "Cases Over Time (Area)",
            "type": "area_chart",
            "description": "Area chart showing case volume over time",
            "data": {
                "labels": time_series_data['labels'],
                "datasets": [
                    {
                        "label": "Cases",
                        "data": time_series_data['values'],
                        "backgroundColor": "rgba(0, 136, 254, 0.3)",
                        "borderColor": "#0088FE"
                    }
                ],
                "xAxisLabel": "Date",
                "yAxisLabel": "Count"
            }
        })
    
    # Column Chart (Vertical Bar)
    outputs.append({
        "id": "column_chart",
        "name": "Category Distribution (Column)",
        "type": "column_chart",
        "description": "Column chart of category distribution",
        "data": {
            "categories": category_counts.index.tolist(),
            "values": category_counts.values.tolist(),
            "colors": ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"],
            "xAxisLabel": "Category",
            "yAxisLabel": "Count"
        }
    })
    
    # Stacked Bar Chart
    if 'category' in data.columns and 'status' in data.columns:
        stacked_data = generate_stacked_data(data)
        outputs.append({
            "id": "stacked_bar_chart",
            "name": "Category by Status (Stacked)",
            "type": "stacked_bar_chart",
            "description": "Stacked bar chart showing category distribution by status",
            "data": {
                "categories": stacked_data['categories'],
                "datasets": stacked_data['datasets'],
                "orientation": "vertical",
                "xAxisLabel": "Category",
                "yAxisLabel": "Count"
            }
        })
    
    # Radar/Spider Chart
    if 'category' in data.columns:
        radar_data = generate_radar_data(data)
        outputs.append({
            "id": "radar_chart",
            "name": "Multi-dimensional Analysis",
            "type": "radar_chart",
            "description": "Radar chart showing multiple dimensions",
            "data": {
                "labels": radar_data['labels'],
                "datasets": [
                    {
                        "label": "Current Period",
                        "data": radar_data['current_values'],
                        "borderColor": "#0088FE",
                        "backgroundColor": "rgba(0, 136, 254, 0.2)"
                    },
                    {
                        "label": "Previous Period",
                        "data": radar_data['previous_values'],
                        "borderColor": "#FF6B6B",
                        "backgroundColor": "rgba(255, 107, 107, 0.2)"
                    }
                ]
            }
        })
    
    return outputs

def generate_geospatial_outputs(data: pd.DataFrame, parameters: Optional[Dict] = None) -> List[Dict]:
    """Generate geospatial outputs including maps, heatmaps, and choropleth charts."""
    outputs = []
    
    # Map-based Visualization
    if 'latitude' in data.columns and 'longitude' in data.columns:
        map_data = generate_map_data(data)
        outputs.append({
            "id": "location_map",
            "name": "Case Locations",
            "type": "map_chart",
            "description": "Map showing case locations",
            "data": {
                "points": map_data['points'],
                "center": map_data['center'],
                "zoom": 10,
                "mapType": "point_map"
            }
        })
    
    # Heatmap
    if 'latitude' in data.columns and 'longitude' in data.columns:
        heatmap_data = generate_heatmap_data(data)
        outputs.append({
            "id": "case_heatmap",
            "name": "Case Density Heatmap",
            "type": "heatmap_chart",
            "description": "Heatmap showing case density by location",
            "data": {
                "points": heatmap_data['points'],
                "intensities": heatmap_data['intensities'],
                "center": heatmap_data['center'],
                "zoom": 10,
                "radius": 20
            }
        })
    
    # Choropleth (if region data is available)
    if 'region' in data.columns:
        choropleth_data = generate_choropleth_data(data)
        outputs.append({
            "id": "regional_distribution",
            "name": "Regional Distribution",
            "type": "choropleth_chart",
            "description": "Choropleth map showing regional case distribution",
            "data": {
                "regions": choropleth_data['regions'],
                "values": choropleth_data['values'],
                "colorScale": "Blues",
                "minValue": choropleth_data['min_value'],
                "maxValue": choropleth_data['max_value']
            }
        })
    
    return outputs

# Helper functions
def calculate_trend(data: pd.DataFrame) -> Dict[str, Any]:
    """Calculate trend from previous month to current month."""
    if 'date' not in data.columns:
        return {"change_percentage": 0, "direction": "neutral", "previous_value": 0, "current_value": 0}
    
    data['date'] = pd.to_datetime(data['date'])
    current_month = datetime.now().replace(day=1)
    previous_month = (current_month - timedelta(days=1)).replace(day=1)
    
    current_count = len(data[data['date'] >= current_month])
    previous_count = len(data[(data['date'] >= previous_month) & (data['date'] < current_month)])
    
    if previous_count == 0:
        change_percentage = 100 if current_count > 0 else 0
    else:
        change_percentage = ((current_count - previous_count) / previous_count) * 100
    
    return {
        "change_percentage": round(change_percentage, 1),
        "direction": "up" if change_percentage > 0 else "down" if change_percentage < 0 else "neutral",
        "previous_value": previous_count,
        "current_value": current_count
    }

def generate_time_series_data(data: pd.DataFrame) -> Dict[str, Any]:
    """Generate time series data for line charts."""
    if 'date' not in data.columns:
        return {"labels": [], "values": []}
    
    data['date'] = pd.to_datetime(data['date'])
    data['month'] = data['date'].dt.to_period('M')
    monthly_counts = data.groupby('month').size()
    
    return {
        "labels": [str(period) for period in monthly_counts.index],
        "values": monthly_counts.values.tolist()
    }

def generate_stacked_data(data: pd.DataFrame) -> Dict[str, Any]:
    """Generate stacked bar chart data."""
    if 'category' not in data.columns or 'status' not in data.columns:
        return {"categories": [], "datasets": []}
    
    pivot_table = pd.crosstab(data['category'], data['status'])
    
    datasets = []
    colors = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]
    
    for i, status in enumerate(pivot_table.columns):
        datasets.append({
            "label": status,
            "data": pivot_table[status].values.tolist(),
            "backgroundColor": colors[i % len(colors)]
        })
    
    return {
        "categories": pivot_table.index.tolist(),
        "datasets": datasets
    }

def generate_radar_data(data: pd.DataFrame) -> Dict[str, Any]:
    """Generate radar chart data."""
    # Example dimensions for radar chart
    dimensions = ['total_cases', 'positive_rate', 'avg_age', 'male_ratio', 'urban_ratio']
    
    # Calculate current period values (last 30 days)
    current_date = datetime.now()
    current_data = data[pd.to_datetime(data['date']) >= current_date - timedelta(days=30)]
    
    # Calculate previous period values (30-60 days ago)
    previous_data = data[
        (pd.to_datetime(data['date']) >= current_date - timedelta(days=60)) &
        (pd.to_datetime(data['date']) < current_date - timedelta(days=30))
    ]
    
    current_values = [
        len(current_data),
        (len(current_data[current_data['status'] == 'positive']) / len(current_data) * 100) if len(current_data) > 0 else 0,
        current_data['age'].mean() if 'age' in current_data.columns else 0,
        (len(current_data[current_data['gender'] == 'male']) / len(current_data) * 100) if len(current_data) > 0 else 0,
        75  # Example urban ratio
    ]
    
    previous_values = [
        len(previous_data),
        (len(previous_data[previous_data['status'] == 'positive']) / len(previous_data) * 100) if len(previous_data) > 0 else 0,
        previous_data['age'].mean() if 'age' in previous_data.columns else 0,
        (len(previous_data[previous_data['gender'] == 'male']) / len(previous_data) * 100) if len(previous_data) > 0 else 0,
        70  # Example urban ratio
    ]
    
    return {
        "labels": dimensions,
        "current_values": [round(v, 1) for v in current_values],
        "previous_values": [round(v, 1) for v in previous_values]
    }

def generate_map_data(data: pd.DataFrame) -> Dict[str, Any]:
    """Generate map data for location-based visualizations."""
    if 'latitude' not in data.columns or 'longitude' not in data.columns:
        return {"points": [], "center": [0, 0]}
    
    points = []
    for _, row in data.iterrows():
        if pd.notna(row['latitude']) and pd.notna(row['longitude']):
            points.append({
                "lat": float(row['latitude']),
                "lng": float(row['longitude']),
                "title": f"Case ID: {row.get('id', 'N/A')}",
                "description": f"Status: {row.get('status', 'N/A')}"
            })
    
    # Calculate center point
    if points:
        center_lat = sum(p['lat'] for p in points) / len(points)
        center_lng = sum(p['lng'] for p in points) / len(points)
        center = [center_lat, center_lng]
    else:
        center = [0, 0]
    
    return {"points": points, "center": center}

def generate_heatmap_data(data: pd.DataFrame) -> Dict[str, Any]:
    """Generate heatmap data."""
    if 'latitude' not in data.columns or 'longitude' not in data.columns:
        return {"points": [], "intensities": [], "center": [0, 0]}
    
    # Group by location and count cases
    location_counts = data.groupby(['latitude', 'longitude']).size().reset_index(name='count')
    
    points = []
    intensities = []
    
    for _, row in location_counts.iterrows():
        if pd.notna(row['latitude']) and pd.notna(row['longitude']):
            points.append([float(row['latitude']), float(row['longitude'])])
            intensities.append(int(row['count']))
    
    # Calculate center
    if points:
        center_lat = sum(p[0] for p in points) / len(points)
        center_lng = sum(p[1] for p in points) / len(points)
        center = [center_lat, center_lng]
    else:
        center = [0, 0]
    
    return {"points": points, "intensities": intensities, "center": center}

def generate_choropleth_data(data: pd.DataFrame) -> Dict[str, Any]:
    """Generate choropleth data for regional visualization."""
    if 'region' not in data.columns:
        return {"regions": [], "values": [], "min_value": 0, "max_value": 0}
    
    region_counts = data['region'].value_counts()
    
    return {
        "regions": region_counts.index.tolist(),
        "values": region_counts.values.tolist(),
        "min_value": int(region_counts.min()) if len(region_counts) > 0 else 0,
        "max_value": int(region_counts.max()) if len(region_counts) > 0 else 0
    }

# Main execution function
def main():
    """
    Main function to execute the indicator analysis.
    This function should be called by the backend system.
    """
    # Example usage - replace with actual data loading
    # data = pd.read_csv('your_data.csv')
    # parameters = {"dateRange": "last_30_days", "filters": {"region": "north"}}
    
    # For demonstration, create sample data
    sample_data = pd.DataFrame({
        'id': range(1, 101),
        'date': pd.date_range(start='2024-01-01', periods=100, freq='D'),
        'category': np.random.choice(['A', 'B', 'C', 'D'], 100),
        'status': np.random.choice(['positive', 'negative', 'pending'], 100),
        'gender': np.random.choice(['male', 'female'], 100),
        'age': np.random.randint(18, 80, 100),
        'region': np.random.choice(['North', 'South', 'East', 'West'], 100),
        'latitude': np.random.uniform(30, 50, 100),
        'longitude': np.random.uniform(-120, -70, 100)
    })
    
    parameters = {"dateRange": "last_30_days", "filters": {"region": "all"}}
    
    # Generate outputs
    outputs = generate_outputs(sample_data, parameters)
    
    # Return the outputs in the expected format
    return {
        "success": True,
        "outputs": outputs,
        "executionTime": "2.5s",
        "executedAt": datetime.now().isoformat()
    }

if __name__ == "__main__":
    result = main()
    print(json.dumps(result, indent=2)) 