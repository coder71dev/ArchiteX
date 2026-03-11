<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::factory()->create([
            'name' => 'Monarul Islam',
            'email' => 'monarul@coder71.com',
            'password' => bcrypt('password'),
        ]);

        $team = [
            ['name' => 'Khalid Hasan', 'role' => 'Frontend Developer', 'skills' => ['React', 'Inertia.js', 'TailwindCSS']],
            ['name' => 'Zakir Hossain', 'role' => 'Backend Developer', 'skills' => ['Laravel', 'MySQL', 'Redis']],
            ['name' => 'Sabbir Ahmed', 'role' => 'Fullstack Developer', 'skills' => ['Next.js', 'Node.js', 'MongoDB']],
            ['name' => 'Riyad Khan', 'role' => 'UI/UX Designer', 'skills' => ['Figma', 'Adobe XD', 'Prototyping']],
            ['name' => 'Anisur Rahman', 'role' => 'QA Engineer', 'skills' => ['Selenium', 'Unit Testing', 'Manual QA']],
        ];

        foreach ($team as $member) {
            \App\Models\TeamMember::create($member);
        }
    }
}
