using MagicDraw.Api.Application.Dtos;
using Xunit;

namespace MagicDraw.Tests.Dtos;

public class GenerateRequestTests
{
    [Fact]
    public void GenerateRequest_Should_Store_Prompt()
    {
        // Arrange
        var prompt = "A beautiful sunset";

        // Act
        var request = new GenerateRequest(prompt);

        // Assert
        Assert.Equal(prompt, request.Prompt);
    }
}
