var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.MapGet("/health", () => Results.Ok(new { status = "UP" }));

app.MapPost("/calculate", (PayrollRequest req) =>
{
    if (req.BasicSalary <= 0)
        return Results.BadRequest(new { error = "Basic salary must be positive" });
    if (req.WorkingDays <= 0)
        return Results.BadRequest(new { error = "Working days must be positive" });
    if (req.AbsentDays < 0 || req.AbsentDays > req.WorkingDays)
        return Results.BadRequest(new { error = "Absent days must be between 0 and working days" });

    decimal basic = req.BasicSalary;
    decimal hra = basic * 0.40m;
    decimal da = basic * 0.10m;
    decimal gross = basic + hra + da;

    decimal pf = basic * 0.12m;
    decimal professionalTax = gross > 15000 ? 200m : 0m;
    decimal incomeTax = gross <= 25000 ? 0m : gross <= 50000 ? gross * 0.05m : gross * 0.10m;
    decimal lossOfPay = gross / req.WorkingDays * req.AbsentDays;

    decimal totalDeductions = pf + professionalTax + incomeTax + lossOfPay;
    decimal net = gross - totalDeductions;

    return Results.Ok(new PayrollResponse(
        req.EmployeeId, req.Name, basic, hra, da, gross, pf,
        professionalTax, incomeTax,
        Math.Round(lossOfPay, 2), Math.Round(totalDeductions, 2), Math.Round(net, 2)));
});

app.Run("http://localhost:5000");

record PayrollRequest(int EmployeeId, string Name, decimal BasicSalary, int WorkingDays, decimal AbsentDays);
record PayrollResponse(int EmployeeId, string Name, decimal Basic, decimal Hra, decimal Da,
    decimal Gross, decimal Pf, decimal ProfessionalTax, decimal IncomeTax,
    decimal LossOfPay, decimal TotalDeductions, decimal NetSalary);