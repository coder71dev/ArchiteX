<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    use HasFactory, HasUlids;

    protected $fillable = [
        'project_id',
        'blueprint_version',
        'parent_id',
        'milestone_id',
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
        'stack',
        'checklist_items',
        'completed_checklist',
    ];

    protected $casts = [
        'id' => 'string',
        'due_date' => 'date',
        'estimated_hours' => 'decimal:2',
        'checklist_items' => 'array',
        'completed_checklist' => 'array',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function assignee()
    {
        return $this->belongsTo(TeamMember::class, 'assigned_to');
    }

    public function parent()
    {
        return $this->belongsTo(Task::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(Task::class, 'parent_id');
    }

    public function milestone()
    {
        return $this->belongsTo(Milestone::class);
    }
}
