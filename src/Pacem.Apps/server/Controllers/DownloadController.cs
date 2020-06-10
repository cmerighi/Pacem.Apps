using Microsoft.AspNetCore.Mvc;
using Pacem.Apps.Services;
using System.ComponentModel.DataAnnotations;
using System.Threading.Tasks;

namespace Pacem.Apps.Controllers
{
    [ApiController, Route("[controller]")]
    public class DownloadController : ControllerBase
    {
        private readonly IUpdater _updater;

        public DownloadController(IUpdater updater)
        {
            _updater = updater;
        }

        [HttpGet("{product}/{platform}/{arch}")]
        public async Task<ActionResult> DownloadAsync([Required] string product, [Required] string platform, [Required] string arch)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            Models.ReleaseModel release =  await _updater.FindLatestVersionAsync(product, platform, arch);
            if (release == null)
            {
                return NotFound();
            }

            return Redirect(release.FullDownloadUrl);
        }
    }
}
