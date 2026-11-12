var builder = WebApplication.CreateBuilder(args);
builder.Services.AddHttpClient("java", c =>
{
    c.BaseAddress = new Uri(builder.Configuration["JavaService:BaseUrl"]!);
    c.Timeout = TimeSpan.FromSeconds(10);
});
builder.Services.AddSingleton(new RuleStore(
    Path.Combine(builder.Environment.ContentRootPath, "payroll-rules.json")));
var app = builder.Build();

app.MapGet("/health", () => Results.Ok(new { status = "UP" }));

app.MapPost("/calculate", (PayrollRequest req, RuleStore store) =>
{
    if (req.BasicSalary <= 0)
        return Results.BadRequest(new { error = "Basic salary must be positive" });
    if (req.WorkingDays <= 0)
        return Results.BadRequest(new { error = "Working days must be positive" });
    if (req.AbsentDays < 0 || req.AbsentDays > req.WorkingDays)
        return Results.BadRequest(new { error = "Absent days must be between 0 and working days" });

    var rules = store.Get();

    decimal basic = req.BasicSalary;
    decimal hra = basic * rules.HraPercent / 100m;
    decimal da = basic * rules.DaPercent / 100m;
    decimal gross = basic + hra + da;

    decimal pf = basic * rules.PfPercent / 100m;
    decimal professionalTax = gross > rules.ProfessionalTaxThreshold ? rules.ProfessionalTaxAmount : 0m;
    decimal incomeTax = gross * rules.RateFor(gross) / 100m;
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

app.MapGet("/rules", (RuleStore store) => Results.Ok(store.Get()));

app.MapPut("/rules", (PayrollRules body, HttpRequest http, RuleStore store, IConfiguration config) =>
{
    var expected = config["PayrollService:ApiKey"];
    var provided = http.Headers["X-Service-Key"].ToString();
    if (string.IsNullOrEmpty(expected) || !KeyCheck.Matches(provided, expected))
        return Results.Json(new { error = "Invalid or missing service key" }, statusCode: 401);

    var errors = PayrollRules.Validate(body);
    if (errors.Count > 0)
        return Results.BadRequest(new { error = string.Join("; ", errors) });

    var by = http.Headers["X-Updated-By"].ToString();
    if (string.IsNullOrWhiteSpace(by)) by = "unknown";
    if (by.Length > 100) by = by[..100];

    return Results.Ok(store.Update(body, by));
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