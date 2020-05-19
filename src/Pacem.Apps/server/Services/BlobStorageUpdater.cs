using Microsoft.Azure.Storage;
using Microsoft.Azure.Storage.Blob;
using Microsoft.Azure.Storage.Blob.Protocol;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using System;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;

namespace Pacem.Apps.Services
{

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
            _container = blobs.GetContainerReference("apps");
        }

        //public async Task<Stream> DownloadAsync(string product, string platform, string arch, string version)
        //{
        //    var latest = await FindLatestVersionAsync(product, platform, arch);
        //    if (!string.Equals(latest?.Version, version, StringComparison.OrdinalIgnoreCase))
        //    {
        //        throw new ArgumentOutOfRangeException(nameof(version), "Can only download the latest version.");
        //    }

        //    var url = latest.Uri;
        //    ICloudBlob blob = await _blobs.GetBlobReferenceFromServerAsync(url);
        //    return await blob.OpenReadAsync();
        //}

        public async Task<Models.ReleaseModel> FindLatestVersionAsync(string product, string platform, string arch)
        {
            string prefix = $"{product}/{platform}/{arch}";
            string stored = await _cache.GetStringAsync(prefix);
            if (string.IsNullOrEmpty(stored))
            {
                var comparer = new VersionComparer();
                var versions = _container.ListBlobs(prefix: prefix, useFlatBlobListing: true)
                    .OfType<CloudBlockBlob>()
                    .GroupBy(i =>
                    {
                        string folders = i.Name.Substring(0, i.Name.LastIndexOf('/'));
                        return folders.Substring(folders.LastIndexOf('/')+1);
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
                    Date = downloadBlob.Properties.Created
                };

                string json = JsonSerializer.Serialize(latestRelease, _json);
                await _cache.SetStringAsync(prefix, json, new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(30)
                });
                return latestRelease;
            }
            return JsonSerializer.Deserialize<Models.ReleaseModel>(stored, _json);
        }
    }
}
