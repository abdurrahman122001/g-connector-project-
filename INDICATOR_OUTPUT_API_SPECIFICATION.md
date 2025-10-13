# Indicator Output API Specification for Backend Developers

This document describes the required API endpoints for managing indicator outputs, script-based result definitions, and dashboard display controls.

---

## 1. Get Indicator Outputs Endpoint

### **Purpose:**
- To retrieve all possible outputs defined by an indicator's script and their current display settings.

### **Endpoint:**
- `GET /api/data-warehouse/indicators/:indicatorId/outputs`

### **Response Example:**
```json
{
  "success": true,
  "data": {
    "indicatorId": "indicator456",
    "indicatorName": "Antibiotic Resistance Rate",
    "scriptOutputs": [
      {
        "id": "total_cases",
        "name": "Total Cases",
        "type": "numeric_value",
        "description": "Total number of cases analyzed",
        "data": {
          "value": 156,
          "unit": "cases",
          "format": "number",
          "precision": 0
        },
        "isVisibleOnDashboard": true,
        "isVisibleOnAnalytics": true,
        "order": 1
      },
      {
        "id": "positive_percentage",
        "name": "Positive Cases Percentage",
        "type": "numeric_value",
        "description": "Percentage of positive cases",
        "data": {
          "value": 45.2,
          "unit": "%",
          "format": "percentage",
          "precision": 1
        },
        "isVisibleOnDashboard": true,
        "isVisibleOnAnalytics": true,
        "order": 2
      },
      {
        "id": "gender_ratio",
        "name": "Male:Female Ratio",
        "type": "numeric_value",
        "description": "Ratio of male to female cases",
        "data": {
          "value": 1.25,
          "unit": "",
          "format": "ratio",
          "precision": 2
        },
        "isVisibleOnDashboard": true,
        "isVisibleOnAnalytics": true,
        "order": 3
      },
      {
        "id": "monthly_trend",
        "name": "Monthly Trend",
        "type": "numeric_value",
        "description": "Change from last month",
        "data": {
          "value": 12.5,
          "unit": "%",
          "format": "trend",
          "precision": 1,
          "trendDirection": "up",
          "previousValue": 120,
          "currentValue": 135
        },
        "isVisibleOnDashboard": true,
        "isVisibleOnAnalytics": true,
        "order": 4
      },
      {
        "id": "category_bar_chart",
        "name": "Category Distribution",
        "type": "bar_chart",
        "description": "Distribution of cases by category",
        "data": {
          "categories": ["Category A", "Category B", "Category C", "Category D"],
          "values": [45, 35, 20, 15],
          "orientation": "vertical",
          "colors": ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"],
          "xAxisLabel": "Category",
          "yAxisLabel": "Count"
        },
        "isVisibleOnDashboard": true,
        "isVisibleOnAnalytics": true,
        "order": 5
      },
      {
        "id": "trend_line_chart",
        "name": "Trend Over Time",
        "type": "line_chart",
        "description": "Case count trend over time",
        "data": {
          "labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
          "datasets": [
            {
              "label": "Cases",
              "data": [30, 35, 40, 38, 45, 42],
              "borderColor": "#0088FE",
              "backgroundColor": "rgba(0, 136, 254, 0.1)",
              "fill": true
            }
          ],
          "xAxisLabel": "Date",
          "yAxisLabel": "Count"
        },
        "isVisibleOnDashboard": false,
        "isVisibleOnAnalytics": true,
        "order": 6
      },
      {
        "id": "status_pie_chart",
        "name": "Status Distribution",
        "type": "pie_chart",
        "description": "Distribution of cases by status",
        "data": {
          "labels": ["Positive", "Negative", "Pending"],
          "values": [45, 35, 20],
          "colors": ["#FF6B6B", "#4ECDC4", "#45B7D1"],
          "showPercentage": true
        },
        "isVisibleOnDashboard": true,
        "isVisibleOnAnalytics": true,
        "order": 7
      },
      {
        "id": "status_donut_chart",
        "name": "Status Distribution (Donut)",
        "type": "donut_chart",
        "description": "Donut chart showing status distribution",
        "data": {
          "labels": ["Positive", "Negative", "Pending"],
          "values": [45, 35, 20],
          "colors": ["#FF6B6B", "#4ECDC4", "#45B7D1"],
          "showPercentage": true,
          "innerRadius": 60
        },
        "isVisibleOnDashboard": false,
        "isVisibleOnAnalytics": true,
        "order": 8
      },
      {
        "id": "area_chart",
        "name": "Cases Over Time (Area)",
        "type": "area_chart",
        "description": "Area chart showing case volume over time",
        "data": {
          "labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
          "datasets": [
            {
              "label": "Cases",
              "data": [30, 35, 40, 38, 45, 42],
              "backgroundColor": "rgba(0, 136, 254, 0.3)",
              "borderColor": "#0088FE"
            }
          ],
          "xAxisLabel": "Date",
          "yAxisLabel": "Count"
        },
        "isVisibleOnDashboard": false,
        "isVisibleOnAnalytics": true,
        "order": 9
      },
      {
        "id": "column_chart",
        "name": "Category Distribution (Column)",
        "type": "column_chart",
        "description": "Column chart of category distribution",
        "data": {
          "categories": ["Category A", "Category B", "Category C", "Category D"],
          "values": [45, 35, 20, 15],
          "colors": ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"],
          "xAxisLabel": "Category",
          "yAxisLabel": "Count"
        },
        "isVisibleOnDashboard": false,
        "isVisibleOnAnalytics": true,
        "order": 10
      },
      {
        "id": "stacked_bar_chart",
        "name": "Category by Status (Stacked)",
        "type": "stacked_bar_chart",
        "description": "Stacked bar chart showing category distribution by status",
        "data": {
          "categories": ["Category A", "Category B", "Category C", "Category D"],
          "datasets": [
            {
              "label": "Positive",
              "data": [25, 20, 12, 8],
              "backgroundColor": "#FF6B6B"
            },
            {
              "label": "Negative",
              "data": [15, 10, 6, 5],
              "backgroundColor": "#4ECDC4"
            },
            {
              "label": "Pending",
              "data": [5, 5, 2, 2],
              "backgroundColor": "#45B7D1"
            }
          ],
          "orientation": "vertical",
          "xAxisLabel": "Category",
          "yAxisLabel": "Count"
        },
        "isVisibleOnDashboard": false,
        "isVisibleOnAnalytics": true,
        "order": 11
      },
      {
        "id": "radar_chart",
        "name": "Multi-dimensional Analysis",
        "type": "radar_chart",
        "description": "Radar chart showing multiple dimensions",
        "data": {
          "labels": ["Total Cases", "Positive Rate", "Avg Age", "Male Ratio", "Urban Ratio"],
          "datasets": [
            {
              "label": "Current Period",
              "data": [100, 45.2, 35.5, 55.5, 75.0],
              "borderColor": "#0088FE",
              "backgroundColor": "rgba(0, 136, 254, 0.2)"
            },
            {
              "label": "Previous Period",
              "data": [85, 42.1, 34.2, 52.8, 70.0],
              "borderColor": "#FF6B6B",
              "backgroundColor": "rgba(255, 107, 107, 0.2)"
            }
          ]
        },
        "isVisibleOnDashboard": false,
        "isVisibleOnAnalytics": true,
        "order": 12
      },
      {
        "id": "location_map",
        "name": "Case Locations",
        "type": "map_chart",
        "description": "Map showing case locations",
        "data": {
          "points": [
            {
              "lat": 40.7128,
              "lng": -74.0060,
              "title": "Case ID: 123",
              "description": "Status: Positive"
            }
          ],
          "center": [40.7128, -74.0060],
          "zoom": 10,
          "mapType": "point_map"
        },
        "isVisibleOnDashboard": false,
        "isVisibleOnAnalytics": true,
        "order": 13
      },
      {
        "id": "case_heatmap",
        "name": "Case Density Heatmap",
        "type": "heatmap_chart",
        "description": "Heatmap showing case density by location",
        "data": {
          "points": [[40.7128, -74.0060], [40.7589, -73.9851]],
          "intensities": [15, 8],
          "center": [40.7128, -74.0060],
          "zoom": 10,
          "radius": 20
        },
        "isVisibleOnDashboard": false,
        "isVisibleOnAnalytics": true,
        "order": 14
      },
      {
        "id": "regional_distribution",
        "name": "Regional Distribution",
        "type": "choropleth_chart",
        "description": "Choropleth map showing regional case distribution",
        "data": {
          "regions": ["North", "South", "East", "West"],
          "values": [45, 35, 20, 15],
          "colorScale": "Blues",
          "minValue": 15,
          "maxValue": 45
        },
        "isVisibleOnDashboard": false,
        "isVisibleOnAnalytics": true,
        "order": 15
      }
    ],
    "lastExecuted": "2024-01-15T10:30:00Z",
    "executionStatus": "success"
  }
}
```

