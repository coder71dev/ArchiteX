<?php

namespace Database\Seeders;

use App\Models\TeamMember;
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
            ['name' => 'Khalid Hasan', 'role' => 'Frontend Developer', 'stack' => 'frontend', 'availability_hours' => 40, 'skills' => ['React', 'Inertia.js', 'TailwindCSS']],
            ['name' => 'Zakir Hossain', 'role' => 'Backend Developer', 'stack' => 'backend', 'availability_hours' => 40, 'skills' => ['Laravel', 'MySQL', 'Redis']],
            ['name' => 'Sabbir Ahmed', 'role' => 'Fullstack Developer', 'stack' => 'fullstack', 'availability_hours' => 40, 'skills' => ['Next.js', 'Node.js', 'MongoDB']],
            ['name' => 'Riyad Khan', 'role' => 'UI/UX Designer', 'stack' => 'design', 'availability_hours' => 35, 'skills' => ['Figma', 'Adobe XD', 'Prototyping']],
            ['name' => 'Anisur Rahman', 'role' => 'QA Engineer', 'stack' => 'qa', 'availability_hours' => 40, 'skills' => ['Selenium', 'Unit Testing', 'Manual QA']],
        ];

        foreach ($team as $member) {
            TeamMember::create($member);
        }
    }
}
