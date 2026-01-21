using FluentValidation.TestHelper;
using MagicDraw.Api.Application.Dtos;
using MagicDraw.Api.Application.Validation;
using Xunit;

namespace MagicDraw.Tests;

public class ValidatorTests
{
    private readonly GenerateRequestValidator _generateValidator = new();
    private readonly CreateUserRequestValidator _userValidator = new();
    private readonly CreateDrawingRequestValidator _drawingValidator = new();

    [Fact]
    public void GenerateRequest_ShouldHaveError_WhenPromptIsEmpty()
    {
        var model = new GenerateRequest("");
        var result = _generateValidator.TestValidate(model);
        result.ShouldHaveValidationErrorFor(x => x.Prompt);
    }

    [Fact]
    public void GenerateRequest_ShouldNotHaveError_WhenPromptIsValid()
    {
        var model = new GenerateRequest("A beautiful sunset");
        var result = _generateValidator.TestValidate(model);
        result.ShouldNotHaveValidationErrorFor(x => x.Prompt);
    }

    [Fact]
    public void CreateUserRequest_ShouldHaveError_WhenEmailIsInvalid()
    {
        var model = new CreateUserRequest("user", "invalid-email", "password123");
        var result = _userValidator.TestValidate(model);
        result.ShouldHaveValidationErrorFor(x => x.Email);
    }

    [Fact]
    public void CreateUserRequest_ShouldHaveError_WhenPasswordIsTooShort()
    {
        var model = new CreateUserRequest("user", "test@example.com", "123");
        var result = _userValidator.TestValidate(model);
        result.ShouldHaveValidationErrorFor(x => x.Password);
    }

    [Fact]
    public void CreateDrawingRequest_ShouldHaveError_WhenDimensionsAreInvalid()
    {
        var model = new CreateDrawingRequest(System.Guid.NewGuid(), "Title", 0, 5000, true);
        var result = _drawingValidator.TestValidate(model);
        result.ShouldHaveValidationErrorFor(x => x.Width);
        result.ShouldHaveValidationErrorFor(x => x.Height);
    }

    [Fact]
    public void CreateDrawingRequest_ShouldNotHaveError_WhenDataIsValid()
    {
        var model = new CreateDrawingRequest(System.Guid.NewGuid(), "Title", 800, 600, true);
        var result = _drawingValidator.TestValidate(model);
        result.ShouldNotHaveAnyValidationErrors();
    }
}
