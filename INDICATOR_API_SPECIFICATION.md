# Indicator API Specification for Backend Developers

This document describes the required API endpoints for the Indicator creation functionality, specifically for retrieving node field keys and creating indicators with variable selection.

---

## 1. Get Node Field Keys Endpoint

### **Purpose:**
- To provide the frontend with all available field keys (variables) from a specific data node, enabling users to select which variables to include in their indicator calculations.

### **Endpoint:**
- `GET /api/data-warehouse/nodes/:nodeId/field-keys`

### **Parameters:**
- `nodeId` (path parameter): The ID of the data node

### **Response Example:**
```json
{
  "success": true,
  "data": {
    "nodeId": "node123",
    "nodeName": "AMR Node A",
    "fieldKeys": [
      {
        "key": "email_field",
        "label": "Email Address",
        "type": "email",
        "formName": "Patient Information Form"
      },
      {
        "key": "date_field", 
        "label": "Date of Birth",
        "type": "date",
        "formName": "Patient Information Form"
      },
      {
        "key": "isolate_id",
        "label": "Isolate ID",
        "type": "text",
        "formName": "Laboratory Results Form"
      },
      {
        "key": "sex",
        "label": "Gender",
        "type": "select",
        "formName": "Patient Information Form"
      }
    ]
  }
}
```

### **Response Fields:**
- `nodeId`: The ID of the data node
- `nodeName`: The name of the data node
- `fieldKeys`: Array of available field keys with metadata
  - `key`: Internal field identifier (used for API calls)
  - `label`: User-friendly display name
  - `type`: Field data type (optional but recommended)
  - `formName`: Name of the form this field belongs to

### **Error Response:**
```json
{
  "success": false,
  "error": "Node not found",
  "message": "The specified node does not exist"
}
```

---

## 2. Create Indicator with Variables Endpoint

### **Purpose:**
- To create a new indicator with selected variables from a data node.

### **Endpoint:**
- `POST /api/indicators`

### **Request Body:**
```json
{
  "name": "Antibiotic Resistance Rate",
  "description": "Calculate resistance rate for specific antibiotics",
  "nodeId": "node123",
  "selectedVariables": [
    "isolate_id",
    "antibiotic_name", 
    "resistance_result"
  ],
  "scriptFile": "file_upload",
  "enabled": true
}
```

### **Request Fields:**
- `name` (required): Indicator name
- `description` (required): Indicator description
- `nodeId` (required): ID of the data node to use
- `selectedVariables` (required): Array of field keys selected by the user
- `scriptFile` (optional): File upload for the indicator calculation script
- `enabled` (optional): Whether the indicator is enabled (default: true)

### **Response Example:**
```json
{
  "success": true,
  "data": {
    "id": "indicator456",
    "name": "Antibiotic Resistance Rate",
    "description": "Calculate resistance rate for specific antibiotics",
    "nodeId": "node123",
    "nodeName": "AMR Node A",
    "selectedVariables": [
      {
        "key": "isolate_id",
        "label": "Isolate ID"
      },
      {
        "key": "antibiotic_name",
        "label": "Antibiotic Name"
      },
      {
        "key": "resistance_result",
        "label": "Resistance Result"
      }
    ],
    "scriptFile": "uploads/scripts/indicator456.py",
    "enabled": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

## 3. Update Indicator with Variables Endpoint

### **Purpose:**
- To update an existing indicator with new variable selections.

### **Endpoint:**
- `PUT /api/indicators/:indicatorId`

### **Request Body:**
```json
{
  "name": "Updated Antibiotic Resistance Rate",
  "description": "Updated description",
  "nodeId": "node123",
  "selectedVariables": [
    "isolate_id",
    "antibiotic_name",
    "resistance_result",
    "patient_age"
  ],
  "enabled": true
}
```

### **Response:**
Same structure as create endpoint, with updated data.

---

## 4. Get Indicator with Variables Endpoint

### **Purpose:**
- To retrieve an indicator with its selected variables for editing.

### **Endpoint:**
- `GET /api/indicators/:indicatorId`

### **Response Example:**
```json
{
  "success": true,
  "data": {
    "id": "indicator456",
    "name": "Antibiotic Resistance Rate",
    "description": "Calculate resistance rate for specific antibiotics",
    "nodeId": "node123",
    "nodeName": "AMR Node A",
    "selectedVariables": [
      {
        "key": "isolate_id",
        "label": "Isolate ID"
      },
      {
        "key": "antibiotic_name",
        "label": "Antibiotic Name"
      },
      {
        "key": "resistance_result",
        "label": "Resistance Result"
      }
    ],
    "scriptFile": "uploads/scripts/indicator456.py",
    "enabled": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

## Implementation Notes

1. **Authentication**: All endpoints should require proper authentication (Bearer token)

2. **File Upload**: For script file uploads, use multipart/form-data encoding

3. **Validation**: 
   - Ensure nodeId exists and is accessible to the user
   - Validate that selectedVariables are valid field keys for the specified node
   - Check file type and size for script uploads

4. **Error Handling**: Return appropriate HTTP status codes and error messages

5. **Data Consistency**: Ensure that when a node is updated, all related indicators are properly handled

6. **Performance**: Consider caching field keys for frequently accessed nodes

---

## Frontend Integration

The frontend will:
1. Call `/api/data-warehouse/nodes/:nodeId/field-keys` when a node is selected
2. Display the field keys as multicheckbox options
3. Send selected variables in the indicator creation/update requests
4. Handle file uploads for script files

This API structure ensures a smooth user experience for creating indicators with variable selection functionality. 