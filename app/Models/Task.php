<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    use HasUlids;

    protected $fillable = [
        'project_id',
        'blueprint_version',
        'assigned_to',
        'milestone_index',
        'title',
        'description',
        'priority',
        'status',
        'due_date',
        'estimated_hours',
        'phase',
        'sort_order',
    ];

    protected $casts = [
        'id' => 'string',
        'due_date' => 'date',
        'estimated_hours' => 'decimal:2',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function assignee()
    {
        return $this->belongsTo(TeamMember::class, 'assigned_to');
    }
}
