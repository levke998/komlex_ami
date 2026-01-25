using System.Net;
using System.Net.Http.Json;
using MagicDraw.Api.Application.Dtos;
using Xunit;

namespace MagicDraw.Tests.Integration;

public class AuthIntegrationTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;
    private const string RegisterEndpoint = "/api/auth/register";
    private const string LoginEndpoint = "/api/auth/login";
    private readonly ITestOutputHelper _output;

    public AuthIntegrationTests(TestWebApplicationFactory factory, ITestOutputHelper output)
    {
        _client = factory.CreateClient();
        _output = output;
    }

    [Fact]
    public async Task Register_ShouldReturnOk_WhenRequestIsValid()
    {
        // Arrange
        var request = CreateRandomRegisterRequest();

        // Act
        var response = await _client.PostAsJsonAsync(RegisterEndpoint, request, TestContext.Current.CancellationToken);

        // Assert
        if (response.StatusCode != HttpStatusCode.OK)
        {
            var body = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
            _output.WriteLine($"Register response: {(int)response.StatusCode} {response.StatusCode} {body}");
        }
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        
        var authResponse = await response.Content.ReadFromJsonAsync<AuthResponse>(cancellationToken: TestContext.Current.CancellationToken);
        Assert.NotNull(authResponse);
        Assert.NotEmpty(authResponse.Token);
        Assert.Equal(request.Email, authResponse.User.Email);
    }

    [Fact]
    public async Task Login_ShouldReturnOk_WhenCredentialsAreValid()
    {
        // Arrange
        var registerRequest = CreateRandomRegisterRequest();
        await RegisterUserAsync(registerRequest, TestContext.Current.CancellationToken);

        var loginRequest = new LoginRequest(registerRequest.Email, registerRequest.Password);

        // Act
        var response = await _client.PostAsJsonAsync(LoginEndpoint, loginRequest, TestContext.Current.CancellationToken);

        // Assert
        if (response.StatusCode != HttpStatusCode.OK)
        {
            var body = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
            _output.WriteLine($"Login response: {(int)response.StatusCode} {response.StatusCode} {body}");
        }
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        
        var authResponse = await response.Content.ReadFromJsonAsync<AuthResponse>(cancellationToken: TestContext.Current.CancellationToken);
        Assert.NotNull(authResponse);
        Assert.NotEmpty(authResponse.Token);
        Assert.Equal(registerRequest.Email, authResponse.User.Email);
    }

    [Fact]
    public async Task Login_ShouldReturnUnauthorized_WhenPasswordIsInvalid()
    {
        // Arrange
        var registerRequest = CreateRandomRegisterRequest();
        await RegisterUserAsync(registerRequest, TestContext.Current.CancellationToken);

        var loginRequest = new LoginRequest(registerRequest.Email, "WrongPassword");

        // Act
        var response = await _client.PostAsJsonAsync(LoginEndpoint, loginRequest, TestContext.Current.CancellationToken);

        // Assert
        if (response.StatusCode != HttpStatusCode.Unauthorized)
        {
            var body = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
            _output.WriteLine($"Login invalid pwd response: {(int)response.StatusCode} {response.StatusCode} {body}");
        }
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // --- Helpers ---

    private RegisterRequest CreateRandomRegisterRequest()
    {
        var guid = Guid.NewGuid();
        return new RegisterRequest(
            Username: $"User_{guid.ToString()[..8]}",
            Email: $"user{guid}@test.com",
            Password: "Password123!"
        );
    }

    private async Task RegisterUserAsync(RegisterRequest request, CancellationToken cancellationToken)
    {
        var response = await _client.PostAsJsonAsync(RegisterEndpoint, request, cancellationToken);
        response.EnsureSuccessStatusCode();
    }
}
