// STEP 0 CONTRACT CANDIDATE — locally compile-checkable, NOT deployed.
// A real G4 pass still requires Tide-team deployment, a real EXPLICIT approval flow,
// a returned Tide signature, and independent verification against the realm VVK.
//
// Intended request model: DynamicApprovedCustom<LeashPayment>:DynamicApprovedCustom<1>.
// The exact relationship between ctx.DynamicData and the bytes signed by the live ORKs
// remains a runtime assertion. Do not treat this source as proof of that relationship.

using Ork.Forseti.Sdk;
using Cryptide.Tools;
using Ork.Shared.Models.Contracts;
using System;
using System.Collections.Generic;
using System.Text;

public class Contract : IAccessPolicy
{
    private const string ExpectedRequestId = "DynamicApprovedCustom<LeashPayment>:DynamicApprovedCustom<1>";
    private const string ExpectedCurrency = "USD";
    private const string ExpectedDomain = "leash.payment.v1";
    private const string ExpectedVersion = "leash.pay.v1";

    [PolicyParam(Required = true, Description = "Client resource that owns payment roles")]
    public string Resource { get; set; }

    [PolicyParam(Required = true, Description = "Client role held by human payment approvers")]
    public string ApproverRole { get; set; }

    [PolicyParam(Required = true, Description = "Client role allowed to request payment signing")]
    public string ExecutorRole { get; set; }

    [PolicyParam(Default = 100000, Min = 1, Description = "Minor-unit boundary requiring two approvers")]
    public int HighValueThresholdMinor { get; set; }

    [PolicyParam(Default = 900, Min = 30, Description = "Maximum future expiry window in seconds")]
    public int MaxExpirySeconds { get; set; }

    [PolicyParam(Required = true)] public string PayeeIdA { get; set; }
    [PolicyParam(Required = true)] public string PayeeAccountA { get; set; }
    [PolicyParam(Required = true)] public string PayeeIdB { get; set; }
    [PolicyParam(Required = true)] public string PayeeAccountB { get; set; }

    private int _requiredApprovals;
    private bool _dataValidated;
    private List<string> _approverVuids = new List<string>();

