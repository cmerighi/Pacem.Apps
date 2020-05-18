using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Pacem.Apps.Controllers
{
    [ApiController, Route("api")]
    public class UpdateController : ControllerBase
    {
        [HttpGet("check/{app}/{platform}/{version}")]
        public Task<string> CheckAppVersion(string app, string platform, string version)
        {

        }
    }
}
