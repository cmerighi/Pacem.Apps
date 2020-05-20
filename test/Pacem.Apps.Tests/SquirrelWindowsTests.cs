using Pacem.Apps.Services;
using System;
using System.Collections.Generic;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using Xunit;

namespace Pacem.Apps.Tests
{
    public class SquirrelWindowsTests
    {
        [Fact]
        public async Task Should_Download_RELEASES()
        {
            IUpdater updater = StartupSingletons.BlobStorageUpdater;
            var latest = await updater.FindLatestVersionAsync("brainside", "win32", "x64");
            var squirrel = latest.ToSquirrel();
            string updateUrlOrPath = squirrel.DownloadFolderUri.AbsoluteUri;
           
            if (updateUrlOrPath.EndsWith("/"))
            {
                updateUrlOrPath = updateUrlOrPath.Substring(0, updateUrlOrPath.Length - 1);
            }

            Uri uri = AppendPathToUri(new Uri(updateUrlOrPath), "RELEASES");

            string url = uri.ToString();
            var data = await DownloadUrl(url);
            string releaseFile = Encoding.UTF8.GetString(data);

            Assert.NotNull(releaseFile);
        }

        Uri AppendPathToUri(Uri uri, string path)
        {
            var builder = new UriBuilder(uri);
            if (!builder.Path.EndsWith("/"))
            {
                builder.Path += "/";
            }

            builder.Path += path;
            return builder.Uri;
        }

        bool IsHttpUrl(string urlOrPath)
        {
            var uri = default(Uri);
            if (!Uri.TryCreate(urlOrPath, UriKind.Absolute, out uri))
            {
                return false;
            }

            return uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps;
        }

        WebClient CreateWebClient()
        {
            // WHY DOESNT IT JUST DO THISSSSSSSS
            System.Net.ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12 | SecurityProtocolType.Tls11 | SecurityProtocolType.Tls;

            var ret = new WebClient();
            var wp = WebRequest.DefaultWebProxy;
            if (wp != null)
            {
                wp.Credentials = CredentialCache.DefaultCredentials;
                ret.Proxy = wp;
            }

            return ret;
        }

        async Task<byte[]> DownloadUrl(string url)
        {
            using (var wc = CreateWebClient())
            {
                var failedUrl = default(string);

            retry:
                try
                {

                    return await wc.DownloadDataTaskAsync(failedUrl ?? url);
                }
                catch (Exception)
                {
                    // NB: Some super brain-dead services are case-sensitive yet 
                    // corrupt case on upload. I can't even.
                    if (failedUrl != null) throw;

                    failedUrl = url.ToLower();
                    goto retry;
                }
            }
        }
    }
}
