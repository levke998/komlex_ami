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

public class AutoCaptionRequestValidator : AbstractValidator<AutoCaptionRequest>
{
    public AutoCaptionRequestValidator()
    {
        RuleFor(x => x)
            .Must(x => !string.IsNullOrWhiteSpace(x.Prompt) || !string.IsNullOrWhiteSpace(x.Notes))
            .WithMessage("Provide a prompt or notes for caption generation.");

        RuleFor(x => x.Prompt)
            .MaximumLength(1000)
            .When(x => !string.IsNullOrWhiteSpace(x.Prompt));

        RuleFor(x => x.Notes)
            .MaximumLength(500)
            .When(x => !string.IsNullOrWhiteSpace(x.Notes));

        RuleFor(x => x.Style)
            .MaximumLength(50)
            .When(x => !string.IsNullOrWhiteSpace(x.Style));
    }
}
