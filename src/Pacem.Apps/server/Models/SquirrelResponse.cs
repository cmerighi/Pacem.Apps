using System;
using System.Text.Json.Serialization;

namespace Pacem.Apps.Models
{
    public class SquirrelResponse
    {
        public string Name { get; set; }

        [JsonPropertyName("url")]
        public Uri DownloadFolderUri { get; set; }

        [JsonPropertyName("pub_date")]
        public DateTimeOffset? Date { get; set; }

        public string Notes { get; set; }
    }
}
