using FluentValidation;
using MagicDraw.Api.Application.Dtos;
using MagicDraw.Api.Domain.Enums;
using System;

namespace MagicDraw.Api.Application.Validation;

public class CreateLayerRequestValidator : AbstractValidator<CreateLayerRequest>
{
    public CreateLayerRequestValidator()
    {
        RuleFor(x => x.Type)
            .IsInEnum();

        RuleFor(x => x.ImageUrl)
            .Must(uri => Uri.TryCreate(uri, UriKind.Absolute, out _))
            .When(x => !string.IsNullOrEmpty(x.ImageUrl))
            .WithMessage("ImageUrl must be a valid URL.");
    }
}

public class UpdateLayerRequestValidator : AbstractValidator<UpdateLayerRequest>
{
    public UpdateLayerRequestValidator()
    {
        RuleFor(x => x.ImageUrl)
            .Must(uri => Uri.TryCreate(uri, UriKind.Absolute, out _))
            .When(x => !string.IsNullOrEmpty(x.ImageUrl))
            .WithMessage("ImageUrl must be a valid URL.");
    }
}
