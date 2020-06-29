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
        private readonly IUpdater _storage;

        public BlobStorageTests()
        {
            _storage = StartupSingletons.BlobStorageUpdater;
        }

        [Fact]
        public async Task Should_Retrieve_LatestVersion()
        {
            var latest = await _storage.FindLatestVersionAsync("brainside", "win32", "x64");
            Assert.NotNull(latest);
            Assert.NotNull(latest.Date);
            Assert.Contains(".exe", latest.FullDownloadUrl);
            Assert.Contains(".nupkg", latest.UpdateDownloadUrl);
            Assert.Matches(VersionComparer.VersionPattern, latest.Version);
        }

        [Fact]
        public async Task Should_Find_Version()
        {
            var has = await _storage.HasVersionAsync("brainside", "win32", "x64", "0.0.9");
            Assert.True(has);
            var hasNot = await _storage.HasVersionAsync("brainside", "win32", "x64", "0.0.1");
            Assert.False(hasNot);
        }
    }

}
