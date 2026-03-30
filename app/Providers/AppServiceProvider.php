<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

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
        \Illuminate\Support\Facades\Event::listen(
            \Laravel\Ai\Events\AgentFailedOver::class,
            \App\Listeners\UpdateProjectOnAiFailover::class,
        );

        // Fix SSL locally without needing admin rights
        if (app()->environment('local')) {
            $cert = base_path('cacert.pem');
            putenv('CURL_CA_BUNDLE=' . $cert);
            putenv('SSL_CERT_FILE=' . $cert);

            // Force Laravel's Http client to use the certificate
            \Illuminate\Support\Facades\Http::globalOptions([
                'verify' => $cert,
            ]);
        }
    }
}
