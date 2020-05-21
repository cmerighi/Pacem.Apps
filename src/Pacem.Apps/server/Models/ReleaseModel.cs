using System;

namespace Pacem.Apps.Models
{
    public class ReleaseModel
    {
        public Uri Uri { get; set; }
        public string Name { get; set; }

        public string Version { get; set; }

        public string Platform { get; set; }

        public string Architecture { get; set; }

        public string FullDownloadUrl { get; set; }

        public string UpdateDownloadUrl { get; set; }

        public string Notes { get; set; }

        public DateTimeOffset? Date { get; set; }

        public string ReleasesContent { get; set; }
    }
}
