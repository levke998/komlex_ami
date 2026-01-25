using System.Net;
using System.Net.Http.Json;
using MagicDraw.Api.Application.Dtos;
using Xunit;

namespace MagicDraw.Tests;

public class ApiIntegrationTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;

    public ApiIntegrationTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
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
