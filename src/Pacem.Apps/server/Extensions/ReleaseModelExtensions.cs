using Pacem.Apps.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace Pacem.Apps
{
    public static class ReleaseModelExtensions
    {
        public static SquirrelMacResponse ToSquirrelMac(this ReleaseModel release) 
            => new SquirrelMacResponse
        {
            Date = release.Date,
            DownloadFolderUri = new Uri(release.UpdateDownloadUrl, UriKind.Absolute),
            Name = release.Version,
            Notes = release.Notes
        };

        const string ReleaseEntryPattern = @"^(?<Hash>(?<Bom>\uFEFF)?[0-9a-fA-F]{40})\s+(\S+)\s+(?<Size>\d+[\r]*)$";

        public static string ToSquirrelWindows(this ReleaseModel release)
        {
            var match = Regex.Match(release.ReleasesContent, ReleaseEntryPattern);
            if (match?.Success != true)
            {
                throw new ArgumentException("Invalid release content", nameof(release));
            }

            string hash = match.Groups["Hash"].Value,
                size = match.Groups["Size"].Value;
            return string.Concat(hash, " ", release.UpdateDownloadUrl, " ", size);
        }
    }
}