    public PolicyDecision ValidateData(DataContext ctx)
    {
        _dataValidated = false;
        _requiredApprovals = 0;
        _approverVuids = new List<string>();

        if (ctx == null) return PolicyDecision.Deny("missing data context");
        if (ctx.RequestId != ExpectedRequestId) return PolicyDecision.Deny("wrong request model");
        if (ctx.Policy == null || ctx.Policy.ApprovalType != ApprovalType.EXPLICIT ||
            ctx.Policy.ExecutionType != ExecutionType.PRIVATE)
            return PolicyDecision.Deny("policy must be EXPLICIT and PRIVATE");

        ReadOnlyMemory<byte> memory = ctx.DynamicData;
        ReadOnlySpan<byte> data = memory.Span;
        if (data.Length == 0 || data.Length > 2048)
            return PolicyDecision.Deny("canonical payment bytes missing or too large");

        int offset = 0;
        long amountMinor;
        string currency;
        string domain;
        string expiresAt;
        string invoiceId;
        string nonce;
        string payeeAccount;
        string payeeId;
        string version;

        // Accept only the exact fixed-order JSON emitted by src/canonical.mjs. Escapes,
        // whitespace, duplicate keys and extra fields are rejected rather than normalized.
        if (!Expect(data, ref offset, "{\"amountMinor\":")) return PolicyDecision.Deny("bad amount field");
        if (!ReadPositiveInteger(data, ref offset, out amountMinor)) return PolicyDecision.Deny("bad amount");
        if (!Expect(data, ref offset, ",\"currency\":")) return PolicyDecision.Deny("bad currency field");
        if (!ReadAsciiString(data, ref offset, out currency)) return PolicyDecision.Deny("bad currency");
        if (!Expect(data, ref offset, ",\"domain\":")) return PolicyDecision.Deny("bad domain field");
        if (!ReadAsciiString(data, ref offset, out domain)) return PolicyDecision.Deny("bad domain");
        if (!Expect(data, ref offset, ",\"expiresAt\":")) return PolicyDecision.Deny("bad expiry field");
        if (!ReadAsciiString(data, ref offset, out expiresAt)) return PolicyDecision.Deny("bad expiry");
        if (!Expect(data, ref offset, ",\"invoiceId\":")) return PolicyDecision.Deny("bad invoice field");
        if (!ReadAsciiString(data, ref offset, out invoiceId)) return PolicyDecision.Deny("bad invoice id");
        if (!Expect(data, ref offset, ",\"nonce\":")) return PolicyDecision.Deny("bad nonce field");
        if (!ReadAsciiString(data, ref offset, out nonce)) return PolicyDecision.Deny("bad nonce");
        if (!Expect(data, ref offset, ",\"payeeAccount\":")) return PolicyDecision.Deny("bad account field");
        if (!ReadAsciiString(data, ref offset, out payeeAccount)) return PolicyDecision.Deny("bad account");
        if (!Expect(data, ref offset, ",\"payeeId\":")) return PolicyDecision.Deny("bad payee field");
        if (!ReadAsciiString(data, ref offset, out payeeId)) return PolicyDecision.Deny("bad payee");
        if (!Expect(data, ref offset, ",\"version\":")) return PolicyDecision.Deny("bad version field");
        if (!ReadAsciiString(data, ref offset, out version)) return PolicyDecision.Deny("bad version");
        if (!Expect(data, ref offset, "}") || offset != data.Length)
            return PolicyDecision.Deny("trailing or extra payment data");

        if (currency != ExpectedCurrency || domain != ExpectedDomain || version != ExpectedVersion)
            return PolicyDecision.Deny("unsupported currency, domain or version");
        if (!IsSafeToken(invoiceId) || !IsSafeToken(nonce) || !IsSafeToken(payeeId) || !IsSafeToken(payeeAccount))
            return PolicyDecision.Deny("unsafe identifier");

        bool payeeAllowed =
            (payeeId == PayeeIdA && payeeAccount == PayeeAccountA) ||
            (payeeId == PayeeIdB && payeeAccount == PayeeAccountB);
        if (!payeeAllowed) return PolicyDecision.Deny("untrusted payee");

        long expiryEpoch;
        if (!TryParseUtcEpochSeconds(expiresAt, out expiryEpoch))
            return PolicyDecision.Deny("invalid expiry");
        long now = Utils.GetEpochSeconds();
        if (expiryEpoch <= now) return PolicyDecision.Deny("expired");
        if (expiryEpoch - now > MaxExpirySeconds) return PolicyDecision.Deny("expiry window too long");

        _requiredApprovals = amountMinor >= HighValueThresholdMinor ? 2 : 1;
        _dataValidated = true;
        return PolicyDecision.Allow();
    }

    public PolicyDecision ValidateApprovers(ApproversContext ctx)
    {
        if (!_dataValidated || _requiredApprovals < 1)
            return PolicyDecision.Deny("payment validation did not run");
        if (ctx == null || ctx.Dokens == null)
            return PolicyDecision.Deny("approver dokens missing");

        var approvers = DokenDto.WrapAll(ctx.Dokens);
        var unique = new List<string>();
        for (int i = 0; i < approvers.Count; i++)
        {
            var approver = approvers[i];
            if (approver == null || approver.IsNull || approver.IsExpired)
                return PolicyDecision.Deny("invalid or expired approver");
            if (!approver.HasRole(Resource, ApproverRole))
                return PolicyDecision.Deny("approver role missing");
            string vuid = approver.UserId;
            if (string.IsNullOrEmpty(vuid)) return PolicyDecision.Deny("approver vuid missing");
            for (int j = 0; j < unique.Count; j++)
                if (unique[j] == vuid) return PolicyDecision.Deny("duplicate approver");
            unique.Add(vuid);
        }
        if (unique.Count < _requiredApprovals)
            return PolicyDecision.Deny("insufficient independent approvers");
        _approverVuids = unique;
        return PolicyDecision.Allow();
    }

