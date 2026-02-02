using MagicDraw.Api.Application.Configuration;
using MagicDraw.Api.Application.Dtos;
using MagicDraw.Api.Domain.Entities;
using MagicDraw.Api.Domain.Exceptions;
using MagicDraw.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace MagicDraw.Api.Application.Services;

public class AdminService : IAdminService
{
    private readonly AppDbContext _context;
    private readonly AdminSettings _adminSettings;

    public AdminService(AppDbContext context, IOptions<AdminSettings> adminOptions)
    {
        _context = context;
        _adminSettings = adminOptions.Value;
    }

    public async Task<IReadOnlyList<AdminUserListItem>> GetUsersAsync(CancellationToken ct)
    {
        var users = await _context.Users
            .AsNoTracking()
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new
            {
                u.Id,
                u.Username,
                u.Email,
                u.CreatedAt,
                u.IsBanned,
                u.BannedAt,
                u.BanReason,
                WarningCount = u.Warnings.Count,
                LastWarningAt = u.Warnings.OrderByDescending(w => w.CreatedAt)
                    .Select(w => (DateTime?)w.CreatedAt)
                    .FirstOrDefault()
            })
            .ToListAsync(ct);

        return users
            .Select(u => new AdminUserListItem(
                u.Id,
                u.Username,
                u.Email,
                u.CreatedAt,
                IsAdmin(u.Email),
                u.IsBanned,
                u.BannedAt,
                u.BanReason,
                u.WarningCount,
                u.LastWarningAt
            ))
            .ToList();
    }

    public async Task<AdminUserListItem> BanUserAsync(Guid id, string? reason, string adminEmail, CancellationToken ct)
    {
        var user = await _context.Users.Include(u => u.Warnings).FirstOrDefaultAsync(u => u.Id == id, ct);
        if (user == null) throw new NotFoundException("User", id);

        EnsureNotAdmin(user.Email);

        user.IsBanned = true;
        user.BannedAt = DateTime.UtcNow;
        user.BanReason = reason;

        _context.AdminAuditLogs.Add(new AdminAuditLog
        {
            Id = Guid.NewGuid(),
            AdminEmail = adminEmail,
            Action = "ban",
            TargetType = "user",
            TargetId = user.Id,
            Message = reason
        });

        await _context.SaveChangesAsync(ct);

        return MapUser(user);
    }

    public async Task<AdminUserListItem> UnbanUserAsync(Guid id, string adminEmail, CancellationToken ct)
    {
        var user = await _context.Users.Include(u => u.Warnings).FirstOrDefaultAsync(u => u.Id == id, ct);
        if (user == null) throw new NotFoundException("User", id);

        user.IsBanned = false;
        user.BannedAt = null;
        user.BanReason = null;

        _context.AdminAuditLogs.Add(new AdminAuditLog
        {
            Id = Guid.NewGuid(),
            AdminEmail = adminEmail,
            Action = "unban",
            TargetType = "user",
            TargetId = user.Id
        });

        await _context.SaveChangesAsync(ct);

        return MapUser(user);
    }

    public async Task WarnUserAsync(Guid id, string message, string issuedBy, CancellationToken ct)
    {
        var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id, ct);
        if (user == null) throw new NotFoundException("User", id);
        EnsureNotAdmin(user.Email);

        var warning = new UserWarning
        {
            Id = Guid.NewGuid(),
            UserId = id,
            Message = message,
            IssuedBy = issuedBy,
            CreatedAt = DateTime.UtcNow
        };

        _context.UserWarnings.Add(warning);

        _context.AdminAuditLogs.Add(new AdminAuditLog
        {
            Id = Guid.NewGuid(),
            AdminEmail = issuedBy,
            Action = "warn",
            TargetType = "user",
            TargetId = id,
            Message = message
        });

        await _context.SaveChangesAsync(ct);
    }

    public async Task DeleteUserAsync(Guid id, string adminEmail, CancellationToken ct)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id, ct);
        if (user == null) throw new NotFoundException("User", id);
        EnsureNotAdmin(user.Email);

        _context.AdminAuditLogs.Add(new AdminAuditLog
        {
            Id = Guid.NewGuid(),
            AdminEmail = adminEmail,
            Action = "delete",
            TargetType = "user",
            TargetId = user.Id,
            Message = user.Email
        });

        _context.Users.Remove(user);
        await _context.SaveChangesAsync(ct);
    }

    public async Task<IReadOnlyList<AdminDrawingListItem>> GetDrawingsAsync(CancellationToken ct)
    {
        var drawings = await _context.Drawings
            .AsNoTracking()
            .Include(d => d.User)
            .OrderByDescending(d => d.CreatedAt)
            .Select(d => new AdminDrawingListItem(
                d.Id,
                d.Title,
                d.Width,
                d.Height,
                d.IsPublic,
                d.CreatedAt,
                d.UpdatedAt,
                d.UserId,
                d.User != null ? d.User.Username : "Unknown",
                d.User != null ? d.User.Email : "Unknown"
            ))
            .ToListAsync(ct);

        return drawings;
    }

    public async Task<DrawingResponse> GetDrawingAsync(Guid id, CancellationToken ct)
    {
        var drawing = await _context.Drawings
            .AsNoTracking()
            .Include(d => d.Layers)
            .FirstOrDefaultAsync(d => d.Id == id, ct);

        if (drawing == null) throw new NotFoundException("Drawing", id);

        return MapDrawing(drawing);
    }

    public async Task DeleteDrawingAsync(Guid id, string adminEmail, CancellationToken ct)
    {
        var drawing = await _context.Drawings.FirstOrDefaultAsync(d => d.Id == id, ct);
        if (drawing == null) throw new NotFoundException("Drawing", id);

        _context.AdminAuditLogs.Add(new AdminAuditLog
        {
            Id = Guid.NewGuid(),
            AdminEmail = adminEmail,
            Action = "delete",
            TargetType = "drawing",
            TargetId = drawing.Id,
            Message = drawing.Title
        });

        _context.Drawings.Remove(drawing);
        await _context.SaveChangesAsync(ct);
    }

    private static DrawingResponse MapDrawing(Drawing drawing)
    {
        return new DrawingResponse(
            drawing.Id,
            drawing.UserId,
            drawing.Title,
            drawing.Width,
            drawing.Height,
            drawing.IsPublic,
            drawing.CreatedAt,
            drawing.UpdatedAt,
            drawing.Layers.Select(MapLayer).OrderBy(l => l.OrderIndex).ToList()
        );
    }

    private static LayerResponse MapLayer(Layer layer)
    {
        return new LayerResponse(
            layer.Id,
            layer.DrawingId,
            layer.Type,
            layer.OrderIndex,
            layer.IsVisible,
            layer.IsLocked,
            layer.Content,
            layer.ImageUrl,
            layer.ConfigurationJson
        );
    }

    private AdminUserListItem MapUser(User user)
    {
        var lastWarningAt = user.Warnings.Count == 0
            ? null
            : user.Warnings.OrderByDescending(w => w.CreatedAt).Select(w => (DateTime?)w.CreatedAt).FirstOrDefault();

        return new AdminUserListItem(
            user.Id,
            user.Username,
            user.Email,
            user.CreatedAt,
            IsAdmin(user.Email),
            user.IsBanned,
            user.BannedAt,
            user.BanReason,
            user.Warnings.Count,
            lastWarningAt
        );
    }

    public async Task<IReadOnlyList<AdminAuditLogItem>> GetAuditLogsAsync(CancellationToken ct)
    {
        return await _context.AdminAuditLogs
            .AsNoTracking()
            .OrderByDescending(l => l.CreatedAt)
            .Select(l => new AdminAuditLogItem(
                l.Id,
                l.AdminEmail,
                l.Action,
                l.TargetType,
                l.TargetId,
                l.Message,
                l.CreatedAt
            ))
            .ToListAsync(ct);
    }

    private bool IsAdmin(string email)
    {
        return _adminSettings.Emails.Any(e => string.Equals(e, email, StringComparison.OrdinalIgnoreCase));
    }

    private void EnsureNotAdmin(string email)
    {
        if (IsAdmin(email))
        {
            throw new ForbiddenException("Admin users cannot be moderated.");
        }
    }
}
