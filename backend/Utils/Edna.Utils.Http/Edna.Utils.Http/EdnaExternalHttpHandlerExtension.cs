﻿// --------------------------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
// --------------------------------------------------------------------------------------------

using Microsoft.Extensions.DependencyInjection;

namespace Edna.Utils.Http
{
    public static class EdnaExternalHttpHandlerExtension
    {
        public static void AddEdnaExternalHttpClientHandler(this IServiceCollection services)
        {
            services.AddHttpClient(nameof(EdnaExternalHttpHandler)).ConfigurePrimaryHttpMessageHandler(() => new EdnaExternalHttpHandler());
        }
    }
}
