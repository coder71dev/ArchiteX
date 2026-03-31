<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;

class TeamMember extends Model
{
    use HasUlids;

    protected $fillable = [
        'name',
        'role',
        'email',
        'availability_hours',
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
}
