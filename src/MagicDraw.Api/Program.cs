using MagicDraw.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using FluentValidation;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.AddSqlServerDbContext<AppDbContext>("sqldata");
builder.AddServiceDefaults();
builder.Services.AddControllers(); // Enable Controllers
builder.Services.AddValidatorsFromAssemblyContaining<Program>();
builder.Services.AddExceptionHandler<MagicDraw.Api.Infrastructure.ExceptionHandling.GlobalExceptionHandler>();
builder.Services.AddProblemDetails();
builder.Services.AddCors();
builder.Services.AddScoped<MagicDraw.Api.Services.OpenAIService>();
builder.Services.AddScoped<MagicDraw.Api.Application.Services.IUserService, MagicDraw.Api.Application.Services.UserService>();
builder.Services.AddScoped<MagicDraw.Api.Application.Services.IDrawingService, MagicDraw.Api.Application.Services.DrawingService>();
builder.Services.AddScoped<MagicDraw.Api.Application.Services.IAuthService, MagicDraw.Api.Application.Services.AuthService>();

var jwtSettings = builder.Configuration.GetSection("JwtSettings");
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(jwtSettings["Secret"]!))
    };
});

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

// Apply migrations on startup (Development only or safe environments)
if (!app.Environment.IsEnvironment("Testing"))
{
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.MigrateAsync();
    }
}

// Configure the HTTP request pipeline.
app.UseCors(policy => policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());

app.UseExceptionHandler();

app.UseAuthentication();
app.UseAuthorization();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.MapControllers(); // Map Controllers

app.UseHttpsRedirection();

app.Run();

public partial class Program { }
