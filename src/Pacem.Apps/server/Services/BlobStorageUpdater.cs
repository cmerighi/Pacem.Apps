using Microsoft.Azure.Storage;
using Microsoft.Azure.Storage.Blob;
using Microsoft.Azure.Storage.Blob.Protocol;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace Pacem.Apps.Services
{
    internal class ReleaseStorage
    {
        public Dictionary<string, ReleasePlatform> Platforms { get; set; } = new Dictionary<string, ReleasePlatform>();
    }

    internal class ReleasePlatform
    {
        public Dictionary<string, ReleaseArchitecture> Architectures { get; set; } = new Dictionary<string, ReleaseArchitecture>();
    }

    internal class ReleaseArchitecture
    {
        public List<string> Versions { get; set; } = new List<string>();
    }


    public class BlobStorageUpdater : IUpdater
    {
        private readonly JsonSerializerOptions _json;
        private readonly IDistributedCache _cache;
        private readonly CloudBlobContainer _container;
        private readonly CloudBlobClient _blobs;
        private readonly CloudStorageAccount _account;

        public BlobStorageUpdater(IDistributedCache cache, IConfiguration configuration, IOptions<JsonSerializerOptions> json)
        {
            _json = json.Value;
            _cache = cache;
            var account = _account = CloudStorageAccount.Parse(configuration.GetConnectionString("blob"));
            var blobs = _blobs = account.CreateCloudBlobClient();
            string containerName = configuration.GetValue<string>("StorageContainer") ?? "apps";
            _container = blobs.GetContainerReference(containerName);
        }

        /// <summary>
        /// Gets the base virtual path for the stored releases in the blob container.
        /// </summary>
        public string BasePath { get; }

        private string GetFullPath(string releasePath)
            => string.Concat(BasePath, "/", releasePath).RemoveLeadingSlash();

        private async Task<ReleaseStorage> GetProductReleaseStorageAsync(string product)
        {
            string key = $"{product.ToLowerInvariant()}-versions";
            string stored = await _cache.GetStringAsync(key);
            if (string.IsNullOrEmpty(stored))
            {
                string prefix = GetFullPath(product);
                var folders = _container.ListBlobs(
                    prefix: prefix,
                    useFlatBlobListing: true
                    )
                    .OfType<CloudBlockBlob>()
                    .GroupBy(i => i.Name.Substring(0, i.Name.LastIndexOf('/')))
                    .Select(i => i.Key.Substring(prefix.Length + 1).ToLowerInvariant())
                    .ToList();

                var storage = new ReleaseStorage();
                foreach (var folder in folders)
                {
                    string[] segments = folder.Split('/');

                    if (segments.Length < 3)
                    {
                        continue;
                    }

                    string platform = segments[0],
                        arch = segments[1],
                        version = segments[2];

                    if (!storage.Platforms.TryGetValue(platform, out var releasePlatform))
                    {
                        storage.Platforms.Add(platform, releasePlatform = new ReleasePlatform());
                    }
                    if (!releasePlatform.Architectures.TryGetValue(arch, out var releaseArchitecture))
                    {
                        releasePlatform.Architectures.Add(arch, releaseArchitecture = new ReleaseArchitecture());
                    }
                    releaseArchitecture.Versions.Add(version);
                }

                string json = JsonSerializer.Serialize(storage, _json);
                await _cache.SetStringAsync(key, json, new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(30)
                });
                return storage;
            }
            return JsonSerializer.Deserialize<ReleaseStorage>(stored, _json);
        }

        public async Task<bool> HasVersionAsync(string product, string platform, string arch, string version)
        {
            var storage = await GetProductReleaseStorageAsync(product);
            return storage.Platforms.TryGetValue(platform, out var releasePlatform)
                && releasePlatform.Architectures.TryGetValue(arch, out var releaseArchitecture)
                && releaseArchitecture.Versions.Contains(version);
        }

        public async Task<Models.ReleaseModel> FindLatestVersionAsync(string product, string platform, string arch)
        {
            string key = $"{product}/{platform}/{arch}";
            string stored = await _cache.GetStringAsync(key);
            if (string.IsNullOrEmpty(stored))
            {
                string prefix = GetFullPath(key);
                var comparer = new VersionComparer();
                var versions = _container.ListBlobs(prefix: prefix, useFlatBlobListing: true)
                    .OfType<CloudBlockBlob>()
                    .GroupBy(i =>
                    {
                        string folders = i.Name.Substring(0, i.Name.LastIndexOf('/'));
                        return folders.Substring(folders.LastIndexOf('/') + 1);
                    })
                    .OrderByDescending(b => b.Key, comparer);
                var latest = versions.FirstOrDefault();

                // found at least one blob?
                if (latest == null)
                {
                    return default;
                }

                // create SAS-token
                DateTimeOffset from = DateTimeOffset.UtcNow,
                    to = from.AddHours(1D);

                // both .exe and .nupkg should be available,
                // otherwise throw (.Single())
                var downloadBlob = latest.Where(i => i.Name.EndsWith(".exe", StringComparison.OrdinalIgnoreCase)).Single();
                var updateBlob = latest.Where(i => i.Name.EndsWith(".nupkg", StringComparison.OrdinalIgnoreCase)).Single();
                // RELEASES mandatory as well
                var releasesBlob = latest.Where(i => i.Name.EndsWith("RELEASES", StringComparison.OrdinalIgnoreCase)).Single();

                var sasQuery = _account.GetSharedAccessSignature(new SharedAccessAccountPolicy
                {
                    Permissions = SharedAccessAccountPermissions.Read,
                    SharedAccessStartTime = from,
                    SharedAccessExpiryTime = to,
                    Services = SharedAccessAccountServices.Blob,
                    ResourceTypes = SharedAccessAccountResourceTypes.Object
                });

                var latestRelease = new Models.ReleaseModel
                {
                    FullDownloadUrl = string.Concat(downloadBlob.Uri, sasQuery),
                    UpdateDownloadUrl = string.Concat(updateBlob.Uri, sasQuery),
                    Name = product,
                    Version = latest.Key,
                    Platform = platform,
                    Architecture = arch,
                    Date = updateBlob.Properties.Created,
                    ReleasesContent = await releasesBlob.DownloadTextAsync()
                };

                string json = JsonSerializer.Serialize(latestRelease, _json);
                await _cache.SetStringAsync(key, json, new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(30)
                });
                return latestRelease;
            }
            return JsonSerializer.Deserialize<Models.ReleaseModel>(stored, _json);
        }
    }
}
