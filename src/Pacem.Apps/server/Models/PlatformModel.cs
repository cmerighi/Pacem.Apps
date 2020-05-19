using System.Collections.Generic;

namespace Pacem.Apps.Models
{
    public class PlatformModel
    {
        public string Name { get; set; }

        public IEnumerable<VersionModel> Versions { get; set; }
    }
}
