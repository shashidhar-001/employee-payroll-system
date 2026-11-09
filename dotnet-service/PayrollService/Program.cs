var builder = WebApplication.CreateBuilder(args);
builder.Services.AddHttpClient("java", c =>
{
    c.BaseAddress = new Uri(builder.Configuration["JavaService:BaseUrl"]!);
    c.Timeout = TimeSpan.FromSeconds(10);
});
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

app.MapGet("/payroll/summary", async (int month, int year, IHttpClientFactory factory, IConfiguration config) =>
{
    if (month < 1 || month > 12)
        return Results.BadRequest(new { error = "Month must be between 1 and 12" });
    if (year < 2000 || year > 2100)
        return Results.BadRequest(new { error = "Year is not valid" });

    var client = factory.CreateClient("java");
    using var request = new HttpRequestMessage(HttpMethod.Get, $"/internal/payslips?month={month}&year={year}");
    request.Headers.Add("X-Service-Key", config["JavaService:ApiKey"]);

    HttpResponseMessage response;
    try
    {
        response = await client.SendAsync(request);
    }
    catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
    {
        return Results.Json(new { error = "Employee service (Java) is not reachable" }, statusCode: 503);
    }

    if (!response.IsSuccessStatusCode)
        return Results.Json(new { error = $"Employee service returned HTTP {(int)response.StatusCode}" }, statusCode: 502);

    var items = await response.Content.ReadFromJsonAsync<List<PayslipItem>>() ?? new List<PayslipItem>();

    var departments = items
        .GroupBy(i => i.Department ?? "Unassigned")
        .Select(g => new DepartmentSummary(g.Key, g.Count(),
            Math.Round(g.Sum(i => i.Gross), 2),
            Math.Round(g.Sum(i => i.TotalDeductions), 2),
            Math.Round(g.Sum(i => i.NetSalary), 2)))
        .OrderBy(d => d.Department)
        .ToList();

    return Results.Ok(new PayrollSummary(month, year, items.Count,
        Math.Round(items.Sum(i => i.Gross), 2),
        Math.Round(items.Sum(i => i.TotalDeductions), 2),
        Math.Round(items.Sum(i => i.NetSalary), 2),
        departments));
});

app.Run("http://localhost:5000");

record PayrollRequest(int EmployeeId, string Name, decimal BasicSalary, int WorkingDays, decimal AbsentDays);
record PayrollResponse(int EmployeeId, string Name, decimal Basic, decimal Hra, decimal Da,
    decimal Gross, decimal Pf, decimal ProfessionalTax, decimal IncomeTax,
    decimal LossOfPay, decimal TotalDeductions, decimal NetSalary);
record PayslipItem(int EmployeeId, string EmployeeName, string? Department,
    decimal Gross, decimal TotalDeductions, decimal NetSalary);
record DepartmentSummary(string Department, int Employees,
    decimal TotalGross, decimal TotalDeductions, decimal TotalNet);
record PayrollSummary(int Month, int Year, int Employees,
    decimal TotalGross, decimal TotalDeductions, decimal TotalNet,
    List<DepartmentSummary> Departments);