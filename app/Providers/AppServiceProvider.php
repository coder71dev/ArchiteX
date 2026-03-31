<?php

namespace App\Providers;

use App\Listeners\UpdateProjectOnAiFailover;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\ServiceProvider;
use Laravel\Ai\Events\AgentFailedOver;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // ... existence context ...
        Event::listen(
            AgentFailedOver::class,
            UpdateProjectOnAiFailover::class,
        );

        // Fix SSL locally without needing admin rights
        if (app()->environment('local')) {
            $cert = base_path('cacert.pem');
            putenv('CURL_CA_BUNDLE='.$cert);
            putenv('SSL_CERT_FILE='.$cert);

            // Force Laravel's Http client to use the certificate
            Http::globalOptions([
                'verify' => $cert,
            ]);
        }
    }
}
