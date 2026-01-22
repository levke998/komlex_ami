using System.Net;
using System.Net.Http.Json;
using MagicDraw.Api.Application.Dtos;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace MagicDraw.Tests;

public class ApiIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public ApiIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Testing");
        });
    }

    [Fact]
    public async Task GenerateImage_ShouldReturnBadRequest_WhenPromptIsEmpty()
    {
        // Arrange
        var client = _factory.CreateClient();
        var request = new GenerateRequest("");

        // Act
        var response = await client.PostAsJsonAsync("/api/ai/generate", request, TestContext.Current.CancellationToken);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
