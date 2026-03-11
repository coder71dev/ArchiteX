<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    use HasUlids;
    protected $fillable = [
        'user_id',
        'title',
        'brief',
        'status',
        'current_phase',
        'error_message',
        'client_name',
        'target_deadline',
        'conversation_id',
    ];

    protected $casts = [
        'id' => 'string',
        'status' => 'string',
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
}
