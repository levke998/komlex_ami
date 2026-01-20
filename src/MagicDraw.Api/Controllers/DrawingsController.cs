using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using MagicDraw.Api.Application.Dtos;
using MagicDraw.Api.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace MagicDraw.Api.Controllers;

[ApiController]
[Route("api/drawings")]
public class DrawingsController : ControllerBase
{
    private readonly IDrawingService _drawingService;

    public DrawingsController(IDrawingService drawingService)
    {
        _drawingService = drawingService;
    }

    [HttpPost]
    public async Task<ActionResult<DrawingResponse>> Create([FromBody] CreateDrawingRequest request, CancellationToken ct)
    {
        var drawing = await _drawingService.CreateAsync(request.UserId, request, ct);
        return CreatedAtAction(nameof(GetById), new { id = drawing.Id }, drawing);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<DrawingResponse>> GetById(Guid id, CancellationToken ct)
    {
        var drawing = await _drawingService.GetByIdAsync(id, ct);
        if (drawing == null)
        {
            return NotFound();
        }
        return Ok(drawing);
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<DrawingListItemResponse>>> GetAll(CancellationToken ct)
    {
        var drawings = await _drawingService.GetAllAsync(ct);
        return Ok(drawings);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _drawingService.DeleteAsync(id, ct);
        return NoContent();
    }

    // Layer Endpoints

    [HttpPost("{drawingId}/layers")]
    public async Task<ActionResult<LayerResponse>> AddLayer(Guid drawingId, [FromBody] CreateLayerRequest request, CancellationToken ct)
    {
        var layer = await _drawingService.AddLayerAsync(drawingId, request, ct);
        if (layer == null)
        {
            return NotFound("Drawing not found");
        }
        // In a real scenario we might want a specific GetLayer endpoint for CreatedAtAction, 
        // but often returning the resource is enough or pointing to the drawing.
        // For now, simple 200/201.
        return Ok(layer); 
    }

    [HttpPut("{drawingId}/layers/{layerId}")]
    public async Task<ActionResult<LayerResponse>> UpdateLayer(Guid drawingId, Guid layerId, [FromBody] UpdateLayerRequest request, CancellationToken ct)
    {
        var layer = await _drawingService.UpdateLayerAsync(drawingId, layerId, request, ct);
        if (layer == null)
        {
            return NotFound("Drawing or Layer not found");
        }
        return Ok(layer);
    }

    [HttpDelete("{drawingId}/layers/{layerId}")]
    public async Task<IActionResult> DeleteLayer(Guid drawingId, Guid layerId, CancellationToken ct)
    {
        var result = await _drawingService.DeleteLayerAsync(drawingId, layerId, ct);
        if (!result)
        {
            return NotFound("Drawing or Layer not found");
        }
        return NoContent();
    }
}
