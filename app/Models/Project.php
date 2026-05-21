<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    use HasFactory, HasUlids;

    protected $fillable = [
        'user_id',
        'title',
        'brief',
        'status',
        'current_phase',
        'planning_phase',
        'error_message',
        'client_name',
        'target_deadline',
        'conversation_id',
        'latest_status_message',
        'budget',
        'timeline',
        'target_audience',
        'notes',
        'clarifying_questions',
    ];

    protected $casts = [
        'id' => 'string',
        'status' => 'string',
        'clarifying_questions' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function blueprints()
    {
        return $this->hasMany(Blueprint::class);
    }

    public function latestBlueprint()
    {
        return $this->hasOne(Blueprint::class)->latestOfMany();
    }

    public function estimates()
    {
        return $this->hasMany(Estimate::class);
    }

    public function latestEstimate()
    {
        return $this->hasOne(Estimate::class)->latestOfMany();
    }

    public function proposals()
    {
        return $this->hasMany(Proposal::class);
    }

    public function latestProposal()
    {
        return $this->hasOne(Proposal::class)->latestOfMany();
    }

    public function tasks()
    {
        return $this->hasMany(Task::class);
    }

    public function milestones()
    {
        return $this->hasMany(Milestone::class)->orderBy('sort_order');
    }

    public function integrations()
    {
        return $this->hasMany(Integration::class);
    }
}
