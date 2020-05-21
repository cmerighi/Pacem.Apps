using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace Pacem.Apps.Services
{
    public interface IUpdater
    {
        Task<Models.ReleaseModel> FindLatestVersionAsync(string product, string platform, string arch);

        Task<bool> HasVersionAsync(string product, string platform, string arch, string version);
    }
}
