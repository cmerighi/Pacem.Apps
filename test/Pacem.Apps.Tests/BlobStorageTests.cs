using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using Pacem.Apps.Services;
using Pacem.Mvc.Json;
using System;
using System.Threading.Tasks;
using Xunit;

namespace Pacem.Apps.Tests
{
    public class BlobStorageTests
    {
        private readonly BlobStorageUpdater _storage;

        public BlobStorageTests()
        {
            var config = ConfigurationRoot = new ConfigurationBuilder().AddJsonFile("config.json")
                .AddJsonFile("config.development.json", optional: true)
                .Build();

            var json = new System.Text.Json.JsonSerializerOptions();
            json.ConfigurePacemDefaults();
            var cacheOptions = new MemoryDistributedCacheOptions();
            var cache = new MemoryDistributedCache(new OptionsWrapper<MemoryDistributedCacheOptions>(cacheOptions));

            _storage = new BlobStorageUpdater(cache, config, new OptionsWrapper<System.Text.Json.JsonSerializerOptions>(json));
        }

        public IConfiguration ConfigurationRoot { get; }

        [Fact]
        public async Task Should_Retrieve_Version()
        {
            var latest = await _storage.FindLatestVersionAsync("brainside", "win32", "x64");
            Assert.NotNull(latest);
            Assert.NotNull(latest.Date);
            Assert.Contains(".exe", latest.FullDownloadUrl);
            Assert.Contains(".nupkg", latest.UpdateDownloadUrl);
            Assert.Matches(VersionComparer.VersionPattern, latest.Version);
        }
    }

}