    public PolicyDecision ValidateExecutor(ExecutorContext ctx)
    {
        if (!_dataValidated || _approverVuids == null || _approverVuids.Count < _requiredApprovals)
            return PolicyDecision.Deny("data or approver validation did not run");
        if (ctx == null) return PolicyDecision.Deny("executor context missing");
        var executor = new DokenDto(ctx.Doken);
        if (executor.IsNull || executor.IsExpired) return PolicyDecision.Deny("invalid or expired executor");
        if (!executor.HasRole(Resource, ExecutorRole)) return PolicyDecision.Deny("executor role missing");
        for (int i = 0; i < _approverVuids.Count; i++)
            if (_approverVuids[i] == executor.UserId) return PolicyDecision.Deny("self approval forbidden");
        return PolicyDecision.Allow();
    }

    private static bool Expect(ReadOnlySpan<byte> data, ref int offset, string expected)
    {
        if (offset + expected.Length > data.Length) return false;
        for (int i = 0; i < expected.Length; i++)
            if (data[offset + i] != (byte)expected[i]) return false;
        offset += expected.Length;
        return true;
    }

    private static bool ReadPositiveInteger(ReadOnlySpan<byte> data, ref int offset, out long value)
    {
        value = 0;
        int start = offset;
        while (offset < data.Length && data[offset] >= (byte)'0' && data[offset] <= (byte)'9')
        {
            int digit = data[offset] - (byte)'0';
            if (value > 900719925474099L) return false;
            value = value * 10 + digit;
            offset++;
        }
        return offset > start && value > 0 && value <= 9007199254740991L;
    }

    private static bool ReadAsciiString(ReadOnlySpan<byte> data, ref int offset, out string value)
    {
        value = null;
        if (offset >= data.Length || data[offset] != (byte)'\"') return false;
        offset++;
        int start = offset;
        while (offset < data.Length && data[offset] != (byte)'\"')
        {
            byte b = data[offset];
            if (b < 0x20 || b > 0x7e || b == (byte)'\\') return false;
            offset++;
        }
        int length = offset - start;
        if (offset >= data.Length || length < 1 || length > 128) return false;
        value = Encoding.ASCII.GetString(data.Slice(start, length));
        offset++;
        return true;
    }

    private static bool IsSafeToken(string value)
    {
        if (string.IsNullOrEmpty(value) || value.Length > 128) return false;
        for (int i = 0; i < value.Length; i++)
        {
            char c = value[i];
            bool ok = (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z') ||
                      (c >= '0' && c <= '9') || c == '.' || c == '_' || c == '-';
            if (!ok) return false;
        }
        return true;
    }

    private static bool TryParseUtcEpochSeconds(string value, out long epoch)
    {
        epoch = 0;
        if (value == null || value.Length != 24 || value[4] != '-' || value[7] != '-' ||
            value[10] != 'T' || value[13] != ':' || value[16] != ':' || value[19] != '.' || value[23] != 'Z')
            return false;
        int year, month, day, hour, minute, second, millis;
        if (!Digits(value, 0, 4, out year) || !Digits(value, 5, 2, out month) ||
            !Digits(value, 8, 2, out day) || !Digits(value, 11, 2, out hour) ||
            !Digits(value, 14, 2, out minute) || !Digits(value, 17, 2, out second) ||
            !Digits(value, 20, 3, out millis)) return false;
        if (year < 1970 || year > 2100 || month < 1 || month > 12 ||
            hour > 23 || minute > 59 || second > 59 || millis > 999) return false;
        int maxDay = DaysInMonth(year, month);
        if (day < 1 || day > maxDay) return false;
        long days = 0;
        for (int y = 1970; y < year; y++) days += IsLeap(y) ? 366 : 365;
        for (int m = 1; m < month; m++) days += DaysInMonth(year, m);
        days += day - 1;
        epoch = days * 86400L + hour * 3600L + minute * 60L + second;
        return true;
    }

    private static bool Digits(string value, int start, int count, out int result)
    {
        result = 0;
        for (int i = 0; i < count; i++)
        {
            char c = value[start + i];
            if (c < '0' || c > '9') return false;
            result = result * 10 + (c - '0');
        }
        return true;
    }

    private static bool IsLeap(int year)
    {
        return year % 4 == 0 && (year % 100 != 0 || year % 400 == 0);
    }

    private static int DaysInMonth(int year, int month)
    {
        if (month == 2) return IsLeap(year) ? 29 : 28;
        if (month == 4 || month == 6 || month == 9 || month == 11) return 30;
        return 31;
    }
}
