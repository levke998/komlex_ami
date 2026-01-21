using System;
using System.Net;
using System.Net.Http.Json;
using System.Threading;
using MagicDraw.Api.Application.Dtos;
using MagicDraw.Api.Application.Services;
using MagicDraw.Api.Domain.Exceptions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using NSubstitute;
using Xunit;

namespace MagicDraw.Tests;

public class ExceptionIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public ExceptionIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Testing");
        });
    }

    [Fact]
    public async Task GetUser_ShouldReturnNotFound_WhenNotFoundExceptionThrown()
    {
        // Arrange
        var mockUserService = Substitute.For<IUserService>();
        mockUserService.GetByIdAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>())
            .Returns(Task.FromException<UserResponse>(new NotFoundException("User", "123")));

        var client = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureTestServices(services =>
            {
                services.AddScoped(_ => mockUserService);
            });
        }).CreateClient();

        // Act
        var response = await client.GetAsync($"/api/users/{Guid.NewGuid()}");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<Microsoft.AspNetCore.Mvc.ProblemDetails>();
        Assert.Equal("Not Found", problem.Title);
    }

    [Fact]
    public async Task CreateUser_ShouldReturnConflict_WhenConflictExceptionThrown()
    {
        // Arrange
        var mockUserService = Substitute.For<IUserService>();
        mockUserService.CreateAsync(Arg.Any<CreateUserRequest>(), Arg.Any<CancellationToken>())
            .Returns(Task.FromException<UserResponse>(new ConflictException("User already exists")));

        var client = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureTestServices(services =>
            {
                services.AddScoped(_ => mockUserService);
            });
        }).CreateClient();

        // Act
        var request = new CreateUserRequest("existing", "test@example.com", "password");
        var response = await client.PostAsJsonAsync("/api/users", request);

        // Assert
        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<Microsoft.AspNetCore.Mvc.ProblemDetails>();
        Assert.Equal("Conflict", problem.Title);
    }
}
