using Pacem.Apps.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Pacem.Apps
{
    public static class ReleaseModelExtensions
    {
        public static SquirrelResponse ToSquirrel(this ReleaseModel release)
        {
            // 'folderize' url
            var builder = new UriBuilder(release.UpdateDownloadUrl);
            string path = builder.Path;
            builder.Path = path.Substring(0, path.LastIndexOf('/') + 1);

            return new SquirrelResponse
            {
                Date = release.Date,
                DownloadFolderUri = builder.Uri,
                Name = release.Name,
                Notes = release.Notes
            };
        }
    }
}