### **Output Types:**

#### 🔢 **1. Numerical Outputs**
- `numeric_value`: Single numeric value with various formats
  - `format`: "number", "percentage", "ratio", "trend"
  - `precision`: Number of decimal places
  - `unit`: Unit of measurement
  - `trendDirection`: "up", "down", "neutral" (for trend format)
  - `previousValue`, `currentValue`: For trend comparisons

#### 📊 **2. Chart-Based Outputs**

**a. Bar Chart**
- `bar_chart`: Vertical or horizontal bar charts
  - `orientation`: "vertical" or "horizontal"
  - `categories`: Array of category labels
  - `values`: Array of corresponding values
  - `colors`: Array of hex colors
  - `xAxisLabel`, `yAxisLabel`: Axis labels

**b. Line Chart**
- `line_chart`: For trends over time
  - `labels`: Array of time labels
  - `datasets`: Array of dataset objects with `label`, `data`, `borderColor`, `backgroundColor`, `fill`
  - `xAxisLabel`, `yAxisLabel`: Axis labels

**c. Pie Chart**
- `pie_chart`: For proportions or distributions
  - `labels`: Array of category labels
  - `values`: Array of corresponding values
  - `colors`: Array of hex colors
  - `showPercentage`: Boolean to show percentages

**d. Donut Chart**
- `donut_chart`: Similar to pie chart but with inner radius
  - Same properties as pie_chart
  - `innerRadius`: Inner radius percentage (0-100)

