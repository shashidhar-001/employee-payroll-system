POST http://localhost:5000/calculate

Request:
{ "employeeId": 1, "name": "Ravi", "basicSalary": 30000, "workingDays": 26, "absentDays": 2 }

Response:
{ "employeeId": 1, "name": "Ravi", "basic": 30000, "hra": 12000, "da": 3000,
  "gross": 45000, "pf": 3600, "professionalTax": 200, "incomeTax": 2250,
  "lossOfPay": 3461.54, "totalDeductions": 9511.54, "netSalary": 35488.46 }

Error (HTTP 400): { "error": "message here" }