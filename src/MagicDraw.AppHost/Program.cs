var builder = DistributedApplication.CreateBuilder(args);

var password = builder.AddParameter("sql-password", "MagicDraw123!");

var sql = builder.AddSqlServer("sql", password, 14333)
    .WithLifetime(ContainerLifetime.Persistent)
    .AddDatabase("sqldata");

var api = builder.AddProject<Projects.MagicDraw_Api>("api")
    .WithReference(sql)
    .WaitFor(sql);

builder.AddNpmApp("web", "../MagicDraw.Web", "dev")
    .WithReference(api)
    .WithHttpEndpoint(env: "PORT")
    .WithExternalHttpEndpoints();

builder.Build().Run();
