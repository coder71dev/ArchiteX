<?php

namespace Database\Factories;

use App\Models\TeamMember;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class TeamMemberFactory extends Factory
{
    protected $model = TeamMember::class;

    public function definition(): array
    {
        return [
            'id' => (string) Str::ulid(),
            'name' => $this->faker->name(),
            'role' => $this->faker->jobTitle(),
            'stack' => $this->faker->randomElement(['frontend', 'backend', 'mobile', 'design', 'devops', 'qa', 'other']),
            'email' => $this->faker->unique()->safeEmail(),
            'availability_hours' => 40,
            'skills' => [],
            'is_active' => true,
        ];
    }
}
