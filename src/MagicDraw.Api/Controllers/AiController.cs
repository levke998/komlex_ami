using MagicDraw.Api.Application.Dtos;
using MagicDraw.Api.Services;
using Microsoft.AspNetCore.Mvc;
using FluentValidation;
using System.Threading;

namespace MagicDraw.Api.Controllers;

[ApiController]
[Route("api/ai")]
public class AiController : ControllerBase
{
    private readonly OpenAIService _aiService;
    private readonly IValidator<GenerateRequest> _validator;
    private readonly IValidator<RewritePromptRequest> _rewriteValidator;
    private readonly IValidator<AutoCaptionRequest> _captionValidator;

    public AiController(
        OpenAIService aiService,
        IValidator<GenerateRequest> validator,
        IValidator<RewritePromptRequest> rewriteValidator,
        IValidator<AutoCaptionRequest> captionValidator)
    {
        _aiService = aiService;
        _validator = validator;
        _rewriteValidator = rewriteValidator;
        _captionValidator = captionValidator;
    }

    [HttpPost("generate")]
    public async Task<IActionResult> Generate([FromBody] GenerateRequest req)
    {
        var validationResult = await _validator.ValidateAsync(req);
        if (!validationResult.IsValid)
        {
            return BadRequest(validationResult.ToDictionary());
        }

        try
        {
            var base64Image = await _aiService.GenerateImageAsync(req.Prompt);
            return Ok(new { image = $"data:image/png;base64,{base64Image}" });
        }
        catch (Exception ex)
        {
            return Problem(ex.Message);
        }
    }

    [HttpPost("rewrite")]
    public async Task<IActionResult> Rewrite([FromBody] RewritePromptRequest req, CancellationToken ct)
    {
        var validationResult = await _rewriteValidator.ValidateAsync(req, ct);
        if (!validationResult.IsValid)
        {
            return BadRequest(validationResult.ToDictionary());
        }

        try
        {
            var rewritten = await _aiService.RewritePromptAsync(req.Prompt, req.Style, ct);
            return Ok(new RewritePromptResponse(rewritten));
        }
        catch (Exception ex)
        {
            return Problem(ex.Message);
        }
    }

    [HttpPost("caption")]
    public async Task<IActionResult> Caption([FromBody] AutoCaptionRequest req, CancellationToken ct)
    {
        var validationResult = await _captionValidator.ValidateAsync(req, ct);
        if (!validationResult.IsValid)
        {
            return BadRequest(validationResult.ToDictionary());
        }

        try
        {
            var (title, description) = await _aiService.GenerateCaptionAsync(
                req.Prompt,
                req.Notes,
                req.LayerCount,
                req.HasGlow,
                req.Style,
                ct);
            return Ok(new AutoCaptionResponse(title, description));
        }
        catch (Exception ex)
        {
            return Problem(ex.Message);
        }
    }
}
