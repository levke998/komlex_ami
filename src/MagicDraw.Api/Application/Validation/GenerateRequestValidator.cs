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

public class RewritePromptRequestValidator : AbstractValidator<RewritePromptRequest>
{
    public RewritePromptRequestValidator()
    {
        RuleFor(x => x.Prompt)
            .NotEmpty()
            .MaximumLength(1000);

        RuleFor(x => x.Style)
            .MaximumLength(50)
            .When(x => !string.IsNullOrWhiteSpace(x.Style));
    }
}
