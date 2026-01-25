using System;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using MagicDraw.Api.Application.Dtos;
using Xunit;

namespace MagicDraw.Tests.Integration;

public class DrawingAuthIntegrationTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;

    public DrawingAuthIntegrationTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task CreateDrawing_Unauthenticated_ShouldReturn401()
    {
        var client = _factory.CreateClient();
        var request = new CreateDrawingRequest("Test", 800, 600, true);

        var response = await client.PostAsJsonAsync("/api/drawings", request, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task CreateDrawing_Authenticated_ShouldReturn201()
    {
        var client = await CreateAuthenticatedClientAsync();
        var request = new CreateDrawingRequest("My Drawing", 800, 600, true);

        var response = await client.PostAsJsonAsync("/api/drawings", request, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var drawing = await response.Content.ReadFromJsonAsync<DrawingResponse>(cancellationToken: TestContext.Current.CancellationToken);
        Assert.NotNull(drawing);
        Assert.Equal("My Drawing", drawing!.Title);
    }

    [Fact]
    public async Task DeleteDrawing_ByNonOwner_ShouldReturnForbidden()
    {
        // Owner creates drawing
        var ownerClient = await CreateAuthenticatedClientAsync("owner");
        var createReq = new CreateDrawingRequest("Owner Drawing", 640, 480, true);
        var createResp = await ownerClient.PostAsJsonAsync("/api/drawings", createReq, TestContext.Current.CancellationToken);
        createResp.EnsureSuccessStatusCode();
        var drawing = await createResp.Content.ReadFromJsonAsync<DrawingResponse>(cancellationToken: TestContext.Current.CancellationToken);
        Assert.NotNull(drawing);

        // Other user tries to delete
        var otherClient = await CreateAuthenticatedClientAsync("other");
        var deleteResp = await otherClient.DeleteAsync($"/api/drawings/{drawing!.Id}", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Forbidden, deleteResp.StatusCode);
    }

    private async Task<HttpClient> CreateAuthenticatedClientAsync(string prefix = "user")
    {
        var client = _factory.CreateClient();
        var guid = Guid.NewGuid().ToString("N");
        var register = new RegisterRequest(
            Username: $"{prefix}_{guid[..8]}",
            Email: $"{prefix}{guid}@test.com",
            Password: "Password123!");

        var registerResp = await client.PostAsJsonAsync("/api/auth/register", register, TestContext.Current.CancellationToken);
        registerResp.EnsureSuccessStatusCode();
        var auth = await registerResp.Content.ReadFromJsonAsync<AuthResponse>(cancellationToken: TestContext.Current.CancellationToken);
        Assert.NotNull(auth);

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth!.Token);
        return client;
    }
}
