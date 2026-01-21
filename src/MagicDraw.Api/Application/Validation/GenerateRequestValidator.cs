using FluentValidation;
using MagicDraw.Api.Application.Dtos;

namespace MagicDraw.Api.Application.Validation;

public class GenerateRequestValidator : AbstractValidator<GenerateRequest>
{
    public GenerateRequestValidator()
    {
        RuleFor(x => x.Prompt)
            .NotEmpty()
            .MaximumLength(1000);
    }
}
