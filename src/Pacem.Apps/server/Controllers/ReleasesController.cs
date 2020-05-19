using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Storage;
using Microsoft.Azure.Storage.Blob;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using Pacem.Apps.Services;
using Pacem.Mvc.Acme;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace Pacem.Apps.Controllers
{
    [ApiController, Route("[controller]")]
    public class ReleasesController : ControllerBase
    {
        private readonly IUpdater _updater;
        private readonly VersionComparer _vComparer = new VersionComparer();

        public ReleasesController(IUpdater updater)
        {
            _updater = updater;
        }

        [HttpGet("check/{product}/{platform}/{arch}/{version}")]
        public async Task<ActionResult<Models.ReleaseModel>> CheckAppVersionAsync([Required] string product, [Required] string platform, [Required] string arch, [Required] string version)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var latest = await _updater.FindLatestVersionAsync(product, platform, arch);
            if (latest  != null && _vComparer.Compare(version, latest.Version) < 0)
            {
                // convert to a Squirrel response
                var squirrel = latest.ToSquirrel();
                return Ok(squirrel);
            }

            return NoContent();
        }
    }
}
