using FluentValidation;
using MagicDraw.Api.Application.Dtos;

namespace MagicDraw.Api.Application.Validation;

public class CreateDrawingRequestValidator : AbstractValidator<CreateDrawingRequest>
{
    public CreateDrawingRequestValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty()
            .MaximumLength(100);

        RuleFor(x => x.Width)
            .InclusiveBetween(1, 4096);

        RuleFor(x => x.Height)
            .InclusiveBetween(1, 4096);
    }
}

public class UpdateDrawingRequestValidator : AbstractValidator<UpdateDrawingRequest>
{
    public UpdateDrawingRequestValidator()
    {
        RuleFor(x => x.Title)
            .MaximumLength(100)
            .When(x => x.Title != null);

        RuleFor(x => x.Width)
            .InclusiveBetween(1, 4096)
            .When(x => x.Width.HasValue);

        RuleFor(x => x.Height)
            .InclusiveBetween(1, 4096)
            .When(x => x.Height.HasValue);
    }
}
