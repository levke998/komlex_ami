using System;
using System.Threading;
using System.Threading.Tasks;
using MagicDraw.Api.Application.Dtos;
using MagicDraw.Api.Domain.Entities;
using MagicDraw.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace MagicDraw.Api.Application.Services;

public class UserService : IUserService
{
    private readonly AppDbContext _db;

    public UserService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<UserResponse> CreateAsync(CreateUserRequest request, CancellationToken ct)
    {
        // TODO: Hash password properly. Storing plain for MVP prototype only.
        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = request.Username,
            Email = request.Email,
            PasswordHash = request.Password, 
            CreatedAt = DateTime.UtcNow
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct);

        return MapToResponse(user);
    }

    public async Task<UserResponse?> GetByIdAsync(Guid id, CancellationToken ct)
    {
        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id, ct);
        return user == null ? null : MapToResponse(user);
    }

    public async Task<UserResponse?> UpdateAsync(Guid id, UpdateUserRequest request, CancellationToken ct)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == id, ct);
        if (user == null) return null;

        if (!string.IsNullOrWhiteSpace(request.Username))
            user.Username = request.Username;
        if (!string.IsNullOrWhiteSpace(request.Email))
            user.Email = request.Email;

        await _db.SaveChangesAsync(ct);

        return MapToResponse(user);
    }

    private static UserResponse MapToResponse(User user)
    {
        return new UserResponse(user.Id, user.Username, user.Email, user.CreatedAt);
    }
}
