using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using Pacem.Apps.Services;
using Pacem.Mvc.Json;
using System;
using System.Collections.Generic;
using System.Text;

namespace Pacem.Apps.Tests
{
    public static class StartupSingletons
    {
        static StartupSingletons()
        {
            var config = ConfigurationRoot = new ConfigurationBuilder().AddJsonFile("config.json")
                .AddJsonFile("config.development.json", optional: true)
                .Build();

            var json = new System.Text.Json.JsonSerializerOptions();
            json.ConfigurePacemDefaults();
            var cacheOptions = new MemoryDistributedCacheOptions();
            var cache = new MemoryDistributedCache(new OptionsWrapper<MemoryDistributedCacheOptions>(cacheOptions));

            BlobStorageUpdater = new BlobStorageUpdater(cache, config, new OptionsWrapper<System.Text.Json.JsonSerializerOptions>(json));
        }

        public static IConfigurationRoot ConfigurationRoot { get; }
        public static BlobStorageUpdater BlobStorageUpdater { get; }
    }
}
