<?php

namespace Database\Factories;

use App\Models\Project;
use App\Models\Task;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class TaskFactory extends Factory
{
    protected $model = Task::class;

    public function definition(): array
    {
        return [
            'id' => (string) Str::ulid(),
            'project_id' => Project::factory(),
            'title' => $this->faker->sentence(3),
            'description' => $this->faker->sentence(),
            'priority' => $this->faker->randomElement(['critical', 'high', 'medium', 'low']),
            'status' => $this->faker->randomElement(['todo', 'in_progress', 'review', 'done']),
            'estimated_hours' => $this->faker->randomFloat(2, 1, 40),
            'stack' => $this->faker->randomElement(['frontend', 'backend', 'mobile', 'design', 'devops', 'qa', 'other']),
            'phase' => 'Execution',
        ];
    }
}