**e. Area Chart**
- `area_chart`: Similar to line charts, but filled
  - Same structure as line_chart
  - `fill`: Always true for area charts

**f. Column Chart**
- `column_chart`: Vertical bar chart (same as vertical bar_chart)
  - Same properties as bar_chart with vertical orientation

**g. Stacked Bar/Area Chart**
- `stacked_bar_chart`: Shows parts of a whole over categories
  - `categories`: Array of category labels
  - `datasets`: Array of dataset objects for each stack
  - `orientation`: "vertical" or "horizontal"

**h. Radar/Spider Chart**
- `radar_chart`: Multi-dimensional comparison
  - `labels`: Array of dimension labels
  - `datasets`: Array of dataset objects for comparison

#### 🗺️ **3. Geospatial Outputs**

**a. Map Chart**
- `map_chart`: Map-based visualization
  - `points`: Array of point objects with `lat`, `lng`, `title`, `description`
  - `center`: [latitude, longitude] for map center
  - `zoom`: Zoom level (1-20)
  - `mapType`: "point_map", "cluster_map"

**b. Heatmap Chart**
- `heatmap_chart`: Heatmap visualization
  - `points`: Array of [latitude, longitude] coordinates
  - `intensities`: Array of intensity values
  - `center`: [latitude, longitude] for map center
  - `zoom`: Zoom level (1-20)
  - `radius`: Heatmap radius in pixels

