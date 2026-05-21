<?php

namespace Database\Factories;

use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class ProjectFactory extends Factory
{
    protected $model = Project::class;

    public function definition(): array
    {
        return [
            'id' => (string) Str::ulid(),
            'user_id' => User::factory(),
            'title' => $this->faker->sentence(3),
            'brief' => $this->faker->paragraph(),
            'status' => 'planning',
            'planning_phase' => 'idea_submitted',
            'current_phase' => 'initializing',
        ];
    }
}
