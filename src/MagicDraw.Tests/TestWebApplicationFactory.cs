using System.Collections.Generic;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace MagicDraw.Tests;

/// <summary>
/// Provides a consistent in-memory test host with seeded configuration (JWT/OpenAI)
/// and an in-memory EF Core database to avoid external dependencies during tests.
/// </summary>
public class TestWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // Provide dummy connection string early so Aspire validation passes before we swap DbContext
        Environment.SetEnvironmentVariable("ConnectionStrings__sqldata", "Server=(localdb)\\mssqllocaldb;Database=MagicDrawTests;Trusted_Connection=True;MultipleActiveResultSets=true");

        builder.UseEnvironment("Testing");

        builder.ConfigureAppConfiguration((_, config) =>
        {
            var settings = new Dictionary<string, string?>
            {
                ["JwtSettings:Issuer"] = "TestIssuer",
                ["JwtSettings:Audience"] = "TestAudience",
                // 32+ chars to satisfy HMAC256 key length expectations
                ["JwtSettings:Secret"] = "supersecretkeysupersecretkey123456",
                ["OpenAI:ApiKey"] = "test-key"
            };
            config.AddInMemoryCollection(settings);
        });

        builder.ConfigureServices(services =>
        {
            // nothing to override currently
        });
    }
}
