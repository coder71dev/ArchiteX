<?php

namespace App\Console\Commands;

use App\Models\TeamActivity;
use App\Models\TeamMember;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class SyncCoder71DataCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'coder71:sync';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync team members and their activities from Coder71 APIs';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting sync process from Coder71 APIs...');

        // 1. Sync Staffs
        $this->syncStaffs();

        // 2. Sync Activities
        $this->syncActivities();

        $this->info('Sync completed successfully.');
    }

    private function syncStaffs()
    {
        $this->info('Fetching staffs...');
        try {
            $response = Http::get('https://project.coder71.com/index.php/api/staffs');

            if ($response->successful()) {
                $staffs = $response->json();

                $created = 0;
                $updated = 0;

                foreach ($staffs as $staff) {
                    $name = $staff['staff_name'] ?? null;
                    if (! $name) {
                        continue;
                    }

                    $member = TeamMember::where('name', $name)->first();

                    $role = $staff['job_title'] ?? 'Team Member';
                    $isActive = isset($staff['status']) && $staff['status'] === 'active';
                    $stack = $this->inferStackFromRole($role);

                    if ($member) {
                        // Update basic info without overriding skills and availability
                        $member->update([
                            'role' => $role,
                            'stack' => $stack,
                            'is_active' => $isActive,
                        ]);
                        $updated++;
                    } else {
                        // Create new member
                        TeamMember::create([
                            'name' => $name,
                            'role' => $role,
                            'stack' => $stack,
                            'is_active' => $isActive,
                            'skills' => [],
                            'availability_hours' => 8,
                        ]);
                        $created++;
                    }
                }

                $this->info("Staffs sync complete: {$created} created, {$updated} updated.");
            } else {
                $this->error('Failed to fetch staffs from API.');
            }
        } catch (\Exception $e) {
            $this->error('Error syncing staffs: '.$e->getMessage());
        }
    }

    /**
     * Infer stack category from a job title/role string.
     */
    private function inferStackFromRole(?string $role): string
    {
        if (! $role) {
            return 'other';
        }

        $r = strtolower($role);

        if (str_contains($r, 'frontend') || str_contains($r, 'react') || str_contains($r, 'vue')) {
            return 'frontend';
        }
        if (str_contains($r, 'backend') || str_contains($r, 'software engineer') || str_contains($r, 'php') || str_contains($r, 'laravel')) {
            return 'backend';
        }
        if (str_contains($r, 'flutter') || str_contains($r, 'mobile') || str_contains($r, 'ios') || str_contains($r, 'android')) {
            return 'mobile';
        }
        if (str_contains($r, 'ui') || str_contains($r, 'ux') || str_contains($r, 'design')) {
            return 'design';
        }
        if (str_contains($r, 'devops') || str_contains($r, 'infrastructure') || str_contains($r, 'aws') || str_contains($r, 'docker')) {
            return 'devops';
        }
        if (str_contains($r, 'qa') || str_contains($r, 'test')) {
            return 'qa';
        }
        if (str_contains($r, 'full-stack') || str_contains($r, 'fullstack')) {
            return 'backend'; // Default to backend for fullstack
        }

        return 'other';
    }

    private function syncActivities()
    {
        $this->info('Fetching activities...');
        try {
            $startDate = now()->subDays(30)->format('Y-m-d');
            $endDate = now()->format('Y-m-d');

            $response = Http::get('https://project.coder71.com/index.php/api/activity', [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ]);

            if ($response->successful()) {
                $activities = $response->json();

                $created = 0;

                foreach ($activities as $activity) {
                    $fullName = $activity['full_name'] ?? null;
                    if (! $fullName) {
                        continue;
                    }

                    // Find team member by name
                    $member = TeamMember::where('name', $fullName)->first();
                    if (! $member) {
                        continue;
                    }

                    // Avoid duplicate activities. Activity doesn't have unique ID in API response,
                    // so we use a combination of fields to check existence.
                    $createdAt = $activity['created_at'] ?? null;
                    if (! $createdAt) {
                        continue;
                    }

                    $exists = TeamActivity::where('team_member_id', $member->id)
                        ->where('created_at', $createdAt)
                        ->where('log_type', $activity['log_type'] ?? null)
                        ->where('project_title', $activity['project_title'] ?? null)
                        ->exists();

                    if (! $exists) {
                        TeamActivity::create([
                            'team_member_id' => $member->id,
                            'action' => $activity['action'] ?? null,
                            'log_type' => $activity['log_type'] ?? null,
                            'log_type_title' => $activity['log_type_title'] ?? null,
                            'project_title' => $activity['project_title'] ?? null,
                            'created_at' => $createdAt,
                        ]);
                        $created++;
                    }
                }

                $this->info("Activities sync complete: {$created} new activities added.");
            } else {
                $this->error('Failed to fetch activities from API.');
            }
        } catch (\Exception $e) {
            $this->error('Error syncing activities: '.$e->getMessage());
        }
    }
}