**c. Choropleth Chart**
- `choropleth_chart`: Colored regions map
  - `regions`: Array of region identifiers
  - `values`: Array of corresponding values
  - `colorScale`: Color scale name ("Blues", "Reds", "Greens", etc.)
  - `minValue`, `maxValue`: Value range for color scaling

---

## 2. Update Indicator Output Visibility Endpoint

### **Purpose:**
- To update which outputs are visible on the dashboard vs analytics page.

### **Endpoint:**
- `PUT /api/data-warehouse/indicators/:indicatorId/outputs/visibility`

### **Request Body:**
```json
{
  "outputs": [
    {
      "id": "total_cases",
      "isVisibleOnDashboard": true,
      "isVisibleOnAnalytics": true,
      "order": 1
    },
    {
      "id": "category_bar_chart",
      "isVisibleOnDashboard": false,
      "isVisibleOnAnalytics": true,
      "order": 2
    },
    {
      "id": "location_map",
      "isVisibleOnDashboard": true,
      "isVisibleOnAnalytics": true,
      "order": 3
    }
  ]
}
```

### **Response:**
```json
{
  "success": true,
  "data": {
    "message": "Output visibility updated successfully",
    "updatedOutputs": 3
  }
}
```

---

## 3. Execute Indicator Script Endpoint

### **Purpose:**
- To execute an indicator's script and generate fresh output data.

### **Endpoint:**
- `POST /api/data-warehouse/indicators/:indicatorId/execute`

### **Request Body:**
```json
{
  "parameters": {
    "dateRange": "last_30_days",
    "filters": {
      "antibiotic": ["CIP", "GEN"],
      "region": "north"
    }
  }
}
```

### **Response:**
```json
{
  "success": true,
  "data": {
    "executionId": "exec123",
    "status": "completed",
    "executionTime": "2.5s",
    "outputs": [
      {
        "id": "total_cases",
        "name": "Total Cases",
        "type": "numeric_value",
        "data": {
          "value": 156,
          "unit": "cases",
          "format": "number",
          "precision": 0
        }
      }
    ],
    "executedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

## 4. Get Dashboard Outputs Endpoint

### **Purpose:**
- To retrieve all outputs that should be displayed on the main dashboard.

### **Endpoint:**
- `GET /api/data-warehouse/dashboard/outputs`

### **Response:**
```json
{
  "success": true,
  "data": {
    "dashboardOutputs": [
      {
        "indicatorId": "indicator456",
        "indicatorName": "Antibiotic Resistance Rate",
        "outputs": [
          {
            "id": "total_cases",
            "name": "Total Cases",
            "type": "numeric_value",
            "data": {
              "value": 156,
              "unit": "cases",
              "format": "number",
              "precision": 0
            },
            "order": 1
          },
          {
            "id": "category_bar_chart",
            "name": "Category Distribution",
            "type": "bar_chart",
            "data": {
              "categories": ["Category A", "Category B", "Category C", "Category D"],
              "values": [45, 35, 20, 15],
              "orientation": "vertical",
              "colors": ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"],
              "xAxisLabel": "Category",
              "yAxisLabel": "Count"
            },
            "order": 2
          }
        ]
      }
    ],
    "lastUpdated": "2024-01-15T10:30:00Z"
  }
}
```

---

## 5. Get Analytics Outputs Endpoint

### **Purpose:**
- To retrieve all outputs for the analytics page (full view).

### **Endpoint:**
- `GET /api/data-warehouse/analytics/outputs`

### **Response:**
```json
{
  "success": true,
  "data": {
    "analyticsOutputs": [
      {
        "indicatorId": "indicator456",
        "indicatorName": "Antibiotic Resistance Rate",
        "outputs": [
          {
            "id": "total_cases",
            "name": "Total Cases",
            "type": "numeric_value",
            "data": {
              "value": 156,
              "unit": "cases",
              "format": "number",
              "precision": 0
            }
          },
          {
            "id": "category_bar_chart",
            "name": "Category Distribution",
            "type": "bar_chart",
            "data": {
              "categories": ["Category A", "Category B", "Category C", "Category D"],
              "values": [45, 35, 20, 15],
              "orientation": "vertical",
              "colors": ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"],
              "xAxisLabel": "Category",
              "yAxisLabel": "Count"
            }
          },
          {
            "id": "location_map",
            "name": "Case Locations",
            "type": "map_chart",
            "data": {
              "points": [
                {
                  "lat": 40.7128,
                  "lng": -74.0060,
                  "title": "Case ID: 123",
                  "description": "Status: Positive"
                }
              ],
              "center": [40.7128, -74.0060],
              "zoom": 10,
              "mapType": "point_map"
            }
          }
        ]
      }
    ]
  }
}
```

---

## 6. Script Output Definition Schema

### **Script Output Structure:**
Scripts should define outputs in a standardized format that the backend can parse:

```python
# Example Python script output definition
def generate_outputs(data, parameters=None):
    outputs = []
    
    # 🔢 Numerical Outputs
    outputs.append({
        "id": "total_cases",
        "name": "Total Cases",
        "type": "numeric_value",
        "description": "Total number of cases analyzed",
        "data": {
            "value": len(data),
            "unit": "cases",
            "format": "number",
            "precision": 0
        }
    })
    
    # Percentage Output
    positive_cases = len(data[data['status'] == 'positive'])
    positive_percentage = (positive_cases / len(data)) * 100 if len(data) > 0 else 0
    
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
    
    # 📊 Chart Outputs
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
            "colors": ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"],
            "xAxisLabel": "Category",
            "yAxisLabel": "Count"
        }
    })
    
    # 🗺️ Geospatial Outputs
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
    
    return outputs
