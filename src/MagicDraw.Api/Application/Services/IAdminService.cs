using MagicDraw.Api.Application.Dtos;

namespace MagicDraw.Api.Application.Services;

public interface IAdminService
{
    Task<IReadOnlyList<AdminUserListItem>> GetUsersAsync(CancellationToken ct);
    Task<AdminUserListItem> BanUserAsync(Guid id, string? reason, string adminEmail, CancellationToken ct);
    Task<AdminUserListItem> UnbanUserAsync(Guid id, string adminEmail, CancellationToken ct);
    Task WarnUserAsync(Guid id, string message, string issuedBy, CancellationToken ct);
    Task DeleteUserAsync(Guid id, string adminEmail, CancellationToken ct);
    Task<IReadOnlyList<AdminDrawingListItem>> GetDrawingsAsync(CancellationToken ct);
    Task<DrawingResponse> GetDrawingAsync(Guid id, CancellationToken ct);
    Task DeleteDrawingAsync(Guid id, string adminEmail, CancellationToken ct);
    Task<IReadOnlyList<AdminAuditLogItem>> GetAuditLogsAsync(CancellationToken ct);
}
