using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Pacem.Apps.Models
{
    public class ProductModel
    {
        /// <summary>
        /// Gets or sets the short name for the App.
        /// </summary>
        public string Name { get; set; }

        public IEnumerable<PlatformModel> Platforms { get; set; }
    }
}
