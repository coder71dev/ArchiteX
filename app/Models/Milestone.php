<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;

class Milestone extends Model
{
    use HasUlids;

    protected $fillable = [
        'project_id',
        'title',
        'description',
        'goal',
        'deliverables',
        'deadline',
        'status',
        'sort_order',
    ];

    protected $casts = [
        'id' => 'string',
        'deliverables' => 'array',
        'deadline' => 'date',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function tasks()
    {
        return $this->hasMany(Task::class);
    }
}
