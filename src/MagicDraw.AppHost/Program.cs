var builder = DistributedApplication.CreateBuilder(args);

var sql = builder.AddSqlServer("sql")
    .AddDatabase("sqldata");

var api = builder.AddProject<Projects.MagicDraw_Api>("api")
    .WithReference(sql);

builder.AddNpmApp("web", "../MagicDraw.Web", "dev")
    .WithReference(api)
    .WithHttpEndpoint(env: "PORT")
    .WithExternalHttpEndpoints();

builder.Build().Run();