```

---

## Implementation Notes

1. **Script Execution**: 
   - Scripts should return outputs in the defined format
   - Backend should parse and store these outputs
   - Support for Python, R, JavaScript, and TypeScript scripts

2. **Output Storage**:
   - Store outputs in the indicator document
   - Include visibility settings for dashboard vs analytics
   - Maintain execution history

3. **Real-time Updates**:
   - Consider WebSocket support for real-time dashboard updates
   - Cache outputs for performance

4. **Error Handling**:
   - Handle script execution errors gracefully
   - Provide fallback data when scripts fail
   - Log execution errors for debugging

5. **Security**:
   - Validate script outputs before storing
   - Sanitize data to prevent XSS
   - Limit script execution time and resources

6. **Geospatial Support**:
   - Integrate with mapping libraries (Leaflet, Mapbox, Google Maps)
   - Support for different map projections and coordinate systems
   - Handle large datasets with clustering and aggregation

7. **Chart Libraries**:
   - Support for multiple chart libraries (Chart.js, D3.js, Recharts)
   - Responsive design for different screen sizes
   - Interactive features (tooltips, zoom, pan)

---

## Database Schema Updates

### **Indicator Collection:**
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  nodeId: ObjectId,
  selectedVariables: Array,
  scriptFile: String,
  scriptType: String,
  outputs: [{
    id: String,
    name: String,
    type: String,
    description: String,
    data: Object,
    isVisibleOnDashboard: Boolean,
    isVisibleOnAnalytics: Boolean,
    order: Number,
    lastUpdated: Date
  }],
  executionHistory: [{
    executionId: String,
    status: String,
    executedAt: Date,
    executionTime: Number,
    outputs: Array
  }],
  lastExecuted: Date,
  lastStatus: String,
  enabled: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

This API structure ensures a flexible and scalable system for managing indicator outputs with user-controlled dashboard visibility and comprehensive support for all output types including numerical, chart-based, and geospatial visualizations. 