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
            => new SquirrelResponse
            {
                Date = release.Date,
                DownloadUrl = release.UpdateDownloadUrl,
                Name = release.Name,
                Notes = release.Notes
            };
    }
}
