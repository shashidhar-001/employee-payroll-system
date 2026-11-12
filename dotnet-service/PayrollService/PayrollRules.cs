using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

public class TaxSlab
{
    // null means "no upper limit" (only allowed on the last slab)
    public decimal? UpTo { get; set; }
    public decimal RatePercent { get; set; }
}

public class PayrollRules
{
    public decimal HraPercent { get; set; } = 40;
    public decimal DaPercent { get; set; } = 10;
    public decimal PfPercent { get; set; } = 12;
    public decimal ProfessionalTaxThreshold { get; set; } = 15000;
    public decimal ProfessionalTaxAmount { get; set; } = 200;
    public List<TaxSlab> TaxSlabs { get; set; } = new()
    {
        new TaxSlab { UpTo = 25000, RatePercent = 0 },
        new TaxSlab { UpTo = 50000, RatePercent = 5 },
        new TaxSlab { UpTo = null, RatePercent = 10 },
    };

    public int Version { get; set; } = 1;
    public DateTime? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }

    // The whole gross falls into one slab and that slab's rate applies to it
    public decimal RateFor(decimal gross)
    {
        foreach (var s in TaxSlabs)
            if (s.UpTo == null || gross <= s.UpTo) return s.RatePercent;
        return TaxSlabs[^1].RatePercent;
    }

    public static List<string> Validate(PayrollRules r)
    {
        var e = new List<string>();
        void Pct(string name, decimal v)
        {
            if (v < 0 || v > 100) e.Add($"{name} must be between 0 and 100");
        }

        Pct("HRA percent", r.HraPercent);
        Pct("DA percent", r.DaPercent);
        Pct("PF percent", r.PfPercent);
        if (r.ProfessionalTaxThreshold < 0) e.Add("Professional tax threshold cannot be negative");
        if (r.ProfessionalTaxAmount < 0) e.Add("Professional tax amount cannot be negative");

        if (r.TaxSlabs == null || r.TaxSlabs.Count == 0)
        {
            e.Add("At least one tax slab is required");
            return e;
        }
        if (r.TaxSlabs.Count > 10) e.Add("At most 10 tax slabs are allowed");

        decimal prev = 0;
        for (int i = 0; i < r.TaxSlabs.Count; i++)
        {
            var s = r.TaxSlabs[i];
            bool last = i == r.TaxSlabs.Count - 1;
            Pct($"Slab {i + 1} rate", s.RatePercent);
            if (last)
            {
                if (s.UpTo != null) e.Add("The last slab must have no upper limit");
            }
            else if (s.UpTo == null || s.UpTo <= prev)
            {
                e.Add($"Slab {i + 1} limit must be greater than the previous limit");
            }
            else
            {
                prev = s.UpTo.Value;
            }
        }
        return e;
    }
}

// Holds the current rules in memory and saves them to a JSON file
public class RuleStore
{
    private static readonly JsonSerializerOptions Options =
        new(JsonSerializerDefaults.Web) { WriteIndented = true };

    private readonly object _lock = new();
    private readonly string _path;
    private PayrollRules _current;

    public RuleStore(string path)
    {
        _path = path;
        _current = Load();
    }

    private PayrollRules Load()
    {
        try
        {
            if (File.Exists(_path))
            {
                var r = JsonSerializer.Deserialize<PayrollRules>(File.ReadAllText(_path), Options);
                if (r != null && PayrollRules.Validate(r).Count == 0) return r;
            }
        }
        catch { /* unreadable file: fall back to defaults */ }
        return new PayrollRules();
    }

    private static PayrollRules Clone(PayrollRules r) =>
        JsonSerializer.Deserialize<PayrollRules>(JsonSerializer.Serialize(r, Options), Options)!;

    public PayrollRules Get()
    {
        lock (_lock) return Clone(_current);
    }

    public PayrollRules Update(PayrollRules incoming, string updatedBy)
    {
        lock (_lock)
        {
            var next = Clone(incoming);
            next.Version = _current.Version + 1;
            next.UpdatedAt = DateTime.UtcNow;
            next.UpdatedBy = updatedBy;

            var tmp = _path + ".tmp";
            File.WriteAllText(tmp, JsonSerializer.Serialize(next, Options));
            File.Move(tmp, _path, overwrite: true);

            _current = next;
            return Clone(next);
        }
    }
}

public static class KeyCheck
{
    public static bool Matches(string provided, string expected) =>
        CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(provided), Encoding.UTF8.GetBytes(expected));
}