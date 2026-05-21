<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TeamMember extends Model
{
    use HasFactory, HasUlids;

    protected $fillable = [
        'name',
        'role',
        'stack',
        'email',
        'availability_hours',
        'current_workload_hours',
        'skills',
        'is_active',
    ];

    protected $casts = [
        'id' => 'string',
        'skills' => 'array',
        'is_active' => 'boolean',
    ];

    public function tasks()
    {
        return $this->hasMany(Task::class, 'assigned_to');
    }

    public function activities()
    {
        return $this->hasMany(TeamActivity::class);
    }
}
