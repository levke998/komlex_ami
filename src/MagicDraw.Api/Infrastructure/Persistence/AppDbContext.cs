using MagicDraw.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MagicDraw.Api.Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Drawing> Drawings { get; set; }
    public DbSet<Layer> Layers { get; set; }
    public DbSet<AiGeneration> AiGenerations { get; set; }
    public DbSet<UserWarning> UserWarnings { get; set; }
    public DbSet<AdminAuditLog> AdminAuditLogs { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>()
            .HasMany(u => u.Drawings)
            .WithOne(d => d.User)
            .HasForeignKey(d => d.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Username)
            .IsUnique();

        modelBuilder.Entity<User>()
            .HasMany(u => u.AiGenerations) // If User has this collection
            .WithOne(g => g.User)
            .HasForeignKey(g => g.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<User>()
            .HasMany(u => u.Warnings)
            .WithOne(w => w.User)
            .HasForeignKey(w => w.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Drawing>()
            .HasMany(d => d.Layers)
            .WithOne(l => l.Drawing)
            .HasForeignKey(l => l.DrawingId)
            .OnDelete(DeleteBehavior.Cascade);
            
        modelBuilder.Entity<AiGeneration>()
            .Property(a => a.Status)
            .HasConversion<string>();
            
        modelBuilder.Entity<Layer>()
            .Property(l => l.Type)
            .HasConversion<string>();
    }
}
